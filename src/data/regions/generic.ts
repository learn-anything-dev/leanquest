import type { Food, Region } from '../../core/types';

// Region-neutral starter list with placeholder prices in "units" (set your own currency and prices in Settings).
// Values are typical per-100 g figures from USDA FoodData Central; they are estimates.
const F = (f: Food): Food => f;

export const foods: Food[] = [
  F({ id: 'rice', name: 'Cooked rice', cat: 'carb', kcal: 130, p: 2.7, c: 28, f: 0.3, servingG: 160, servingLabel: '1 cup', price100: 0.3, meals: ['l', 'd'], maxServings: 4 }),
  F({ id: 'pasta', name: 'Cooked pasta', cat: 'carb', kcal: 158, p: 5.8, c: 31, f: 0.9, servingG: 140, servingLabel: '1 cup', price100: 0.3, tags: ['gluten'], meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'bread', name: 'Bread, wholewheat', cat: 'carb', kcal: 250, p: 12, c: 43, f: 3.5, servingG: 35, servingLabel: '1 slice', price100: 0.5, tags: ['gluten'], meals: ['b', 's'], maxServings: 4 }),
  F({ id: 'oats', name: 'Rolled oats, dry', cat: 'carb', kcal: 380, p: 13, c: 67, f: 7, servingG: 40, servingLabel: '1/2 cup dry', price100: 0.5, meals: ['b'], maxServings: 2 }),
  F({ id: 'potato', name: 'Potato, boiled', cat: 'carb', kcal: 87, p: 1.9, c: 20, f: 0.1, servingG: 150, servingLabel: '1 medium', price100: 0.2, meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'sweet-potato', name: 'Sweet potato, boiled', cat: 'carb', kcal: 76, p: 1.4, c: 18, f: 0.1, servingG: 130, servingLabel: '1 medium', price100: 0.3, meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'egg', name: 'Egg, boiled', cat: 'protein', kcal: 143, p: 12.6, c: 0.7, f: 9.5, servingG: 50, servingLabel: '1 egg', price100: 0.5, tags: ['egg'], meals: ['b', 'l', 'd'], maxServings: 3 }),
  F({ id: 'chicken-breast', name: 'Chicken breast, cooked', cat: 'protein', kcal: 165, p: 31, c: 0, f: 3.6, servingG: 100, servingLabel: '1 palm-size piece', price100: 1.0, tags: ['meat'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'canned-tuna', name: 'Canned tuna in water', cat: 'protein', kcal: 116, p: 26, c: 0, f: 1, servingG: 85, servingLabel: '1/2 can', price100: 1.2, tags: ['fish'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'lentils', name: 'Lentils, cooked', cat: 'protein', kcal: 116, p: 9, c: 20, f: 0.4, servingG: 150, servingLabel: '3/4 cup', price100: 0.3, meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'beans', name: 'Beans, cooked', cat: 'protein', kcal: 127, p: 8.7, c: 22, f: 0.5, servingG: 150, servingLabel: '3/4 cup', price100: 0.3, meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'tofu', name: 'Tofu, firm', cat: 'protein', kcal: 76, p: 8, c: 2, f: 4.8, servingG: 120, servingLabel: '1/2 block', price100: 0.6, tags: ['soy'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'yogurt', name: 'Plain low-fat yogurt', cat: 'dairy', kcal: 63, p: 5.3, c: 7, f: 1.6, servingG: 170, servingLabel: '1 small pot', price100: 0.4, tags: ['dairy'], meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'milk', name: 'Low-fat milk', cat: 'dairy', kcal: 50, p: 3.4, c: 5, f: 1.8, servingG: 240, servingLabel: '1 glass', price100: 0.1, tags: ['dairy'], meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'banana', name: 'Banana', cat: 'fruit', kcal: 89, p: 1.1, c: 23, f: 0.3, servingG: 110, servingLabel: '1 medium', price100: 0.2, meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'apple', name: 'Apple', cat: 'fruit', kcal: 52, p: 0.3, c: 14, f: 0.2, servingG: 180, servingLabel: '1 medium', price100: 0.3, meals: ['s'], maxServings: 2 }),
  F({ id: 'carrot', name: 'Carrot', cat: 'veg', kcal: 41, p: 0.9, c: 10, f: 0.2, servingG: 80, servingLabel: '1 medium', price100: 0.15, meals: ['l', 'd', 's'], maxServings: 2 }),
  F({ id: 'cabbage', name: 'Cabbage, cooked', cat: 'veg', kcal: 23, p: 1.3, c: 5.5, f: 0.1, servingG: 100, servingLabel: '1 cup', price100: 0.1, meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'spinach', name: 'Spinach / leafy greens, cooked', cat: 'veg', kcal: 23, p: 3, c: 3.6, f: 0.4, servingG: 100, servingLabel: '1 cup cooked', price100: 0.3, meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'broccoli', name: 'Broccoli, cooked', cat: 'veg', kcal: 35, p: 2.4, c: 7, f: 0.4, servingG: 100, servingLabel: '1 cup', price100: 0.3, meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'peanut-butter', name: 'Peanut butter', cat: 'fat', kcal: 588, p: 25, c: 20, f: 50, servingG: 16, servingLabel: '1 tablespoon', price100: 0.9, tags: ['nuts'], meals: ['b', 's'], maxServings: 1 }),
  F({ id: 'oil', name: 'Cooking oil', cat: 'fat', kcal: 884, p: 0, c: 0, f: 100, servingG: 5, servingLabel: '1 teaspoon', price100: 0.5, meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'softdrink', name: 'Soft drink', cat: 'drink', kcal: 42, p: 0, c: 10.6, f: 0, servingG: 330, servingLabel: '1 can', price100: 0.3, meals: ['s'] }),
  F({ id: 'chips', name: 'Potato chips', cat: 'treat', kcal: 540, p: 6, c: 53, f: 34, servingG: 30, servingLabel: '1 small bag', price100: 1.2, meals: ['s'] }),
];

export const generic: Region = {
  id: 'generic',
  name: 'Other / generic',
  currency: '$',
  budgetDefault: 8,
  note: 'A neutral starter list with placeholder prices. Set your currency and edit prices in Settings, and add your local foods as custom foods.',
  foods,
};
