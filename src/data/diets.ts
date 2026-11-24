/**
 * Diets and allergens. Foods carry ingredient tags (see Food.tags). A diet can exclude tags, change the macro
 * split, and/or prefer certain foods when building a day.
 */
export interface Diet {
  id: string;
  name: string;
  group: 'Restrictions' | 'Eating styles' | 'Health focus';
  desc: string;
  exclude?: string[];
  carbPct?: number; // target share of calories from carbs
  fatPct?: number; // target share of calories from fat
  proteinBoost?: number; // multiplier on the protein target
  prefer?: string[]; // tags or categories to favour
  limit?: string[]; // tags to use sparingly
  approximate?: boolean; // we apply the main rule but not every detail
}

export const DIETS: Diet[] = [
  { id: 'none', name: 'No specific diet', group: 'Restrictions', desc: 'Eat anything' },
  { id: 'halal', name: 'Halal', group: 'Restrictions', desc: 'No pork or alcohol', exclude: ['pork', 'alcohol'] },
  { id: 'kosher', name: 'Kosher', group: 'Restrictions', desc: 'No pork or shellfish', exclude: ['pork', 'shellfish'], approximate: true },
  { id: 'vegetarian', name: 'Vegetarian', group: 'Restrictions', desc: 'No meat, poultry or fish; eggs and dairy ok', exclude: ['meat', 'fish', 'shellfish'] },
  { id: 'lacto-veg', name: 'Lacto-vegetarian', group: 'Restrictions', desc: 'Vegetarian plus no eggs', exclude: ['meat', 'fish', 'shellfish', 'egg'] },
  { id: 'ovo-veg', name: 'Ovo-vegetarian', group: 'Restrictions', desc: 'Vegetarian plus no dairy', exclude: ['meat', 'fish', 'shellfish', 'dairy'] },
  { id: 'vegan', name: 'Vegan', group: 'Restrictions', desc: 'No animal products', exclude: ['meat', 'fish', 'shellfish', 'egg', 'dairy', 'honey'] },
  { id: 'pescatarian', name: 'Pescatarian', group: 'Restrictions', desc: 'Fish and seafood, no other meat', exclude: ['meat'] },
  { id: 'flexitarian', name: 'Flexitarian', group: 'Restrictions', desc: 'Mostly plants, a little meat', prefer: ['legume', 'veg', 'soy'], limit: ['meat'] },
  { id: 'gluten-free', name: 'Gluten-free', group: 'Restrictions', desc: 'No wheat, barley or rye', exclude: ['gluten'] },
  { id: 'dairy-free', name: 'Dairy-free', group: 'Restrictions', desc: 'No milk products', exclude: ['dairy'] },
  { id: 'nut-free', name: 'Nut-free', group: 'Restrictions', desc: 'No peanuts or tree nuts', exclude: ['nuts', 'peanut'] },
  { id: 'low-carb', name: 'Low-carb', group: 'Eating styles', desc: 'About 22% of calories from carbs', carbPct: 0.22 },
  { id: 'keto', name: 'Keto', group: 'Eating styles', desc: 'Very low carb, higher fat (about 6% carbs)', carbPct: 0.06, exclude: ['grain', 'gluten'] },
  { id: 'mediterranean', name: 'Mediterranean', group: 'Eating styles', desc: 'Fish, vegetables, legumes, olive oil, whole grains', prefer: ['fish', 'legume', 'veg', 'fruit', 'nuts'], limit: ['beef', 'pork', 'lamb'] },
  { id: 'paleo', name: 'Paleo', group: 'Eating styles', desc: 'No grains, legumes, dairy or soy', exclude: ['grain', 'gluten', 'legume', 'dairy', 'soy'] },
  { id: 'dash', name: 'DASH', group: 'Health focus', desc: 'Vegetables, fruit, low-fat dairy, little salt', prefer: ['veg', 'fruit', 'dairy', 'legume'], limit: ['processed'] },
  { id: 'low-sodium', name: 'Low-sodium', group: 'Health focus', desc: 'Limits salty and processed foods', limit: ['processed'] },
  { id: 'low-fat', name: 'Low-fat', group: 'Health focus', desc: 'About 20% of calories from fat', fatPct: 0.2 },
  { id: 'diabetic', name: 'Diabetes-friendly', group: 'Health focus', desc: 'Moderate carbs (about 38%), high fibre, little sugar', carbPct: 0.38, prefer: ['legume', 'veg'], approximate: true },
  { id: 'high-protein', name: 'High-protein', group: 'Health focus', desc: 'Higher protein target', proteinBoost: 1.2 },
  { id: 'low-fodmap', name: 'Low-FODMAP', group: 'Health focus', desc: 'Avoids common gut triggers (wheat, beans, lactose)', exclude: ['gluten', 'legume', 'dairy'], approximate: true },
];

const BY_ID = new Map(DIETS.map((d) => [d.id, d]));
export const getDiet = (id: string): Diet | undefined => BY_ID.get(id);

/** Common allergens: id = the food tag it matches. */
export const ALLERGENS: { id: string; name: string }[] = [
  { id: 'peanut', name: 'Peanuts' },
  { id: 'nuts', name: 'Tree nuts' },
  { id: 'dairy', name: 'Milk / dairy' },
  { id: 'egg', name: 'Eggs' },
  { id: 'fish', name: 'Fish' },
  { id: 'shellfish', name: 'Shellfish (shrimp, crab, squid)' },
  { id: 'soy', name: 'Soy' },
  { id: 'gluten', name: 'Wheat / gluten' },
  { id: 'sesame', name: 'Sesame' },
  { id: 'legume', name: 'Beans and lentils' },
  { id: 'corn', name: 'Corn' },
  { id: 'honey', name: 'Honey' },
  { id: 'alcohol', name: 'Alcohol' },
];

export interface DietRules {
  excludeTags: Set<string>;
  avoidWords: string[];
  prefer: Set<string>;
  limit: Set<string>;
  carbPct?: number;
  fatPct?: number;
  proteinBoost: number;
}

export function rulesFor(p: { diets: string[]; hasAllergies: boolean; allergens: string[]; avoidFoods: string[] }): DietRules {
  const excludeTags = new Set<string>();
  const prefer = new Set<string>();
  const limit = new Set<string>();
  let carbPct: number | undefined;
  let fatPct: number | undefined;
  let proteinBoost = 1;
  for (const id of p.diets) {
    const d = getDiet(id);
    if (!d) continue;
    d.exclude?.forEach((t) => excludeTags.add(t));
    d.prefer?.forEach((t) => prefer.add(t));
    d.limit?.forEach((t) => limit.add(t));
    if (d.carbPct !== undefined) carbPct = carbPct === undefined ? d.carbPct : Math.min(carbPct, d.carbPct);
    if (d.fatPct !== undefined) fatPct = fatPct === undefined ? d.fatPct : Math.min(fatPct, d.fatPct);
    if (d.proteinBoost) proteinBoost = Math.max(proteinBoost, d.proteinBoost);
  }
  if (p.hasAllergies) p.allergens.forEach((a) => excludeTags.add(a));
  const avoidWords = p.hasAllergies ? p.avoidFoods.map((w) => w.trim().toLowerCase()).filter(Boolean) : [];
  return { excludeTags, avoidWords, prefer, limit, carbPct, fatPct, proteinBoost };
}
