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
  /** Anything else the user wants us to know (free text). Treated as "check with a doctor". */
  other: string[];
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

/** One thing the user already does regularly: an activity id from the catalog (or "custom:<name>") and minutes per week. */
export interface ExerciseEntry {
  id: string;
  minutes: number;
}

export interface Profile {
  name: string;
  units: 'metric' | 'imperial';
  sex: Sex;
  age: number;
  heightCm: number;
  startWeightKg: number;
  goalWeightKg: number;
  goalWeeks: number;
  activity: Activity; // daily life (job, chores), not counting deliberate exercise
  baselineSteps: number;
  /** Deliberate exercise the user already does, each with minutes per week. */
  currentExercise: ExerciseEntry[];
  /** Total minutes per week across currentExercise (derived). */
  currentMinutesPerWeek: number;
  /** Average extra kcal/day burned by currentExercise (derived from METs and body weight). */
  exerciseKcalPerDay: number;
  /** Activities they enjoy / are comfortable with: catalog ids or "custom:<name>". */
  comfortable: string[];
  /** What they can do right now; sets the starting step in each movement ladder. */
  abilities: AbilityId[];
  equipment: Equipment;
  limitations: Limitation[];
  country: string; // ISO 3166-1 alpha-2
  region: string; // food pack id derived from the country
  diets: string[]; // ids from data/diets.ts
  hasAllergies: boolean;
  allergens: string[]; // known allergen ids
  avoidFoods: string[]; // free-text foods to avoid / other allergies
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
  meal: Meal;
  estimated?: boolean; // calories were estimated by the app
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
  cat: 'protein' | 'carb' | 'veg' | 'fruit' | 'fat' | 'dairy' | 'treat' | 'drink';
  kcal: number; // per 100 g (or 100 ml)
  p: number;
  c: number;
  f: number;
  servingG: number;
  servingLabel: string;
  /**
   * Ingredient tags used for diets and allergies: meat, beef, pork, poultry, lamb, fish, shellfish, egg, dairy,
   * gluten, grain, legume, soy, nuts, peanut, sesame, honey, alcohol, processed.
   */
  tags?: string[];
  meals?: Meal[];
  maxServings?: number;
  estimated?: boolean;
  /** Saved by the user as "one portion" (for example from Quick calories); weight is not shown. */
  portionOnly?: boolean;
}

export interface Region {
  id: string;
  name: string;
  note: string;
  foods: Food[];
}

export type Status = 'collecting' | 'ahead' | 'green' | 'yellow' | 'red';

export interface Totals {
  kcal: number;
  p: number;
  c: number;
  f: number;
}
