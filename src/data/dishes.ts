/**
 * Reference dishes for the calorie estimator. Values are typical per 100 g (or 100 ml) for a standard recipe and
 * portion; real dishes vary, so everything built from this list is an estimate (about +/-25%).
 * Tuple: name | aliases | kcal | protein | carbs | fat | serving g | serving label | tags
 */
export interface Dish {
  name: string;
  aliases: string[];
  kcal: number;
  p: number;
  c: number;
  f: number;
  servingG: number;
  servingLabel: string;
  tags: string[];
}

type Row = [string, string, number, number, number, number, number, string, string];

const ROWS: Row[] = [
  // Filipino dishes and street food
  ['Chicken adobo', 'adobo,adobong manok,chicken adobo', 190, 17, 3, 12, 150, '1 serving', 'meat,poultry,soy'],
  ['Pork adobo', 'adobong baboy,pork adobo', 260, 15, 3, 21, 150, '1 serving', 'meat,pork,soy'],
  ['Sinigang (sour soup with pork)', 'sinigang,sinigang na baboy', 75, 7, 4, 3.5, 350, '1 bowl', 'meat,pork'],
  ['Tinola (chicken ginger soup)', 'tinola,chicken tinola', 60, 7, 3, 2, 350, '1 bowl', 'meat,poultry'],
  ['Kare-kare (peanut stew)', 'kare kare,karekare', 150, 10, 6, 10, 250, '1 serving', 'meat,beef,peanut,nuts'],
  ['Lechon (roast pork)', 'lechon,lechon baboy,roast pig', 300, 20, 0, 24, 100, '1 serving', 'meat,pork'],
  ['Sisig', 'pork sisig', 270, 17, 4, 21, 150, '1 serving', 'meat,pork'],
  ['Pancit canton', 'pancit,stir fried noodles,canton', 150, 5, 22, 5, 250, '1 plate', 'grain,gluten'],
  ['Pancit bihon', 'bihon,rice noodles stir fried', 140, 4, 22, 4, 250, '1 plate', 'grain'],
  ['Lumpia shanghai', 'lumpia,fried spring roll,shanghai', 230, 8, 18, 14, 100, '4 pieces', 'meat,pork,gluten'],
  ['Fresh lumpia', 'lumpiang sariwa,fresh spring roll', 120, 4, 17, 4, 120, '1 piece', 'gluten'],
  ['Tapsilog (beef tapa, rice, egg)', 'tapsilog,tapa rice egg', 180, 9, 18, 8, 350, '1 plate', 'meat,beef,egg,grain'],
  ['Longsilog / tocilog (sausage, rice, egg)', 'longsilog,tocilog,longganisa rice egg', 200, 8, 20, 10, 350, '1 plate', 'meat,pork,egg,grain'],
  ['Longganisa (sweet sausage)', 'longanisa,longganisa', 300, 15, 8, 23, 60, '2 pieces', 'meat,pork'],
  ['Tocino (sweet cured pork)', 'tocino', 250, 14, 20, 12, 80, '3 slices', 'meat,pork'],
  ['Beef tapa', 'tapa,tapa beef', 220, 22, 6, 12, 80, '1 serving', 'meat,beef'],
  ['Fried milkfish', 'bangus,daing na bangus,fried bangus', 230, 22, 0, 15, 120, '1 piece', 'fish'],
  ['Fried tilapia', 'tilapia,fried fish', 190, 24, 3, 9, 120, '1 fish', 'fish'],
  ['Dinuguan (pork blood stew)', 'dinuguan', 160, 12, 3, 11, 200, '1 serving', 'meat,pork'],
  ['Bicol express', 'bicol express', 200, 10, 5, 16, 200, '1 serving', 'meat,pork'],
  ['Pinakbet (mixed vegetables)', 'pinakbet', 70, 3, 8, 3, 200, '1 serving', 'shellfish'],
  ['Laing (taro leaves in coconut milk)', 'laing', 160, 4, 6, 14, 150, '1 serving', ''],
  ['Mung bean stew', 'ginisang monggo,monggo,mongo', 90, 6, 11, 3, 250, '1 bowl', 'legume'],
  ['Eggplant omelet', 'tortang talong,tortang', 130, 7, 6, 9, 120, '1 piece', 'egg'],
  ['Halo-halo', 'halo halo', 130, 3, 28, 2, 350, '1 glass', 'dairy'],
  ['Turon (banana spring roll)', 'turon,banana lumpia', 280, 2, 45, 10, 80, '1 piece', 'gluten'],
  ['Banana cue', 'banana que,banana cue', 250, 1.5, 45, 8, 100, '1 stick', ''],
  ['Bibingka', 'bibingka', 220, 4, 36, 7, 100, '1 piece', 'egg,dairy'],
  ['Puto (steamed rice cake)', 'puto', 160, 3, 36, 0.5, 40, '1 piece', 'grain'],
  ['Champorado (chocolate rice porridge)', 'champorado,tsampurado', 120, 2.5, 25, 2, 300, '1 bowl', 'grain'],
  ['Arroz caldo (chicken rice porridge)', 'arroz caldo,goto,lugaw with chicken', 80, 5, 11, 2, 300, '1 bowl', 'meat,poultry,grain'],
  ['Ensaymada', 'ensaymada', 380, 8, 45, 19, 70, '1 piece', 'gluten,dairy,egg'],
  ['Siopao (steamed meat bun)', 'siopao,steamed bun', 250, 9, 38, 7, 120, '1 piece', 'gluten,meat,pork'],
  ['Siomai (steamed dumplings)', 'siomai,shumai', 190, 9, 14, 10, 100, '4 pieces', 'meat,pork,gluten'],
  ['Fish balls / kikiam', 'fishball,fish ball,kikiam,squid balls', 170, 8, 20, 6, 60, '3 pieces', 'fish,gluten'],
  ['Grilled pork skewer (street BBQ)', 'barbecue,bbq stick,isaw,pork bbq', 250, 15, 8, 17, 70, '1 stick', 'meat,pork'],
  ['Bread roll (pandesal)', 'pandesal,bread roll,dinner roll', 290, 9, 55, 3, 35, '1 piece', 'gluten,grain'],
  // Everyday international meals
  ['Pizza', 'cheese pizza,pepperoni pizza,pizza slice', 266, 11, 33, 10, 110, '1 slice', 'gluten,dairy,grain'],
  ['Hamburger / cheeseburger', 'burger,hamburger,cheeseburger,beef burger', 250, 13, 25, 11, 200, '1 burger', 'meat,beef,gluten,dairy'],
  ['French fries', 'fries,chips and fries,french fry', 312, 3.4, 41, 15, 120, '1 medium serving', ''],
  ['Fried chicken', 'fried chicken,chicken fried,crispy chicken,chicken joy', 260, 20, 10, 15, 120, '1 piece', 'meat,poultry,gluten'],
  ['Chicken nuggets', 'nuggets,chicken nugget', 290, 15, 17, 18, 100, '6 pieces', 'meat,poultry,gluten'],
  ['Sandwich', 'sandwich,sub,deli sandwich', 230, 11, 26, 9, 180, '1 sandwich', 'gluten'],
  ['Grilled cheese sandwich', 'grilled cheese,toasted cheese', 330, 13, 30, 18, 130, '1 sandwich', 'gluten,dairy'],
  ['Hot dog in a bun', 'hotdog sandwich,hot dog bun,hotdog', 250, 10, 22, 14, 120, '1 hot dog', 'gluten,meat,pork'],
  ['Sushi rolls', 'sushi,maki,california roll,sushi roll', 145, 4, 28, 1.5, 180, '6 pieces', 'grain'],
  ['Sashimi', 'sashimi,raw fish', 130, 22, 0, 5, 100, '1 serving', 'fish'],
  ['Ramen', 'ramen,noodle soup ramen', 90, 5, 11, 3, 500, '1 bowl', 'gluten,meat,pork'],
  ['Pho (beef noodle soup)', 'pho,vietnamese noodle soup', 55, 4, 7, 1, 500, '1 bowl', 'meat,beef'],
  ['Pad thai', 'pad thai,phad thai', 170, 7, 22, 6, 300, '1 plate', 'egg,peanut,nuts,shellfish'],
  ['Fried rice', 'fried rice,egg fried rice,garlic rice,sinangag', 175, 5, 28, 5, 250, '1 plate', 'egg,grain'],
  ['Chicken curry', 'curry,chicken curry,coconut curry', 150, 12, 5, 9, 250, '1 serving', 'meat,poultry'],
  ['Biryani', 'biryani,pilaf,pilau', 180, 8, 24, 6, 300, '1 plate', 'grain'],
  ['Dal (lentil curry)', 'dal,dhal,lentil curry,lentil soup', 100, 6, 14, 2.5, 250, '1 bowl', 'legume'],
  ['Naan bread', 'naan', 290, 9, 50, 5, 90, '1 piece', 'gluten,grain'],
  ['Roti / chapati', 'roti,chapati,paratha,flatbread', 300, 9, 50, 7, 40, '1 piece', 'gluten,grain'],
  ['Paneer curry', 'paneer,palak paneer', 200, 9, 7, 15, 200, '1 serving', 'dairy'],
  ['Taco', 'taco,tacos', 226, 9, 20, 12, 100, '1 taco', 'meat,beef,gluten'],
  ['Burrito', 'burrito,wrap burrito', 210, 9, 28, 7, 250, '1 burrito', 'gluten,grain'],
  ['Quesadilla', 'quesadilla', 290, 13, 27, 14, 150, '1 quesadilla', 'gluten,dairy'],
  ['Nachos', 'nachos', 346, 8, 36, 19, 120, '1 serving', 'dairy,corn'],
  ['Spaghetti with meat sauce', 'spaghetti,bolognese,pasta bolognese,pasta with meat sauce', 150, 7, 20, 4.5, 300, '1 plate', 'gluten,grain,meat,beef'],
  ['Pasta carbonara / creamy pasta', 'carbonara,alfredo,creamy pasta', 200, 9, 22, 8, 300, '1 plate', 'gluten,grain,dairy,egg'],
  ['Tomato pasta', 'pasta,pasta marinara,penne,macaroni,noodles pasta', 150, 5, 28, 2, 300, '1 plate', 'gluten,grain'],
  ['Lasagna', 'lasagna,lasagne', 160, 9, 15, 7, 250, '1 piece', 'gluten,dairy,meat,beef'],
  ['Macaroni and cheese', 'mac and cheese,mac n cheese,macaroni cheese', 170, 7, 20, 7, 250, '1 bowl', 'gluten,dairy'],
  ['Caesar salad', 'caesar salad,chicken caesar', 130, 4, 7, 10, 250, '1 bowl', 'dairy,egg'],
  ['Garden salad (no dressing)', 'salad,green salad,garden salad,veggie salad', 20, 1, 3, 0.3, 200, '1 bowl', ''],
  ['Vegetable stir-fry', 'stir fry vegetables,chop suey,sauteed vegetables,vegetable stir fry', 90, 3, 8, 5, 200, '1 serving', ''],
  ['Fried noodles / chow mein', 'chow mein,fried noodles,lo mein,stir fried noodles', 170, 6, 22, 7, 250, '1 plate', 'gluten,grain'],
  ['Dumplings / gyoza', 'dumpling,dumplings,gyoza,potstickers,dim sum', 220, 9, 25, 9, 100, '4 pieces', 'gluten,meat,pork'],
  ['Shawarma / kebab wrap', 'shawarma,kebab,doner,gyro', 220, 14, 20, 9, 250, '1 wrap', 'gluten,meat'],
  ['Falafel', 'falafel', 330, 13, 32, 18, 100, '4 pieces', 'legume'],
  ['Hummus', 'hummus,houmous', 170, 8, 14, 10, 60, '4 tablespoons', 'legume,sesame'],
  ['Chicken noodle soup', 'chicken soup,noodle soup,soup', 40, 3, 5, 1, 250, '1 bowl', 'gluten,meat,poultry'],
  ['Creamy soup', 'cream soup,mushroom soup,chowder,bisque,cream of mushroom', 80, 2, 7, 5, 250, '1 bowl', 'dairy'],
  ['Steak', 'steak,beef steak,sirloin,ribeye', 250, 26, 0, 16, 150, '1 steak', 'meat,beef'],
  ['Grilled chicken', 'grilled chicken,roast chicken,chicken breast,baked chicken,chicken inasal', 175, 27, 0, 7, 130, '1 piece', 'meat,poultry'],
  ['Fish and chips', 'fish and chips,battered fish,fish fillet fried', 230, 11, 20, 12, 300, '1 serving', 'fish,gluten'],
  ['Barbecue ribs', 'ribs,bbq ribs,pork ribs', 290, 20, 8, 20, 150, '1 serving', 'meat,pork'],
  ['Bacon', 'bacon', 540, 37, 1.4, 42, 20, '2 slices', 'meat,pork'],
  ['Sausage', 'sausage,sausages,bratwurst', 300, 12, 3, 27, 60, '1 sausage', 'meat,pork'],
  ['Ham', 'ham,deli ham,luncheon meat,spam', 145, 21, 1.5, 6, 40, '2 slices', 'meat,pork'],
  ['Steamed white rice', 'rice,white rice,steamed rice,jasmine rice,kanin', 130, 2.7, 28, 0.3, 160, '1 cup', 'grain'],
  ['Grilled fish', 'grilled fish,steamed fish,baked fish,fish fillet,salmon', 140, 22, 0, 5, 120, '1 piece', 'fish'],
  ['Boiled / steamed vegetables', 'vegetables,steamed vegetables,boiled vegetables,greens,veggies', 35, 2, 7, 0.3, 150, '1 cup', ''],
  // Breakfast and bakery
  ['Omelette', 'omelet,omelette,egg omelette', 154, 11, 1, 12, 120, '1 omelette', 'egg'],
  ['Scrambled eggs', 'scrambled egg,scrambled eggs,eggs', 150, 10, 2, 11, 100, '2 eggs', 'egg'],
  ['Fried egg', 'fried egg,sunny side up,egg', 196, 14, 0.8, 15, 46, '1 egg', 'egg'],
  ['Pancakes', 'pancake,pancakes,hotcakes', 227, 6, 28, 10, 120, '2 pancakes', 'gluten,egg,dairy'],
  ['Waffle', 'waffle,waffles', 291, 8, 33, 14, 75, '1 waffle', 'gluten,egg,dairy'],
  ['French toast', 'french toast', 230, 8, 26, 10, 130, '2 slices', 'gluten,egg,dairy'],
  ['Oatmeal (cooked)', 'oatmeal,porridge,oats,overnight oats', 71, 2.5, 12, 1.5, 240, '1 bowl', 'grain'],
  ['Breakfast cereal with milk', 'cereal,corn flakes,cornflakes,cereal with milk', 110, 4, 20, 1.5, 250, '1 bowl', 'gluten,dairy,grain'],
  ['Granola', 'granola,muesli', 470, 10, 64, 20, 50, '1/2 cup', 'gluten,nuts,grain'],
  ['Flavored yogurt', 'yogurt,yoghurt,fruit yogurt', 90, 4, 15, 1.5, 170, '1 pot', 'dairy'],
  ['Toast with butter', 'toast,buttered toast,bread and butter,bread', 300, 8, 45, 10, 40, '1 slice', 'gluten,dairy,grain'],
  ['Croissant', 'croissant', 406, 8, 46, 21, 60, '1 croissant', 'gluten,dairy,egg'],
  ['Bagel', 'bagel', 270, 10, 53, 1.5, 100, '1 bagel', 'gluten,grain'],
  ['Donut', 'donut,doughnut', 400, 5, 45, 22, 60, '1 donut', 'gluten,egg,dairy'],
  ['Muffin', 'muffin,cupcake', 380, 5, 50, 18, 110, '1 muffin', 'gluten,egg,dairy'],
  // Sweets and snacks
  ['Cake', 'cake,birthday cake,chocolate cake,cake slice', 370, 5, 52, 16, 90, '1 slice', 'gluten,egg,dairy'],
  ['Brownie', 'brownie', 405, 5, 50, 21, 60, '1 brownie', 'gluten,egg,dairy'],
  ['Cookie', 'cookie,cookies,biscuit,biscuits', 480, 5, 65, 22, 30, '1 cookie', 'gluten,egg,dairy'],
  ['Ice cream', 'ice cream,gelato,sorbet,ice cream cone', 207, 3.5, 24, 11, 70, '1 scoop', 'dairy'],
  ['Chocolate', 'chocolate,chocolate bar,candy bar', 540, 6, 60, 31, 40, '1 small bar', 'dairy'],
  ['Candy / sweets', 'candy,sweets,gummies,lollipop', 390, 0, 98, 0.2, 30, '1 handful', ''],
  ['Potato chips', 'chips,crisps,potato chips,snack chips', 540, 6, 53, 34, 30, '1 small bag', 'processed'],
  ['Popcorn', 'popcorn', 380, 12, 74, 4, 30, '3 cups popped', 'corn'],
  ['Mixed nuts', 'nuts,peanuts,cashews,almonds,mixed nuts,trail mix', 600, 22, 18, 52, 28, '1 handful', 'nuts'],
  ['Crackers', 'crackers,saltines,cracker', 430, 9, 70, 12, 30, '6 crackers', 'gluten,grain'],
  // Fruit
  ['Banana', 'banana,saging', 89, 1.1, 23, 0.3, 110, '1 medium', ''],
  ['Apple', 'apple', 52, 0.3, 14, 0.2, 180, '1 medium', ''],
  ['Orange', 'orange,tangerine,mandarin', 47, 0.9, 12, 0.1, 130, '1 medium', ''],
  ['Mango', 'mango,mangga', 60, 0.8, 15, 0.4, 165, '1 cup', ''],
  ['Grapes', 'grapes', 69, 0.7, 18, 0.2, 100, '2/3 cup', ''],
  ['Watermelon', 'watermelon,melon', 30, 0.6, 7.6, 0.2, 150, '1 wedge', ''],
  ['Berries', 'berries,strawberries,blueberries', 45, 0.8, 11, 0.4, 100, '3/4 cup', ''],
  ['Mixed fruit', 'fruit,fruits,fruit salad,fresh fruit', 55, 0.7, 14, 0.3, 150, '1 cup', ''],
  ['Avocado', 'avocado', 160, 2, 9, 15, 100, '1/2 fruit', ''],
  // Drinks
  ['Black coffee', 'black coffee,americano,espresso,coffee', 1, 0.1, 0, 0, 240, '1 cup', ''],
  ['Latte', 'latte,flat white,coffee with milk', 46, 3, 4.5, 2, 350, '1 medium cup', 'dairy'],
  ['Cappuccino', 'cappuccino,macchiato', 40, 2.5, 4, 1.5, 240, '1 cup', 'dairy'],
  ['Sweet iced coffee / frappe', 'frappe,frappuccino,iced coffee,mocha,caramel macchiato,sweet coffee', 80, 1.5, 14, 2.5, 450, '1 large cup', 'dairy'],
  ['Tea with sugar', 'tea,sweet tea,iced tea,lemon tea', 20, 0, 5, 0, 300, '1 glass', ''],
  ['Milk tea with pearls', 'milk tea,boba,bubble tea,milktea', 90, 1, 18, 2, 500, '1 regular cup', 'dairy'],
  ['Soft drink / soda', 'soda,soft drink,coke,cola,sprite,pepsi,royal,softdrink', 42, 0, 10.6, 0, 330, '1 can', ''],
  ['Diet / zero soda', 'diet soda,zero soda,coke zero,diet coke', 1, 0, 0, 0, 330, '1 can', ''],
  ['Fruit juice', 'juice,orange juice,apple juice,fruit juice', 46, 0.5, 11, 0.1, 250, '1 glass', ''],
  ['Smoothie', 'smoothie,shake,fruit shake', 65, 1.5, 14, 0.8, 350, '1 glass', ''],
  ['Energy / sports drink', 'energy drink,gatorade,sports drink,red bull', 45, 0, 11, 0, 250, '1 can', ''],
  ['Whole milk', 'milk,whole milk,fresh milk', 61, 3.2, 4.8, 3.3, 240, '1 glass', 'dairy'],
  ['Hot chocolate', 'hot chocolate,cocoa,milo,ovaltine', 80, 3, 12, 2.5, 240, '1 cup', 'dairy'],
  ['Protein shake', 'protein shake,whey shake,protein drink', 90, 15, 5, 1.5, 330, '1 shaker', 'dairy'],
  ['Beer', 'beer,lager,san miguel,red horse', 43, 0.5, 3.6, 0, 355, '1 can / bottle', 'alcohol,gluten'],
  ['Wine', 'wine,red wine,white wine,champagne,prosecco', 83, 0.1, 2.6, 0, 150, '1 glass', 'alcohol'],
  ['Spirits (vodka, gin, whisky, rum)', 'vodka,gin,whisky,whiskey,rum,tequila,brandy,spirits,shot', 230, 0, 0, 0, 45, '1 shot', 'alcohol'],
  ['Cocktail', 'cocktail,margarita,mojito,mixed drink', 150, 0, 12, 0, 150, '1 glass', 'alcohol'],
];

export const DISHES: Dish[] = ROWS.map(([name, aliases, kcal, p, c, f, servingG, servingLabel, tags]) => ({
  name,
  aliases: aliases.split(',').map((s) => s.trim()).filter(Boolean),
  kcal, p, c, f, servingG, servingLabel,
  tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
}));

/** Fallback when nothing matches: the user picks what it mostly is. */
export interface DishCategory {
  id: string;
  name: string;
  examples: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  servingG: number;
  servingLabel: string;
}

export const DISH_CATEGORIES: DishCategory[] = [
  { id: 'meat', name: 'Meat or poultry dish', examples: 'stew, curry, grilled meat', kcal: 200, p: 17, c: 5, f: 12, servingG: 150, servingLabel: '1 serving' },
  { id: 'fish', name: 'Fish or seafood dish', examples: 'fillet, shrimp, squid', kcal: 160, p: 18, c: 4, f: 8, servingG: 150, servingLabel: '1 serving' },
  { id: 'rice', name: 'Rice or grain dish', examples: 'rice meal, porridge, couscous', kcal: 150, p: 4, c: 26, f: 3, servingG: 250, servingLabel: '1 plate' },
  { id: 'noodle', name: 'Noodle or pasta dish', examples: 'noodles, spaghetti', kcal: 160, p: 6, c: 24, f: 4.5, servingG: 250, servingLabel: '1 plate' },
  { id: 'bread', name: 'Bread, sandwich or pastry', examples: 'sandwich, bun, pie', kcal: 270, p: 8, c: 40, f: 9, servingG: 120, servingLabel: '1 piece' },
  { id: 'soup', name: 'Soup or stew', examples: 'broth, soup', kcal: 70, p: 5, c: 6, f: 3, servingG: 300, servingLabel: '1 bowl' },
  { id: 'veg', name: 'Vegetable dish', examples: 'cooked veggies, salad', kcal: 70, p: 2.5, c: 8, f: 3, servingG: 200, servingLabel: '1 serving' },
  { id: 'egg', name: 'Egg dish', examples: 'omelette, egg meal', kcal: 150, p: 11, c: 2, f: 11, servingG: 120, servingLabel: '1 serving' },
  { id: 'dairy', name: 'Dairy', examples: 'yogurt, cheese, milk dessert', kcal: 120, p: 7, c: 8, f: 6, servingG: 150, servingLabel: '1 serving' },
  { id: 'fried', name: 'Fried food', examples: 'anything battered or deep fried', kcal: 300, p: 12, c: 22, f: 18, servingG: 120, servingLabel: '1 serving' },
  { id: 'sweet', name: 'Dessert or sweets', examples: 'cake, pudding, candy', kcal: 350, p: 4, c: 52, f: 15, servingG: 80, servingLabel: '1 serving' },
  { id: 'snack', name: 'Packaged snack', examples: 'chips, biscuits, bars', kcal: 480, p: 6, c: 55, f: 26, servingG: 40, servingLabel: '1 pack' },
  { id: 'fruit', name: 'Fruit', examples: 'fresh or dried fruit', kcal: 55, p: 0.7, c: 14, f: 0.3, servingG: 150, servingLabel: '1 serving' },
  { id: 'drink', name: 'Sweet drink', examples: 'soda, juice, sweet coffee', kcal: 45, p: 0.3, c: 11, f: 0, servingG: 300, servingLabel: '1 glass' },
  { id: 'alcohol', name: 'Alcoholic drink', examples: 'beer, wine, cocktail', kcal: 70, p: 0, c: 5, f: 0, servingG: 250, servingLabel: '1 drink' },
];
