import type { Food, Region } from '../../core/types';

// Nutrient values are typical per-100 g figures cross-checked against USDA FoodData Central and the FNRI Philippine
// Food Composition Tables; they are ESTIMATES (brands, cooking and portion sizes vary). Prices are rough 2025-26 Metro
// Manila wet-market/supermarket estimates in PHP: edit them in Settings to match what you actually pay.
const F = (f: Food): Food => f;

export const foods: Food[] = [
  F({ id: 'rice', name: 'Cooked white rice', cat: 'carb', kcal: 130, p: 2.7, c: 28, f: 0.3, servingG: 160, servingLabel: '1 cup', price100: 2.8, meals: ['b', 'l', 'd'], maxServings: 4 }),
  F({ id: 'kamote', name: 'Sweet potato, boiled', cat: 'carb', kcal: 76, p: 1.4, c: 18, f: 0.1, servingG: 130, servingLabel: '1 medium', price100: 7, meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'oats', name: 'Rolled oats, dry', cat: 'carb', kcal: 380, p: 13, c: 67, f: 7, servingG: 40, servingLabel: '1/2 cup dry', price100: 24, meals: ['b'], maxServings: 2 }),
  F({ id: 'pandesal', name: 'Bread roll', cat: 'carb', kcal: 290, p: 9, c: 55, f: 3, servingG: 35, servingLabel: '1 piece', price100: 12, tags: ['gluten'], meals: ['b', 's'], maxServings: 3 }),
  F({ id: 'saba', name: 'Cooking banana (saba)', cat: 'fruit', kcal: 122, p: 1.3, c: 31, f: 0.3, servingG: 90, servingLabel: '1 piece', price100: 6, meals: ['s', 'b'], maxServings: 2 }),
  F({ id: 'lakatan', name: 'Banana', cat: 'fruit', kcal: 89, p: 1.1, c: 23, f: 0.3, servingG: 100, servingLabel: '1 piece', price100: 7, meals: ['s', 'b'], maxServings: 2 }),
  F({ id: 'papaya', name: 'Papaya, ripe', cat: 'fruit', kcal: 43, p: 0.5, c: 11, f: 0.3, servingG: 150, servingLabel: '1 cup cubes', price100: 6, meals: ['s', 'b'], maxServings: 2 }),
  F({ id: 'mango', name: 'Mango, ripe', cat: 'fruit', kcal: 60, p: 0.8, c: 15, f: 0.4, servingG: 165, servingLabel: '1 cup slices', price100: 14, meals: ['s'], maxServings: 1 }),
  F({ id: 'egg', name: 'Egg, boiled or poached', cat: 'protein', kcal: 143, p: 12.6, c: 0.7, f: 9.5, servingG: 50, servingLabel: '1 egg', price100: 18, tags: ['egg'], meals: ['b', 'l', 'd'], maxServings: 3 }),
  F({ id: 'galunggong', name: 'Round scad fish, grilled', cat: 'protein', kcal: 130, p: 22, c: 0, f: 4, servingG: 90, servingLabel: '1 medium fish', price100: 30, tags: ['fish'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'bangus', name: 'Milkfish, grilled', cat: 'protein', kcal: 190, p: 24, c: 0, f: 10, servingG: 100, servingLabel: '1 slice', price100: 35, tags: ['fish'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'sardines', name: 'Canned sardines in tomato sauce', cat: 'protein', kcal: 140, p: 14, c: 3, f: 8, servingG: 80, servingLabel: '1/2 small can', price100: 14, tags: ['fish'], meals: ['b', 'l', 'd'], maxServings: 2 }),
  F({ id: 'tuna', name: 'Canned tuna in water', cat: 'protein', kcal: 116, p: 26, c: 0, f: 1, servingG: 85, servingLabel: '1/2 can', price100: 24, tags: ['fish'], meals: ['b', 'l', 'd'], maxServings: 2 }),
  F({ id: 'chicken-breast', name: 'Chicken breast, skinless, cooked', cat: 'protein', kcal: 165, p: 31, c: 0, f: 3.6, servingG: 100, servingLabel: '1 palm-size piece', price100: 38, tags: ['meat'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'chicken-thigh', name: 'Chicken thigh, skinless, cooked', cat: 'protein', kcal: 209, p: 26, c: 0, f: 11, servingG: 100, servingLabel: '1 piece', price100: 28, tags: ['meat'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'pork-lean', name: 'Lean pork (loin), cooked', cat: 'protein', kcal: 200, p: 27, c: 0, f: 9, servingG: 90, servingLabel: '1 palm-size piece', price100: 40, tags: ['pork', 'meat'], meals: ['l', 'd'], maxServings: 1 }),
  F({ id: 'tofu', name: 'Tofu, firm (not fried)', cat: 'protein', kcal: 76, p: 8, c: 2, f: 4.8, servingG: 120, servingLabel: '1/2 block', price100: 10, tags: ['soy'], meals: ['b', 'l', 'd'], maxServings: 2 }),
  F({ id: 'monggo', name: 'Mung beans, boiled', cat: 'protein', kcal: 105, p: 7, c: 19, f: 0.4, servingG: 150, servingLabel: '3/4 cup', price100: 5, meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'peanuts', name: 'Roasted peanuts', cat: 'protein', kcal: 585, p: 26, c: 16, f: 49, servingG: 20, servingLabel: '1 small handful', price100: 14, tags: ['nuts'], meals: ['s'], maxServings: 1 }),
  F({ id: 'milk', name: 'Fresh milk, low-fat', cat: 'dairy', kcal: 50, p: 3.4, c: 5, f: 1.8, servingG: 240, servingLabel: '1 glass', price100: 8, tags: ['dairy'], meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'kangkong', name: 'Water spinach, cooked', cat: 'veg', kcal: 22, p: 2.6, c: 3.1, f: 0.2, servingG: 100, servingLabel: '1 cup cooked', price100: 6, meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'malunggay', name: 'Moringa leaves', cat: 'veg', kcal: 64, p: 9.4, c: 8.2, f: 1.4, servingG: 50, servingLabel: '1 cup leaves', price100: 5, meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'pechay', name: 'Bok choy, cooked', cat: 'veg', kcal: 13, p: 1.5, c: 2.2, f: 0.2, servingG: 100, servingLabel: '1 cup cooked', price100: 8, meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'sayote', name: 'Chayote, cooked', cat: 'veg', kcal: 24, p: 0.8, c: 5, f: 0.1, servingG: 100, servingLabel: '1 cup slices', price100: 8, meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'ampalaya', name: 'Bitter melon, cooked', cat: 'veg', kcal: 20, p: 1, c: 4, f: 0.2, servingG: 100, servingLabel: '1 cup', price100: 10, meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'kalabasa', name: 'Squash, cooked', cat: 'veg', kcal: 26, p: 1, c: 6.5, f: 0.1, servingG: 120, servingLabel: '1 cup cubes', price100: 8, meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'talong', name: 'Eggplant, grilled', cat: 'veg', kcal: 35, p: 1, c: 8, f: 0.2, servingG: 100, servingLabel: '1 medium', price100: 9, meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'oil', name: 'Cooking oil', cat: 'fat', kcal: 884, p: 0, c: 0, f: 100, servingG: 5, servingLabel: '1 teaspoon', price100: 14, meals: ['l', 'd'], maxServings: 3 }),
  // Common foods you will probably log. Not suggested by the budget planner.
  F({ id: 'fried-chicken', name: 'Fried chicken (with skin & breading)', cat: 'treat', kcal: 260, p: 20, c: 10, f: 15, servingG: 120, servingLabel: '1 piece', price100: 55, tags: ['meat'], meals: ['l', 'd'] }),
  F({ id: 'hotdog', name: 'Hotdog', cat: 'treat', kcal: 280, p: 11, c: 5, f: 24, servingG: 50, servingLabel: '1 piece', price100: 30, tags: ['pork', 'meat'], meals: ['b'] }),
  F({ id: 'instant-noodles', name: 'Instant noodles', cat: 'treat', kcal: 440, p: 9, c: 60, f: 18, servingG: 80, servingLabel: '1 pack', price100: 18, tags: ['gluten'], meals: ['b', 'l', 'd', 's'] }),
  F({ id: 'coffee-3in1', name: 'Instant coffee mix (3-in-1)', cat: 'drink', kcal: 400, p: 3, c: 75, f: 10, servingG: 20, servingLabel: '1 sachet', price100: 40, meals: ['b', 's'] }),
  F({ id: 'softdrink', name: 'Soft drink', cat: 'drink', kcal: 42, p: 0, c: 10.6, f: 0, servingG: 330, servingLabel: '1 can (330 ml)', price100: 6, meals: ['s', 'l', 'd'] }),
  F({ id: 'juice', name: 'Powdered juice drink', cat: 'drink', kcal: 35, p: 0, c: 9, f: 0, servingG: 250, servingLabel: '1 glass', price100: 2, meals: ['s'] }),
  F({ id: 'milktea', name: 'Milk tea with tapioca pearls', cat: 'drink', kcal: 90, p: 1, c: 18, f: 2, servingG: 500, servingLabel: '1 regular cup', price100: 15, tags: ['dairy'], meals: ['s'] }),
  F({ id: 'lugaw', name: 'Rice porridge', cat: 'carb', kcal: 70, p: 2.5, c: 12, f: 1.5, servingG: 300, servingLabel: '1 bowl', price100: 10, meals: ['b'] }),
  F({ id: 'adobo', name: 'Braised chicken/pork with sauce', cat: 'treat', kcal: 190, p: 17, c: 3, f: 12, servingG: 120, servingLabel: '1 serving', price100: 28, tags: ['meat'], meals: ['l', 'd'] }),
];

export const ph: Region = {
  id: 'ph',
  name: 'Philippines',
  currency: '₱',
  budgetDefault: 200,
  note: 'Built around rice, eggs, canned fish, tofu, mung beans and low-cost vegetables. Prices are estimates; you can edit them.',
  foods,
};
