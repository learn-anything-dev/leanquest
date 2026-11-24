export type Sex = 'female' | 'male' | 'unspecified';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active';
export type Equipment = 'none' | 'home' | 'gym';
export type PlanChoice = 'realistic' | 'goal';
export type Meal = 'b' | 'l' | 'd' | 's';
export type Limitation = 'knees' | 'back' | 'wrists' | 'shoulders';

export interface Screening {
  under18: boolean;
  pregnant: boolean;
  eatingDisorder: boolean;
  medical: boolean; // diabetes / heart / kidney / on medication that affects weight or diet
}

/** Things the user says they can do today; used to pick a safe starting point for each movement. */
export type AbilityId =
  | 'sitStand' // stand up from a chair without using hands
  | 'wallPushup' // 10 wall push-ups
  | 'kneePushup' // 5 push-ups on knees
  | 'floorGetUp' // get down to and up from the floor
  | 'plank' // hold a forearm/knee plank 20 s
  | 'walk30' // walk 30 minutes without stopping
  | 'stairs'; // climb two flights of stairs without a long rest

export type StyleId = 'walking' | 'dance' | 'strength' | 'stretch' | 'intervals' | 'sports' | 'swim';

export interface Profile {
  name: string;
  units: 'metric' | 'imperial';
  sex: Sex;
  age: number;
  heightCm: number;
  startWeightKg: number;
  goalWeightKg: number;
  goalWeeks: number;
  activity: Activity;
  baselineSteps: number;
  /** Activities the user already does regularly (free choice from a list, may be empty). */
  currentActivities: StyleId[];
  /** Roughly how many minutes per week of deliberate exercise they do now. */
  currentMinutesPerWeek: number;
  /** Exercise styles they enjoy / are comfortable with; drives cardio choices. */
  comfortable: StyleId[];
  /** What they can do right now; sets the starting step in each movement ladder. */
  abilities: AbilityId[];
  equipment: Equipment;
  limitations: Limitation[];
  region: string; // region pack id
  budgetPerDay: number; // in region currency
  halal: boolean;
  vegetarian: boolean;
  allergens: string[];
  hotClimate: boolean;
  startDate: string; // YYYY-MM-DD
  choice: PlanChoice;
  screening: Screening;
}

export interface FoodEntry {
  id: string;
  foodId: string;
  name: string;
  grams: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  cost: number;
  meal: Meal;
}

export interface DayLog {
  food: FoodEntry[];
  waterMl: number;
  steps?: number;
  challengeDone?: boolean;
  foodDone?: boolean; // user marked the day's food log as complete
}

export interface WorkoutItem {
  exerciseId: string;
  pattern: string;
  sets: number;
  target: number;
  feedback?: 'easy' | 'right' | 'hard';
}

export interface WorkoutLog {
  id: string;
  date: string;
  items: WorkoutItem[];
}

export interface PatternState {
  step: number;
  target: number;
}

export interface Food {
  id: string;
  name: string;
  local?: string;
  cat: 'protein' | 'carb' | 'veg' | 'fruit' | 'fat' | 'dairy' | 'treat' | 'drink';
  kcal: number; // per 100 g (or 100 ml)
  p: number;
  c: number;
  f: number;
  servingG: number;
  servingLabel: string;
  price100: number; // price per 100 g in region currency (estimate)
  tags?: string[]; // 'pork','fish','egg','nuts','dairy','gluten','soy','shellfish','meat'
  meals?: Meal[];
  maxServings?: number;
}

export interface Region {
  id: string;
  name: string;
  currency: string;
  budgetDefault: number;
  note: string;
  foods: Food[];
}

export type Status = 'collecting' | 'ahead' | 'green' | 'yellow' | 'red';

export interface Totals {
  kcal: number;
  p: number;
  c: number;
  f: number;
  cost: number;
}
