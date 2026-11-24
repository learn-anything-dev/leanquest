import { rulesFor, type DietRules } from '../data/diets';
import type { Food, FoodEntry, Meal, Profile, Totals } from './types';

export function entryFor(food: Food, grams: number, meal: Meal): Omit<FoodEntry, 'id'> {
  const k = grams / 100;
  return {
    foodId: food.id,
    name: food.name,
    grams: Math.round(grams),
    kcal: Math.round(food.kcal * k),
    p: Math.round(food.p * k * 10) / 10,
    c: Math.round(food.c * k * 10) / 10,
    f: Math.round(food.f * k * 10) / 10,
    meal,
    estimated: food.estimated,
  };
}

export function sumEntries(entries: FoodEntry[]): Totals {
  return entries.reduce<Totals>(
    (t, e) => ({ kcal: t.kcal + e.kcal, p: t.p + e.p, c: t.c + e.c, f: t.f + e.f }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

type DietProfile = Pick<Profile, 'diets' | 'hasAllergies' | 'allergens' | 'avoidFoods'>;

/** True if the food conflicts with the user's diets, allergens or free-text foods to avoid. */
export function excluded(food: Food, p: DietProfile | DietRules): boolean {
  const rules = 'excludeTags' in p ? p : rulesFor(p);
  const tags = food.tags ?? [];
  if (tags.some((t) => rules.excludeTags.has(t))) return true;
  const name = food.name.toLowerCase();
  return rules.avoidWords.some((w) => name.includes(w));
}

/** Why a food was excluded, for display. */
export function excludedReason(food: Food, p: DietProfile): string | null {
  const rules = rulesFor(p);
  const hit = (food.tags ?? []).find((t) => rules.excludeTags.has(t));
  if (hit) return hit;
  const w = rules.avoidWords.find((x) => food.name.toLowerCase().includes(x));
  return w ?? null;
}

export interface PlannedFood {
  food: Food;
  servings: number;
  meal: Meal;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayPlan {
  items: PlannedFood[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinMet: boolean;
  note: string;
}

export interface PlanTargets {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

/**
 * Builds a sample day that respects the user's diets and allergies: vegetables first, then protein up to the
 * target (rotating through different foods), then carbs up to the carb target, then fats and fruit for the rest.
 * It is a suggestion to swap freely, not a prescription.
 */
export function planDay(foods: Food[], t: PlanTargets, diet: DietProfile, seed = 0): DayPlan {
  const rules = rulesFor(diet);
  const pool = foods.filter((f) => f.cat !== 'treat' && f.cat !== 'drink' && !excluded(f, rules));
  const count = new Map<string, number>();
  const chosen: Food[] = [];
  let kcal = 0, prot = 0, carbs = 0, fat = 0;
  const k1 = (f: Food) => (f.kcal * f.servingG) / 100;
  const p1 = (f: Food) => (f.p * f.servingG) / 100;
  const c1 = (f: Food) => (f.c * f.servingG) / 100;
  const f1 = (f: Food) => (f.f * f.servingG) / 100;
  const add = (f: Food) => { count.set(f.id, (count.get(f.id) ?? 0) + 1); chosen.push(f); kcal += k1(f); prot += p1(f); carbs += c1(f); fat += f1(f); };
  const room = (f: Food, slack = 40) => (count.get(f.id) ?? 0) < (f.maxServings ?? 2) && kcal + k1(f) <= t.kcal + slack;
  const bonus = (f: Food) => {
    let b = 0;
    const tags = f.tags ?? [];
    if (tags.some((x) => rules.prefer.has(x)) || rules.prefer.has(f.cat)) b += 0.35;
    if (tags.some((x) => rules.limit.has(x))) b -= 0.45;
    return b;
  };
  const jitter = (f: Food) => (((f.id.charCodeAt(0) + f.id.length + seed) % 7) / 7) * 0.15;

  // 1) vegetables: three servings across at least two kinds
  const veg = pool.filter((f) => f.cat === 'veg').sort((a, b) => bonus(b) + jitter(b) - bonus(a) - jitter(a));
  for (const v of veg.slice(0, 3)) if (room(v)) add(v);

  // 2) protein: highest protein per calorie first, with a penalty for repeating the same food
  let guard = 0;
  while (prot < t.proteinG * 0.98 && guard++ < 40) {
    const options = pool
      .filter((f) => f.cat !== 'veg' && p1(f) >= 3 && room(f) && carbs + c1(f) <= t.carbG * 1.15 + 6)
      .map((f) => ({ f, s: p1(f) / Math.max(40, k1(f)) - (count.get(f.id) ?? 0) * 0.04 + bonus(f) * 0.05 + jitter(f) * 0.05 }))
      .sort((a, b) => b.s - a.s);
    if (!options.length) break;
    add(options[0].f);
  }

  // 3) carbs and fruit up to the carb target
  guard = 0;
  while (carbs < t.carbG * 0.92 && kcal < t.kcal - 60 && guard++ < 40) {
    const options = pool
      .filter((f) => ['carb', 'fruit'].includes(f.cat) && room(f, 20) && carbs + c1(f) <= t.carbG * 1.12 + 4)
      .map((f) => ({ f, s: bonus(f) + jitter(f) - (count.get(f.id) ?? 0) * 0.3 }))
      .sort((a, b) => b.s - a.s);
    if (!options.length) break;
    add(options[0].f);
  }

  // 4) fats and dairy to use the remaining calories without blowing the carb target
  guard = 0;
  while (kcal < t.kcal - 60 && guard++ < 40) {
    const options = pool
      .filter((f) => ['fat', 'dairy', 'protein', 'carb', 'fruit'].includes(f.cat) && room(f, 20) && carbs + c1(f) <= t.carbG * 1.2 + 6)
      .map((f) => ({ f, s: (f.cat === 'fat' ? 0.4 : 0) + bonus(f) + jitter(f) - (count.get(f.id) ?? 0) * 0.3 }))
      .sort((a, b) => b.s - a.s);
    if (!options.length) break;
    add(options[0].f);
  }

  // Assign each serving (biggest first) to the allowed meal furthest below its share of the day's calories.
  const share: Record<Meal, number> = { b: 0.25, l: 0.32, d: 0.33, s: 0.1 };
  const mealKcal: Record<Meal, number> = { b: 0, l: 0, d: 0, s: 0 };
  const placed = new Map<string, PlannedFood>();
  [...chosen].sort((a, b) => k1(b) - k1(a)).forEach((food) => {
    const allowed = food.meals?.length ? food.meals : (['l', 'd'] as Meal[]);
    const meal = allowed.reduce((best, m) => (mealKcal[m] / share[m] < mealKcal[best] / share[best] ? m : best), allowed[0]);
    mealKcal[meal] += k1(food);
    const key = `${food.id}|${meal}`;
    const cur = placed.get(key) ?? { food, servings: 0, meal, grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0 };
    cur.servings += 1; cur.grams += food.servingG; cur.kcal += Math.round(k1(food)); cur.protein += Math.round(p1(food)); cur.carbs += Math.round(c1(food)); cur.fat += Math.round(f1(food));
    placed.set(key, cur);
  });
  const order: Meal[] = ['b', 'l', 'd', 's'];
  const items = [...placed.values()].sort((a, b) => order.indexOf(a.meal) - order.indexOf(b.meal));

  const proteinMet = prot >= t.proteinG * 0.9;
  let note = '';
  if (!proteinMet) note = 'Protein came out below target with your diet and food restrictions. Add foods you tolerate that are high in protein, or log extras in Food.';
  else if (kcal < t.kcal - 150) note = 'This day uses fewer calories than your target. Add more of the foods you like to reach it.';
  return { items, kcal: Math.round(kcal), protein: Math.round(prot), carbs: Math.round(carbs), fat: Math.round(fat), proteinMet, note };
}

export const MEAL_LABEL: Record<Meal, string> = { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' };
