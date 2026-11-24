import type { Food, Region } from '../../core/types';

// Nutrient values are typical per-100 g figures cross-checked against USDA FoodData Central and the FNRI Philippine
// Food Composition Tables; they are ESTIMATES (brands, cooking and portion sizes vary).
const F = (f: Food): Food => f;

export const foods: Food[] = [
  // Staples
  F({ id: 'rice', name: 'Cooked white rice', cat: 'carb', kcal: 130, p: 2.7, c: 28, f: 0.3, servingG: 160, servingLabel: '1 cup', tags: ['grain'], meals: ['b', 'l', 'd'], maxServings: 4 }),
  F({ id: 'brown-rice', name: 'Cooked brown rice', cat: 'carb', kcal: 123, p: 2.7, c: 26, f: 1, servingG: 160, servingLabel: '1 cup', tags: ['grain'], meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'kamote', name: 'Sweet potato, boiled', cat: 'carb', kcal: 76, p: 1.4, c: 18, f: 0.1, servingG: 130, servingLabel: '1 medium', meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'oats', name: 'Rolled oats, dry', cat: 'carb', kcal: 380, p: 13, c: 67, f: 7, servingG: 40, servingLabel: '1/2 cup dry', tags: ['grain'], meals: ['b'], maxServings: 2 }),
  F({ id: 'pandesal', name: 'Bread roll', cat: 'carb', kcal: 290, p: 9, c: 55, f: 3, servingG: 35, servingLabel: '1 piece', tags: ['grain', 'gluten'], meals: ['b', 's'], maxServings: 3 }),
  F({ id: 'lugaw', name: 'Rice porridge', cat: 'carb', kcal: 70, p: 2.5, c: 12, f: 1.5, servingG: 300, servingLabel: '1 bowl', tags: ['grain'], meals: ['b'], maxServings: 1 }),
  // Fruit
  F({ id: 'saba', name: 'Cooking banana (saba)', cat: 'fruit', kcal: 122, p: 1.3, c: 31, f: 0.3, servingG: 90, servingLabel: '1 piece', meals: ['s', 'b'], maxServings: 2 }),
  F({ id: 'lakatan', name: 'Banana', cat: 'fruit', kcal: 89, p: 1.1, c: 23, f: 0.3, servingG: 100, servingLabel: '1 piece', meals: ['s', 'b'], maxServings: 2 }),
  F({ id: 'papaya', name: 'Papaya, ripe', cat: 'fruit', kcal: 43, p: 0.5, c: 11, f: 0.3, servingG: 150, servingLabel: '1 cup cubes', meals: ['s', 'b'], maxServings: 2 }),
  F({ id: 'mango', name: 'Mango, ripe', cat: 'fruit', kcal: 60, p: 0.8, c: 15, f: 0.4, servingG: 165, servingLabel: '1 cup slices', meals: ['s'], maxServings: 1 }),
  F({ id: 'pineapple', name: 'Pineapple', cat: 'fruit', kcal: 50, p: 0.5, c: 13, f: 0.1, servingG: 165, servingLabel: '1 cup chunks', meals: ['s', 'b'], maxServings: 1 }),
  // Protein
  F({ id: 'egg', name: 'Egg, boiled or poached', cat: 'protein', kcal: 143, p: 12.6, c: 0.7, f: 9.5, servingG: 50, servingLabel: '1 egg', tags: ['egg'], meals: ['b', 'l', 'd'], maxServings: 3 }),
  F({ id: 'galunggong', name: 'Round scad fish, grilled', cat: 'protein', kcal: 130, p: 22, c: 0, f: 4, servingG: 90, servingLabel: '1 medium fish', tags: ['fish'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'bangus', name: 'Milkfish, grilled', cat: 'protein', kcal: 190, p: 24, c: 0, f: 10, servingG: 100, servingLabel: '1 slice', tags: ['fish'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'sardines', name: 'Canned sardines in tomato sauce', cat: 'protein', kcal: 140, p: 14, c: 3, f: 8, servingG: 80, servingLabel: '1/2 small can', tags: ['fish', 'processed'], meals: ['b', 'l', 'd'], maxServings: 2 }),
  F({ id: 'tuna', name: 'Canned tuna in water', cat: 'protein', kcal: 116, p: 26, c: 0, f: 1, servingG: 85, servingLabel: '1/2 can', tags: ['fish', 'processed'], meals: ['b', 'l', 'd'], maxServings: 2 }),
  F({ id: 'shrimp', name: 'Shrimp, cooked', cat: 'protein', kcal: 99, p: 24, c: 0.2, f: 0.3, servingG: 100, servingLabel: '1 serving', tags: ['shellfish'], meals: ['l', 'd'], maxServings: 1 }),
  F({ id: 'chicken-breast', name: 'Chicken breast, skinless, cooked', cat: 'protein', kcal: 165, p: 31, c: 0, f: 3.6, servingG: 100, servingLabel: '1 palm-size piece', tags: ['meat', 'poultry'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'chicken-thigh', name: 'Chicken thigh, skinless, cooked', cat: 'protein', kcal: 209, p: 26, c: 0, f: 11, servingG: 100, servingLabel: '1 piece', tags: ['meat', 'poultry'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'pork-lean', name: 'Lean pork (loin), cooked', cat: 'protein', kcal: 200, p: 27, c: 0, f: 9, servingG: 90, servingLabel: '1 palm-size piece', tags: ['meat', 'pork'], meals: ['l', 'd'], maxServings: 1 }),
  F({ id: 'beef-lean', name: 'Lean beef, cooked', cat: 'protein', kcal: 217, p: 26, c: 0, f: 12, servingG: 90, servingLabel: '1 palm-size piece', tags: ['meat', 'beef'], meals: ['l', 'd'], maxServings: 1 }),
  F({ id: 'tofu', name: 'Tofu, firm (not fried)', cat: 'protein', kcal: 76, p: 8, c: 2, f: 4.8, servingG: 120, servingLabel: '1/2 block', tags: ['soy', 'legume'], meals: ['b', 'l', 'd'], maxServings: 2 }),
  F({ id: 'monggo', name: 'Mung beans, boiled', cat: 'protein', kcal: 105, p: 7, c: 19, f: 0.4, servingG: 150, servingLabel: '3/4 cup', tags: ['legume'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'peanuts', name: 'Roasted peanuts', cat: 'fat', kcal: 585, p: 26, c: 16, f: 49, servingG: 20, servingLabel: '1 small handful', tags: ['nuts', 'peanut'], meals: ['s'], maxServings: 1 }),
  F({ id: 'milk', name: 'Fresh milk, low-fat', cat: 'dairy', kcal: 50, p: 3.4, c: 5, f: 1.8, servingG: 240, servingLabel: '1 glass', tags: ['dairy'], meals: ['b', 's'], maxServings: 2 }),
  // Vegetables
  F({ id: 'kangkong', name: 'Water spinach, cooked', cat: 'veg', kcal: 22, p: 2.6, c: 3.1, f: 0.2, servingG: 100, servingLabel: '1 cup cooked', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'malunggay', name: 'Moringa leaves', cat: 'veg', kcal: 64, p: 9.4, c: 8.2, f: 1.4, servingG: 50, servingLabel: '1 cup leaves', meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'pechay', name: 'Bok choy, cooked', cat: 'veg', kcal: 13, p: 1.5, c: 2.2, f: 0.2, servingG: 100, servingLabel: '1 cup cooked', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'sayote', name: 'Chayote, cooked', cat: 'veg', kcal: 24, p: 0.8, c: 5, f: 0.1, servingG: 100, servingLabel: '1 cup slices', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'ampalaya', name: 'Bitter melon, cooked', cat: 'veg', kcal: 20, p: 1, c: 4, f: 0.2, servingG: 100, servingLabel: '1 cup', meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'kalabasa', name: 'Squash, cooked', cat: 'veg', kcal: 26, p: 1, c: 6.5, f: 0.1, servingG: 120, servingLabel: '1 cup cubes', meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'talong', name: 'Eggplant, grilled', cat: 'veg', kcal: 35, p: 1, c: 8, f: 0.2, servingG: 100, servingLabel: '1 medium', meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'sitaw', name: 'Long beans / green beans, cooked', cat: 'veg', kcal: 31, p: 1.8, c: 7, f: 0.2, servingG: 100, servingLabel: '1 cup', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'repolyo', name: 'Cabbage, cooked', cat: 'veg', kcal: 23, p: 1.3, c: 5.5, f: 0.1, servingG: 100, servingLabel: '1 cup', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'tomato', name: 'Tomato', cat: 'veg', kcal: 18, p: 0.9, c: 3.9, f: 0.2, servingG: 120, servingLabel: '1 medium', meals: ['b', 'l', 'd'], maxServings: 2 }),
  // Fats
  F({ id: 'oil', name: 'Cooking oil', cat: 'fat', kcal: 884, p: 0, c: 0, f: 100, servingG: 5, servingLabel: '1 teaspoon', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'avocado', name: 'Avocado', cat: 'fat', kcal: 160, p: 2, c: 9, f: 15, servingG: 100, servingLabel: '1/2 fruit', meals: ['b', 'l', 's'], maxServings: 1 }),
  // Common foods you will probably log. Not suggested by the meal planner.
  F({ id: 'fried-chicken', name: 'Fried chicken (with skin & breading)', cat: 'treat', kcal: 260, p: 20, c: 10, f: 15, servingG: 120, servingLabel: '1 piece', tags: ['meat', 'poultry', 'gluten'], meals: ['l', 'd'] }),
  F({ id: 'hotdog', name: 'Hotdog', cat: 'treat', kcal: 280, p: 11, c: 5, f: 24, servingG: 50, servingLabel: '1 piece', tags: ['meat', 'pork', 'processed'], meals: ['b'] }),
  F({ id: 'instant-noodles', name: 'Instant noodles', cat: 'treat', kcal: 440, p: 9, c: 60, f: 18, servingG: 80, servingLabel: '1 pack', tags: ['grain', 'gluten', 'processed'], meals: ['b', 'l', 'd', 's'] }),
  F({ id: 'coffee-3in1', name: 'Instant coffee mix (3-in-1)', cat: 'drink', kcal: 400, p: 3, c: 75, f: 10, servingG: 20, servingLabel: '1 sachet', tags: ['dairy', 'processed'], meals: ['b', 's'] }),
  F({ id: 'softdrink', name: 'Soft drink', cat: 'drink', kcal: 42, p: 0, c: 10.6, f: 0, servingG: 330, servingLabel: '1 can (330 ml)', meals: ['s', 'l', 'd'] }),
  F({ id: 'juice', name: 'Powdered juice drink', cat: 'drink', kcal: 35, p: 0, c: 9, f: 0, servingG: 250, servingLabel: '1 glass', meals: ['s'] }),
  F({ id: 'milktea', name: 'Milk tea with tapioca pearls', cat: 'drink', kcal: 90, p: 1, c: 18, f: 2, servingG: 500, servingLabel: '1 regular cup', tags: ['dairy'], meals: ['s'] }),
  F({ id: 'adobo', name: 'Braised chicken/pork with sauce', cat: 'treat', kcal: 190, p: 17, c: 3, f: 12, servingG: 120, servingLabel: '1 serving', tags: ['meat', 'soy'], meals: ['l', 'd'] }),
];

export const ph: Region = {
  id: 'ph',
  name: 'Philippines',
  note: 'Built around rice, eggs, canned fish, tofu, mung beans and everyday local vegetables.',
  foods,
};
