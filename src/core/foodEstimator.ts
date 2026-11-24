import { DISHES, DISH_CATEGORIES, type Dish, type DishCategory } from '../data/dishes';
import { foods as globalFoods } from '../data/regions/global';
import { foods as phFoods } from '../data/regions/ph';
import type { Food } from './types';

export type Size = 'small' | 'medium' | 'large';
export const SIZE_FACTOR: Record<Size, number> = { small: 0.7, medium: 1, large: 1.4 };

export interface UnmatchedPart {
  text: string;
  category: string; // category id used for this part (guessed unless the user chose)
  categoryName: string;
  guessed: boolean;
}

export interface Estimate {
  query: string;
  matched: string[]; // names of the reference dishes used
  unmatched: UnmatchedPart[]; // parts we could not identify; estimated from a category
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

/** Reference dishes and ingredients, plus every food in the built-in lists so the two always agree. */
const ALL: Dish[] = (() => {
  const seen = new Set(DISHES.map((d) => d.name.toLowerCase()));
  const extra: Dish[] = [];
  for (const f of [...phFoods, ...globalFoods]) {
    const key = f.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    extra.push({ name: f.name, aliases: [], kcal: f.kcal, p: f.p, c: f.c, f: f.f, servingG: f.servingG, servingLabel: f.servingLabel, tags: f.tags ?? [] });
  }
  return [...DISHES, ...extra];
})();

const NUMBER_WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 0.5, quarter: 0.25 };
const STOP = new Set(['with', 'and', 'of', 'the', 'a', 'an', 'in', 'on', 'my', 'some', 'plate', 'bowl', 'cup', 'glass', 'piece', 'pieces', 'slice', 'slices', 'serving', 'servings', 'pcs', 'pc', 'can', 'bottle', 'x', 'topped', 'extra', 'little', 'bit']);
const FRIED = /\b(deep[- ]?fried|fried|crispy|breaded|battered|tempura)\b/;
const RICH = /\b(creamy|cheesy|buttered|buttery|glazed|loaded|extra cheese|with cheese|with butter|sweetened|sweet)\b/;
const LIGHT = /\b(grilled|steamed|boiled|baked|roasted|poached|light|lite|skinless|no sugar|unsweetened|diet|zero)\b/;

/** Absolute amounts (grams) for units that do not depend on the food. */
const UNIT_GRAMS: Record<string, number> = { tbsp: 15, tablespoon: 15, tablespoons: 15, tbsps: 15, tsp: 5, teaspoon: 5, teaspoons: 5, tsps: 5, g: 1, gram: 1, grams: 1, kg: 1000, oz: 28.35, ounce: 28.35, ounces: 28.35, ml: 1, handful: 30, handfuls: 30, clove: 5, cloves: 5 };
const UNITS = 'x|pcs?|pieces?|slices?|cups?|bowls?|plates?|glasses?|cans?|bottles?|servings?|scoops?|sticks?|wedges?|strips?|tbsps?|tablespoons?|tsps?|teaspoons?|kg|grams?|g|oz|ounces?|ml|handfuls?|cloves?';

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
  return ALL.map((d) => ({ d, s: scoreDish(q, qFull, d) }))
    .filter((x) => x.s >= 0.45)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.d);
}

interface Quantity { qty: number; unit: string; rest: string; explicit: boolean }

function parseQuantity(text: string): Quantity {
  const re = new RegExp(`^(\\d+(?:\\.\\d+)?|\\d+/\\d+|a|an|one|two|three|four|five|six|half|quarter)\\s*(?:(${UNITS})\\b)?\\s*(?:of\\s+)?(.*)$`);
  const m = norm(text).match(re);
  if (!m) return { qty: 1, unit: '', rest: norm(text), explicit: false };
  const raw = m[1];
  let qty = 1;
  if (raw.includes('/')) { const [a, b] = raw.split('/').map(Number); qty = b ? a / b : 1; }
  else qty = NUMBER_WORDS[raw] ?? parseFloat(raw);
  if (!isFinite(qty) || qty <= 0) qty = 1;
  const isWordQty = raw in NUMBER_WORDS && !m[2] && (raw === 'a' || raw === 'an');
  return { qty: Math.min(qty, 2000), unit: m[2] ?? '', rest: m[3] || norm(text), explicit: !isWordQty };
}

/** Best guess at what an unrecognised part is, from words in it. */
const CATEGORY_HINTS: [RegExp, string][] = [
  [/\b(mayo|mayonnaise|dressing|sauce|dip|spread|gravy|aioli|ketchup|vinaigrette|marinade|paste|relish|jam|syrup)\b/, 'sauce'],
  [/\b(oil|butter|lard|ghee|margarine|shortening)\b/, 'fat'],
  [/\b(soup|broth|stew|sinigang|tinola|chowder)\b/, 'soup'],
  [/\b(salad|veggie|vegetable|vegetables|greens|slaw)\b/, 'veg'],
  [/\b(fish|tuna|salmon|shrimp|prawn|squid|crab|seafood|sardine|tilapia|bangus|clam|mussel|oyster|eel)\b/, 'fish'],
  [/\b(chicken|beef|pork|lamb|meat|steak|ham|bacon|sausage|turkey|duck|burger|meatball|ribs)\b/, 'meat'],
  [/\b(rice|congee|porridge|risotto|couscous|oats|oatmeal|quinoa)\b/, 'rice'],
  [/\b(noodle|noodles|pasta|spaghetti|ramen|udon|macaroni|lasagna|pancit)\b/, 'noodle'],
  [/\b(bread|sandwich|bun|toast|bagel|pie|pastry|wrap|burrito|pizza|croissant|roll)\b/, 'bread'],
  [/\b(egg|eggs|omelette|omelet|frittata)\b/, 'egg'],
  [/\b(cheese|yogurt|yoghurt|milk|cream|custard|pudding|ice cream)\b/, 'dairy'],
  [/\b(cake|cookie|cookies|candy|chocolate|dessert|brownie|donut|doughnut|sweet|sweets|gummy|pastry)\b/, 'sweet'],
  [/\b(chips|crisps|snack|cracker|crackers|popcorn|pretzel|bar)\b/, 'snack'],
  [/\b(fruit|apple|banana|orange|mango|grape|berry|berries|melon|pineapple|papaya)\b/, 'fruit'],
  [/\b(juice|soda|cola|tea|coffee|smoothie|shake|drink|latte)\b/, 'drink'],
  [/\b(beer|wine|vodka|whisky|whiskey|rum|gin|cocktail|liquor|sake|soju)\b/, 'alcohol'],
  [/\b(fried|crispy|battered|breaded|nugget|nuggets|fries)\b/, 'fried'],
];

export function guessCategory(text: string): string {
  const t = norm(text);
  for (const [re, id] of CATEGORY_HINTS) if (re.test(t)) return id;
  return 'mixed';
}

const catOf = (id: string): DishCategory => DISH_CATEGORIES.find((c) => c.id === id) ?? DISH_CATEGORIES.find((c) => c.id === 'mixed')!;

interface Part { d: Dish | null; score: number; q: Quantity; mult: number; text: string }

function methodMultiplier(text: string, d: Dish): number {
  const n = norm(d.name + ' ' + d.aliases.join(' '));
  if (FRIED.test(text) && !FRIED.test(n) && !/fried|crispy/.test(n)) return 1.3;
  if (RICH.test(text) && !RICH.test(n)) return 1.12;
  if (LIGHT.test(text) && !LIGHT.test(n)) return 0.92;
  return 1;
}

function matchPart(text: string): Part {
  const q = parseQuantity(text);
  const toks = tokens(q.rest.replace(FRIED, ' ').replace(LIGHT, ' ').replace(RICH, ' '));
  const qFull = norm(q.rest);
  let best: Dish | null = null;
  let score = 0;
  if (toks.length) {
    for (const d of ALL) {
      const s = scoreDish(toks, qFull, d);
      if (s > score) { score = s; best = d; }
    }
  }
  const ok = score >= 0.5 && best;
  return { d: ok ? best : null, score, q, mult: ok ? methodMultiplier(text, best!) : 1, text: q.rest };
}

/** Grams for a part: an absolute unit (tbsp, g, oz...) wins; otherwise a count of servings (or of single items). */
function gramsFor(part: Part, servingG: number, servingLabel: string, size: Size): number {
  const { qty, unit, explicit } = part.q;
  const abs = UNIT_GRAMS[unit];
  if (abs) return qty * abs;
  const unitCount = parseInt(servingLabel, 10);
  const perItem = unitCount > 1 ? servingG / unitCount : servingG;
  const base = explicit && unitCount > 1 ? perItem * qty : servingG * qty;
  return base * SIZE_FACTOR[size];
}

/**
 * Estimate calories and macros for something the user typed ("2 eggs and 1 cup of rice", "cucumber salad with tuna
 * and Japanese mayo"). Composite meals are split into parts and summed. Parts that are not in the reference list are
 * estimated from a guessed category instead of being dropped, and the user can change that category.
 */
export function estimateFood(query: string, opts: { size?: Size; grams?: number; category?: string; partCategories?: Record<string, string> } = {}): Estimate | null {
  const size = opts.size ?? 'medium';
  const raw = norm(query);
  if (!raw) return null;
  const pieces = raw.split(/\s+(?:and|with|plus|w\/|topped with)\s+|\s*[+,&]\s*/).map((s) => s.trim()).filter(Boolean);
  const parts = (pieces.length > 1 ? pieces : [raw]).map(matchPart);
  const found = parts.filter((p) => p.d);
  const missing = parts.filter((p) => !p.d);

  let kcal = 0, p = 0, c = 0, f = 0, grams = 0;
  const tags = new Set<string>();
  const matched: string[] = [];
  const unmatched: UnmatchedPart[] = [];
  let labelOf = 'serving';

  if (!found.length) {
    if (!opts.category) return null;
    const cat = catOf(opts.category);
    const g = opts.grams ?? cat.servingG * SIZE_FACTOR[size];
    const k = g / 100;
    kcal = cat.kcal * k; p = cat.p * k; c = cat.c * k; f = cat.f * k; grams = g;
    matched.push(cat.name);
    labelOf = cat.servingLabel;
  } else {
    const only = found.length === 1 && !missing.length;
    for (const part of found) {
      const d = part.d!;
      const g = only && opts.grams ? opts.grams : gramsFor(part, d.servingG, d.servingLabel, size);
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
    for (const part of missing) {
      const chosen = opts.partCategories?.[part.text];
      const catId = chosen ?? guessCategory(part.text);
      const cat = catOf(catId);
      const g = gramsFor(part, cat.servingG, cat.servingLabel, size);
      const k = g / 100;
      kcal += cat.kcal * k; p += cat.p * k; c += cat.c * k; f += cat.f * k; grams += g;
      unmatched.push({ text: part.text, category: cat.id, categoryName: cat.name, guessed: !chosen });
    }
  }

  const confidence: Estimate['confidence'] = !found.length ? 'low' : missing.length ? 'medium' : found.every((x) => x.score >= 0.85) ? 'high' : 'medium';
  const per100 = grams > 0 ? { kcal: (kcal / grams) * 100, p: (p / grams) * 100, c: (c / grams) * 100, f: (f / grams) * 100 } : { kcal: 0, p: 0, c: 0, f: 0 };
  return {
    query: query.trim(), matched, unmatched, grams: Math.round(grams), kcal: Math.round(kcal), p: Math.round(p * 10) / 10, c: Math.round(c * 10) / 10, f: Math.round(f * 10) / 10,
    per100, tags: [...tags], confidence, servingLabel: found.length + missing.length > 1 ? 'your meal' : labelOf,
    note: unmatched.length ? `Estimated from the category I guessed for: ${unmatched.map((u) => u.text).join(', ')}` : undefined,
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
