import type { Food, Region } from '../../core/types';

// Typical per-100 g values from USDA FoodData Central; they are estimates.
const F = (f: Food): Food => f;

export const foods: Food[] = [
  // Grains & starches
  F({ id: 'rice', name: 'Cooked white rice', cat: 'carb', kcal: 130, p: 2.7, c: 28, f: 0.3, servingG: 160, servingLabel: '1 cup', tags: ['grain'], meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'brown-rice', name: 'Cooked brown rice', cat: 'carb', kcal: 123, p: 2.7, c: 26, f: 1, servingG: 160, servingLabel: '1 cup', tags: ['grain'], meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'quinoa', name: 'Cooked quinoa', cat: 'carb', kcal: 120, p: 4.4, c: 21, f: 1.9, servingG: 150, servingLabel: '3/4 cup', tags: ['grain'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'oats', name: 'Rolled oats, dry', cat: 'carb', kcal: 380, p: 13, c: 67, f: 7, servingG: 40, servingLabel: '1/2 cup dry', tags: ['grain'], meals: ['b'], maxServings: 2 }),
  F({ id: 'pasta', name: 'Cooked pasta', cat: 'carb', kcal: 158, p: 5.8, c: 31, f: 0.9, servingG: 140, servingLabel: '1 cup', tags: ['grain', 'gluten'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'bread', name: 'Wholewheat bread', cat: 'carb', kcal: 250, p: 12, c: 43, f: 3.5, servingG: 35, servingLabel: '1 slice', tags: ['grain', 'gluten'], meals: ['b', 's'], maxServings: 3 }),
  F({ id: 'tortilla', name: 'Corn tortilla', cat: 'carb', kcal: 218, p: 5.7, c: 45, f: 2.9, servingG: 30, servingLabel: '1 tortilla', tags: ['grain', 'corn'], meals: ['b', 'l', 'd'], maxServings: 3 }),
  F({ id: 'couscous', name: 'Cooked couscous', cat: 'carb', kcal: 112, p: 3.8, c: 23, f: 0.2, servingG: 150, servingLabel: '3/4 cup', tags: ['grain', 'gluten'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'potato', name: 'Potato, boiled', cat: 'carb', kcal: 87, p: 1.9, c: 20, f: 0.1, servingG: 150, servingLabel: '1 medium', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'sweet-potato', name: 'Sweet potato, boiled', cat: 'carb', kcal: 76, p: 1.4, c: 18, f: 0.1, servingG: 130, servingLabel: '1 medium', meals: ['l', 'd'], maxServings: 2 }),
  // Protein
  F({ id: 'egg', name: 'Egg, boiled', cat: 'protein', kcal: 143, p: 12.6, c: 0.7, f: 9.5, servingG: 50, servingLabel: '1 egg', tags: ['egg'], meals: ['b', 'l', 'd'], maxServings: 3 }),
  F({ id: 'chicken-breast', name: 'Chicken breast, cooked', cat: 'protein', kcal: 165, p: 31, c: 0, f: 3.6, servingG: 100, servingLabel: '1 palm-size piece', tags: ['meat', 'poultry'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'turkey', name: 'Turkey breast, cooked', cat: 'protein', kcal: 135, p: 30, c: 0, f: 1, servingG: 100, servingLabel: '1 palm-size piece', tags: ['meat', 'poultry'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'beef', name: 'Lean beef, cooked', cat: 'protein', kcal: 217, p: 26, c: 0, f: 12, servingG: 90, servingLabel: '1 palm-size piece', tags: ['meat', 'beef'], meals: ['l', 'd'], maxServings: 1 }),
  F({ id: 'pork', name: 'Pork loin, cooked', cat: 'protein', kcal: 200, p: 27, c: 0, f: 9, servingG: 90, servingLabel: '1 palm-size piece', tags: ['meat', 'pork'], meals: ['l', 'd'], maxServings: 1 }),
  F({ id: 'lamb', name: 'Lamb, cooked', cat: 'protein', kcal: 250, p: 25, c: 0, f: 17, servingG: 90, servingLabel: '1 palm-size piece', tags: ['meat', 'lamb'], meals: ['l', 'd'], maxServings: 1 }),
  F({ id: 'salmon', name: 'Salmon, cooked', cat: 'protein', kcal: 206, p: 22, c: 0, f: 12, servingG: 100, servingLabel: '1 fillet', tags: ['fish'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'white-fish', name: 'White fish (cod, tilapia), cooked', cat: 'protein', kcal: 105, p: 23, c: 0, f: 0.9, servingG: 100, servingLabel: '1 fillet', tags: ['fish'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'canned-tuna', name: 'Canned tuna in water', cat: 'protein', kcal: 116, p: 26, c: 0, f: 1, servingG: 85, servingLabel: '1/2 can', tags: ['fish', 'processed'], meals: ['b', 'l', 'd'], maxServings: 2 }),
  F({ id: 'shrimp', name: 'Shrimp, cooked', cat: 'protein', kcal: 99, p: 24, c: 0.2, f: 0.3, servingG: 100, servingLabel: '1 serving', tags: ['shellfish'], meals: ['l', 'd'], maxServings: 1 }),
  F({ id: 'tofu', name: 'Tofu, firm', cat: 'protein', kcal: 76, p: 8, c: 2, f: 4.8, servingG: 120, servingLabel: '1/2 block', tags: ['soy', 'legume'], meals: ['b', 'l', 'd'], maxServings: 2 }),
  F({ id: 'tempeh', name: 'Tempeh', cat: 'protein', kcal: 192, p: 20, c: 8, f: 11, servingG: 100, servingLabel: '1 serving', tags: ['soy', 'legume'], meals: ['l', 'd'], maxServings: 1 }),
  F({ id: 'edamame', name: 'Edamame', cat: 'protein', kcal: 121, p: 12, c: 9, f: 5, servingG: 100, servingLabel: '3/4 cup', tags: ['soy', 'legume'], meals: ['l', 'd', 's'], maxServings: 1 }),
  F({ id: 'lentils', name: 'Lentils, cooked', cat: 'protein', kcal: 116, p: 9, c: 20, f: 0.4, servingG: 150, servingLabel: '3/4 cup', tags: ['legume'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'chickpeas', name: 'Chickpeas, cooked', cat: 'protein', kcal: 164, p: 8.9, c: 27, f: 2.6, servingG: 150, servingLabel: '3/4 cup', tags: ['legume'], meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'black-beans', name: 'Black beans, cooked', cat: 'protein', kcal: 132, p: 8.9, c: 24, f: 0.5, servingG: 150, servingLabel: '3/4 cup', tags: ['legume'], meals: ['l', 'd'], maxServings: 2 }),
  // Dairy and alternatives
  F({ id: 'greek-yogurt', name: 'Greek yogurt, plain, low-fat', cat: 'dairy', kcal: 73, p: 10, c: 4, f: 2, servingG: 170, servingLabel: '1 small pot', tags: ['dairy'], meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'cottage-cheese', name: 'Cottage cheese', cat: 'dairy', kcal: 98, p: 11, c: 3.4, f: 4.3, servingG: 120, servingLabel: '1/2 cup', tags: ['dairy'], meals: ['b', 's'], maxServings: 1 }),
  F({ id: 'milk', name: 'Low-fat milk', cat: 'dairy', kcal: 50, p: 3.4, c: 5, f: 1.8, servingG: 240, servingLabel: '1 glass', tags: ['dairy'], meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'soy-milk', name: 'Soy milk, unsweetened', cat: 'dairy', kcal: 33, p: 2.9, c: 1.7, f: 1.6, servingG: 240, servingLabel: '1 glass', tags: ['soy', 'legume'], meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'cheese', name: 'Cheddar cheese', cat: 'dairy', kcal: 403, p: 25, c: 1.3, f: 33, servingG: 30, servingLabel: '1 slice', tags: ['dairy'], meals: ['b', 'l', 's'], maxServings: 1 }),
  // Vegetables
  F({ id: 'spinach', name: 'Spinach / leafy greens, cooked', cat: 'veg', kcal: 23, p: 3, c: 3.6, f: 0.4, servingG: 100, servingLabel: '1 cup cooked', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'broccoli', name: 'Broccoli, cooked', cat: 'veg', kcal: 35, p: 2.4, c: 7, f: 0.4, servingG: 100, servingLabel: '1 cup', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'cabbage', name: 'Cabbage, cooked', cat: 'veg', kcal: 23, p: 1.3, c: 5.5, f: 0.1, servingG: 100, servingLabel: '1 cup', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'carrot', name: 'Carrot', cat: 'veg', kcal: 41, p: 0.9, c: 10, f: 0.2, servingG: 80, servingLabel: '1 medium', meals: ['l', 'd', 's'], maxServings: 2 }),
  F({ id: 'tomato', name: 'Tomato', cat: 'veg', kcal: 18, p: 0.9, c: 3.9, f: 0.2, servingG: 120, servingLabel: '1 medium', meals: ['b', 'l', 'd'], maxServings: 2 }),
  F({ id: 'cucumber', name: 'Cucumber', cat: 'veg', kcal: 15, p: 0.7, c: 3.6, f: 0.1, servingG: 100, servingLabel: '1/2 cucumber', meals: ['l', 'd', 's'], maxServings: 2 }),
  F({ id: 'pepper', name: 'Bell pepper', cat: 'veg', kcal: 31, p: 1, c: 6, f: 0.3, servingG: 100, servingLabel: '1 medium', meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'cauliflower', name: 'Cauliflower, cooked', cat: 'veg', kcal: 25, p: 1.9, c: 5, f: 0.3, servingG: 100, servingLabel: '1 cup', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'zucchini', name: 'Zucchini, cooked', cat: 'veg', kcal: 17, p: 1.2, c: 3.1, f: 0.3, servingG: 100, servingLabel: '1 cup', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'mushrooms', name: 'Mushrooms, cooked', cat: 'veg', kcal: 28, p: 2.2, c: 5.3, f: 0.5, servingG: 100, servingLabel: '1 cup', meals: ['l', 'd'], maxServings: 2 }),
  F({ id: 'green-beans', name: 'Green beans, cooked', cat: 'veg', kcal: 31, p: 1.8, c: 7, f: 0.2, servingG: 100, servingLabel: '1 cup', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'salad', name: 'Mixed salad greens', cat: 'veg', kcal: 15, p: 1.4, c: 2.9, f: 0.2, servingG: 60, servingLabel: '2 cups', meals: ['l', 'd'], maxServings: 2 }),
  // Fruit
  F({ id: 'banana', name: 'Banana', cat: 'fruit', kcal: 89, p: 1.1, c: 23, f: 0.3, servingG: 110, servingLabel: '1 medium', meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'apple', name: 'Apple', cat: 'fruit', kcal: 52, p: 0.3, c: 14, f: 0.2, servingG: 180, servingLabel: '1 medium', meals: ['s', 'b'], maxServings: 2 }),
  F({ id: 'orange', name: 'Orange', cat: 'fruit', kcal: 47, p: 0.9, c: 12, f: 0.1, servingG: 130, servingLabel: '1 medium', meals: ['s', 'b'], maxServings: 2 }),
  F({ id: 'berries', name: 'Berries', cat: 'fruit', kcal: 57, p: 0.7, c: 14, f: 0.3, servingG: 100, servingLabel: '3/4 cup', meals: ['b', 's'], maxServings: 2 }),
  F({ id: 'grapes', name: 'Grapes', cat: 'fruit', kcal: 69, p: 0.7, c: 18, f: 0.2, servingG: 100, servingLabel: '2/3 cup', meals: ['s'], maxServings: 1 }),
  F({ id: 'pear', name: 'Pear', cat: 'fruit', kcal: 57, p: 0.4, c: 15, f: 0.1, servingG: 170, servingLabel: '1 medium', meals: ['s', 'b'], maxServings: 1 }),
  F({ id: 'watermelon', name: 'Watermelon', cat: 'fruit', kcal: 30, p: 0.6, c: 7.6, f: 0.2, servingG: 150, servingLabel: '1 wedge', meals: ['s'], maxServings: 2 }),
  // Fats, nuts, seeds
  F({ id: 'olive-oil', name: 'Olive oil', cat: 'fat', kcal: 884, p: 0, c: 0, f: 100, servingG: 5, servingLabel: '1 teaspoon', meals: ['l', 'd'], maxServings: 3 }),
  F({ id: 'avocado', name: 'Avocado', cat: 'fat', kcal: 160, p: 2, c: 9, f: 15, servingG: 100, servingLabel: '1/2 fruit', meals: ['b', 'l', 's'], maxServings: 1 }),
  F({ id: 'almonds', name: 'Almonds', cat: 'fat', kcal: 579, p: 21, c: 22, f: 50, servingG: 25, servingLabel: '1 small handful', tags: ['nuts'], meals: ['s', 'b'], maxServings: 1 }),
  F({ id: 'walnuts', name: 'Walnuts', cat: 'fat', kcal: 654, p: 15, c: 14, f: 65, servingG: 25, servingLabel: '1 small handful', tags: ['nuts'], meals: ['s', 'b'], maxServings: 1 }),
  F({ id: 'peanut-butter', name: 'Peanut butter', cat: 'fat', kcal: 588, p: 25, c: 20, f: 50, servingG: 16, servingLabel: '1 tablespoon', tags: ['nuts', 'peanut'], meals: ['b', 's'], maxServings: 1 }),
  F({ id: 'chia', name: 'Chia seeds', cat: 'fat', kcal: 486, p: 17, c: 42, f: 31, servingG: 15, servingLabel: '1 tablespoon', meals: ['b', 's'], maxServings: 1 }),
  F({ id: 'tahini', name: 'Tahini (sesame paste)', cat: 'fat', kcal: 595, p: 17, c: 21, f: 54, servingG: 15, servingLabel: '1 tablespoon', tags: ['sesame'], meals: ['l', 'd'], maxServings: 1 }),
  // Common foods to log (not suggested by the meal planner)
  F({ id: 'softdrink', name: 'Soft drink', cat: 'drink', kcal: 42, p: 0, c: 10.6, f: 0, servingG: 330, servingLabel: '1 can', meals: ['s'] }),
  F({ id: 'orange-juice', name: 'Orange juice', cat: 'drink', kcal: 45, p: 0.7, c: 10.4, f: 0.2, servingG: 250, servingLabel: '1 glass', meals: ['b', 's'] }),
  F({ id: 'chips', name: 'Potato chips', cat: 'treat', kcal: 540, p: 6, c: 53, f: 34, servingG: 30, servingLabel: '1 small bag', tags: ['processed'], meals: ['s'] }),
];

export const global: Region = {
  id: 'global',
  name: 'Global foods',
  note: 'A broad list of foods available almost everywhere. Add local dishes with the custom food estimator.',
  foods,
};
