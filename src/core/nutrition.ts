import type { Food, FoodEntry, Meal, Profile, Totals } from './types';

export function entryFor(food: Food, grams: number, meal: Meal, priceOverride?: number): Omit<FoodEntry, 'id'> {
  const k = grams / 100;
  const price = priceOverride ?? food.price100;
  return {
    foodId: food.id,
    name: food.name,
    grams: Math.round(grams),
    kcal: Math.round(food.kcal * k),
    p: Math.round(food.p * k * 10) / 10,
    c: Math.round(food.c * k * 10) / 10,
    f: Math.round(food.f * k * 10) / 10,
    cost: Math.round(price * k * 100) / 100,
    meal,
  };
}

export function sumEntries(entries: FoodEntry[]): Totals {
  return entries.reduce<Totals>(
    (t, e) => ({ kcal: t.kcal + e.kcal, p: t.p + e.p, c: t.c + e.c, f: t.f + e.f, cost: t.cost + e.cost }),
    { kcal: 0, p: 0, c: 0, f: 0, cost: 0 },
  );
}

/** True if the food conflicts with the user's diet/allergy settings. */
export function excluded(food: Food, p: Pick<Profile, 'halal' | 'vegetarian' | 'allergens'>): boolean {
  const tags = food.tags ?? [];
  if (p.halal && tags.includes('pork')) return true;
  if (p.vegetarian && (tags.includes('meat') || tags.includes('fish') || tags.includes('pork'))) return true;
  return p.allergens.some((a) => tags.includes(a));
}

export interface PlannedFood {
  food: Food;
  servings: number;
  meal: Meal;
  grams: number;
  kcal: number;
  protein: number;
  cost: number;
}

export interface DayPlan {
  items: PlannedFood[];
  kcal: number;
  protein: number;
  cost: number;
  withinBudget: boolean;
  proteinMet: boolean;
  note: string;
}

/**
 * Greedy budget meal-day builder: add one serving at a time of whatever gives the most protein (until the protein
 * target is hit) and then calories per currency unit, subject to per-food serving caps, a vegetable minimum,
 * the calorie target and the budget. It is a suggestion, not a prescription.
 */
export function planDay(
  foods: Food[],
  kcalTarget: number,
  proteinTarget: number,
  budget: number,
  priceOf: (f: Food) => number,
  diet: Pick<Profile, 'halal' | 'vegetarian' | 'allergens'>,
): DayPlan {
  const pool = foods.filter((f) => f.cat !== 'treat' && f.cat !== 'drink' && !excluded(f, diet));
  const count = new Map<string, number>();
  const chosen: { food: Food }[] = [];
  let kcal = 0;
  let prot = 0;
  let cost = 0;
  const cost1 = (f: Food) => (priceOf(f) * f.servingG) / 100;
  const kcal1 = (f: Food) => (f.kcal * f.servingG) / 100;
  const prot1 = (f: Food) => (f.p * f.servingG) / 100;
  const add = (f: Food) => {
    count.set(f.id, (count.get(f.id) ?? 0) + 1);
    chosen.push({ food: f });
    kcal += kcal1(f);
    prot += prot1(f);
    cost += cost1(f);
  };
  const maxOf = (f: Food) => f.maxServings ?? 2;
  const canAdd = (f: Food, slack = 40) => (count.get(f.id) ?? 0) < maxOf(f) && kcal + kcal1(f) <= kcalTarget + slack;

  // 1) Two vegetable servings first: cheap volume and fibre.
  const veg = pool.filter((f) => f.cat === 'veg').sort((a, b) => cost1(a) / Math.max(1, kcal1(a)) - cost1(b) / Math.max(1, kcal1(b)));
  for (const v of veg.slice(0, 2)) if (canAdd(v)) add(v);

  // 2) Protein until the target, picking the cheapest protein per serving-gram of protein that fits.
  let guard = 0;
  while (prot < proteinTarget && guard++ < 40) {
    const options = pool
      .filter((f) => prot1(f) >= 3 && f.cat !== 'veg' && canAdd(f))
      .sort((a, b) => cost1(a) / prot1(a) - cost1(b) / prot1(b) + (kcal1(a) - kcal1(b)) / 5000);
    if (!options.length) break;
    add(options[0]);
  }

  // 3) Fill remaining calories with cheap carbs/fruit/dairy, favouring calories per currency, keeping some variety.
  guard = 0;
  while (kcal < kcalTarget - 60 && guard++ < 40) {
    const options = pool
      .filter((f) => ['carb', 'fruit', 'dairy', 'fat'].includes(f.cat) && canAdd(f, 20))
      .sort((a, b) => (count.get(a.id) ?? 0) - (count.get(b.id) ?? 0) || kcal1(b) / Math.max(0.01, cost1(b)) - kcal1(a) / Math.max(0.01, cost1(a)));
    if (!options.length) break;
    add(options[0]);
  }

  // Assign each serving (biggest first) to the allowed meal that is furthest below its share of the day's calories.
  const share: Record<Meal, number> = { b: 0.25, l: 0.32, d: 0.33, s: 0.1 };
  const mealKcal: Record<Meal, number> = { b: 0, l: 0, d: 0, s: 0 };
  const placed = new Map<string, PlannedFood>();
  [...chosen].sort((a, b) => kcal1(b.food) - kcal1(a.food)).forEach(({ food }) => {
    const allowed = food.meals?.length ? food.meals : (['l', 'd'] as Meal[]);
    const meal = allowed.reduce((best, m) => (mealKcal[m] / share[m] < mealKcal[best] / share[best] ? m : best), allowed[0]);
    mealKcal[meal] += kcal1(food);
    const key = `${food.id}|${meal}`;
    const cur = placed.get(key) ?? { food, servings: 0, meal, grams: 0, kcal: 0, protein: 0, cost: 0 };
    cur.servings += 1;
    cur.grams += food.servingG;
    cur.kcal += Math.round(kcal1(food));
    cur.protein += Math.round(prot1(food));
    cur.cost = Math.round((cur.cost + cost1(food)) * 100) / 100;
    placed.set(key, cur);
  });
  const items: PlannedFood[] = [...placed.values()];
  const order: Meal[] = ['b', 'l', 'd', 's'];
  items.sort((a, b) => order.indexOf(a.meal) - order.indexOf(b.meal));

  const withinBudget = cost <= budget;
  const proteinMet = prot >= proteinTarget * 0.9;
  let note = 'A suggested day. Swap foods freely: aim for the calorie and protein numbers.';
  if (!withinBudget) note = 'This is the cheapest mix I can find for your targets, and it is over your budget. Options: raise the budget, accept a slightly lower protein (the app will show your minimum), or lean on eggs, beans or lentils and canned fish.';
  else if (!proteinMet) note = 'Within budget, but protein is under target. Eggs, tofu, beans/lentils and canned fish are the cheapest protein boosts.';
  return { items, kcal: Math.round(kcal), protein: Math.round(prot), cost: Math.round(cost * 100) / 100, withinBudget, proteinMet, note };
}

export const MEAL_LABEL: Record<Meal, string> = { b: 'Breakfast', l: 'Lunch', d: 'Dinner', s: 'Snacks' };
