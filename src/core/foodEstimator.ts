import { DISHES, DISH_CATEGORIES, type Dish } from '../data/dishes';
import type { Food } from './types';

export type Size = 'small' | 'medium' | 'large';
export const SIZE_FACTOR: Record<Size, number> = { small: 0.7, medium: 1, large: 1.4 };

export interface Estimate {
  query: string;
  matched: string[]; // names of the reference dishes used
  unmatched: string[]; // parts we could not identify
  grams: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  per100: { kcal: number; p: number; c: number; f: number };
  tags: string[];
  confidence: 'high' | 'medium' | 'low';
  servingLabel: string;
  note?: string;
}

const NUMBER_WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 0.5, quarter: 0.25 };
const STOP = new Set(['with', 'and', 'of', 'the', 'a', 'an', 'in', 'on', 'my', 'some', 'plate', 'bowl', 'cup', 'glass', 'piece', 'pieces', 'slice', 'slices', 'serving', 'servings', 'pcs', 'pc', 'can', 'bottle', 'x']);
const FRIED = /\b(deep[- ]?fried|fried|crispy|breaded|battered|tempura)\b/;
const RICH = /\b(creamy|cheesy|buttered|buttery|glazed|loaded|extra cheese|with cheese|with butter|sweetened|sweet)\b/;
const LIGHT = /\b(grilled|steamed|boiled|baked|roasted|poached|light|lite|skinless|no sugar|unsweetened|diet|zero)\b/;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s/.]/g, ' ').replace(/\s+/g, ' ').trim();
const stem = (w: string) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
const tokens = (s: string) => norm(s).split(' ').map(stem).filter((w) => w && !STOP.has(w) && !/^\d/.test(w));

function tokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const n = Math.min(a.length, b.length);
  return n >= 4 && (a.startsWith(b) || b.startsWith(a));
}

function scoreDish(q: string[], qFull: string, d: Dish): number {
  let best = 0;
  for (const name of [d.name, ...d.aliases]) {
    const t = tokens(name);
    if (!t.length || !q.length) continue;
    const hit = q.filter((w) => t.some((x) => tokenMatch(w, x))).length;
    const hitN = t.filter((x) => q.some((w) => tokenMatch(w, x))).length;
    let s = (hit / q.length) * 0.6 + (hitN / t.length) * 0.4;
    const nn = norm(name);
    if (nn && (qFull.includes(nn) || nn.includes(qFull))) s += 0.25;
    if (s > best) best = s;
  }
  return best;
}

export function suggestDishes(query: string, limit = 6): Dish[] {
  const qFull = norm(query);
  const q = tokens(query);
  if (!q.length) return [];
  return DISHES.map((d) => ({ d, s: scoreDish(q, qFull, d) }))
    .filter((x) => x.s >= 0.45)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.d);
}

function parseQuantity(text: string): { qty: number; rest: string; explicit: boolean } {
  const m = norm(text).match(/^(\d+(?:\.\d+)?|\d+\/\d+|a|an|one|two|three|four|five|six|half|quarter)\b\s*(?:x|pcs?|pieces?|slices?|cups?|bowls?|plates?|glasses?|cans?|bottles?|servings?|scoops?|sticks?|wedges?)?\s*(?:of\s+)?(.*)$/);
  if (!m) return { qty: 1, rest: norm(text), explicit: false };
  const raw = m[1];
  let qty = 1;
  if (raw.includes('/')) { const [a, b] = raw.split('/').map(Number); qty = b ? a / b : 1; }
  else qty = NUMBER_WORDS[raw] ?? parseFloat(raw);
  if (!isFinite(qty) || qty <= 0) qty = 1;
  return { qty: Math.min(qty, 20), rest: m[2] || norm(text), explicit: true };
}

interface Part { d: Dish | null; score: number; qty: number; explicit: boolean; text: string; mult: number }

function methodMultiplier(text: string, d: Dish): number {
  const n = norm(d.name + ' ' + d.aliases.join(' '));
  if (FRIED.test(text) && !FRIED.test(n) && !/fried|crispy/.test(n)) return 1.3;
  if (RICH.test(text) && !RICH.test(n)) return 1.12;
  if (LIGHT.test(text) && !LIGHT.test(n)) return 0.92;
  return 1;
}

function matchPart(text: string): Part {
  const { qty, rest, explicit } = parseQuantity(text);
  const q = tokens(rest.replace(FRIED, ' ').replace(LIGHT, ' ').replace(RICH, ' '));
  const qFull = norm(rest);
  let best: Dish | null = null;
  let score = 0;
  if (q.length) {
    for (const d of DISHES) {
      const s = scoreDish(q, qFull, d);
      if (s > score) { score = s; best = d; }
    }
  }
  return { d: score >= 0.5 ? best : null, score, qty, explicit, text: rest, mult: best && score >= 0.5 ? methodMultiplier(text, best) : 1 };
}

/**
 * Estimate calories and macros for something the user typed ("2 eggs and 1 cup of rice", "chicken adobo").
 * Composite meals ("rice and egg") are split and summed. If nothing is recognised, pass a category.
 */
export function estimateFood(query: string, opts: { size?: Size; grams?: number; category?: string } = {}): Estimate | null {
  const size = opts.size ?? 'medium';
  const raw = norm(query);
  if (!raw) return null;
  const pieces = raw.split(/\s+(?:and|with|plus)\s+|\s*[+,&]\s*/).map((s) => s.trim()).filter(Boolean);
  const parts = (pieces.length > 1 ? pieces : [raw]).map(matchPart);
  const found = parts.filter((p) => p.d);
  const unmatched = parts.filter((p) => !p.d).map((p) => p.text);

  let kcal = 0, p = 0, c = 0, f = 0, grams = 0;
  const tags = new Set<string>();
  const matched: string[] = [];
  let labelOf = 'serving';

  if (found.length) {
    const only = found.length === 1;
    for (const part of found) {
      const d = part.d!;
      const unitCount = parseInt(d.servingLabel, 10);
      const perUnit = unitCount > 1 ? d.servingG / unitCount : d.servingG;
      const base = part.explicit && unitCount > 1 ? perUnit * part.qty : d.servingG * part.qty;
      const g = only && opts.grams ? opts.grams : base * SIZE_FACTOR[size];
      const k = g / 100;
      kcal += d.kcal * k * part.mult;
      p += d.p * k;
      c += d.c * k;
      f += d.f * k * (part.mult > 1 ? part.mult : 1);
      grams += g;
      d.tags.forEach((t) => tags.add(t));
      matched.push(d.name);
      labelOf = d.servingLabel;
    }
  } else if (opts.category) {
    const cat = DISH_CATEGORIES.find((x) => x.id === opts.category);
    if (!cat) return null;
    const g = opts.grams ?? cat.servingG * SIZE_FACTOR[size];
    const k = g / 100;
    kcal = cat.kcal * k; p = cat.p * k; c = cat.c * k; f = cat.f * k; grams = g;
    matched.push(cat.name);
    labelOf = cat.servingLabel;
  } else {
    return null;
  }

  const confidence: Estimate['confidence'] = !found.length ? 'low' : unmatched.length ? 'medium' : found.every((x) => x.score >= 0.85) ? 'high' : 'medium';
  const per100 = grams > 0 ? { kcal: (kcal / grams) * 100, p: (p / grams) * 100, c: (c / grams) * 100, f: (f / grams) * 100 } : { kcal: 0, p: 0, c: 0, f: 0 };
  return {
    query: query.trim(), matched, unmatched, grams: Math.round(grams), kcal: Math.round(kcal), p: Math.round(p * 10) / 10, c: Math.round(c * 10) / 10, f: Math.round(f * 10) / 10,
    per100, tags: [...tags], confidence, servingLabel: found.length > 1 ? 'your meal' : labelOf,
    note: unmatched.length ? `Not recognised: ${unmatched.join(', ')} (left out of the total)` : undefined,
  };
}

/** Turn an estimate into a reusable custom food (one serving = the estimated portion). */
export function estimateToFood(e: Estimate, id: string): Food {
  return {
    id, name: e.query.replace(/\s+/g, ' ').trim().replace(/^./, (x) => x.toUpperCase()), cat: 'carb',
    kcal: Math.round(e.per100.kcal * 10) / 10, p: Math.round(e.per100.p * 10) / 10, c: Math.round(e.per100.c * 10) / 10, f: Math.round(e.per100.f * 10) / 10,
    servingG: Math.max(1, e.grams), servingLabel: e.servingLabel === 'your meal' ? '1 portion' : e.servingLabel, tags: e.tags, meals: ['b', 'l', 'd', 's'], estimated: true,
  };
}
