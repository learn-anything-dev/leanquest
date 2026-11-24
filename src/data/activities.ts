/**
 * Activity catalog. MET values come from the Compendium of Physical Activities (rounded, typical recreational
 * effort). Calories burned above resting = (MET - 1) x body weight (kg) x hours.
 */
export interface Activity {
  id: string;
  name: string;
  category: string;
  met: number;
  impact: 'low' | 'high';
  /** Can be suggested as a cardio session. */
  cardio: boolean;
  how?: string;
}

export const CATEGORIES = [
  'Walking & running',
  'Cycling',
  'Swimming & water',
  'Ball & racket sports',
  'Dance & classes',
  'Strength & conditioning',
  'Mind & body',
  'Martial arts & combat',
  'Outdoor & everyday',
] as const;

const A = (id: string, name: string, category: string, met: number, impact: 'low' | 'high', cardio: boolean, how?: string): Activity => ({ id, name, category, met, impact, cardio, how });

export const ACTIVITIES: Activity[] = [
  // Walking & running
  A('walk-easy', 'Easy walking', 'Walking & running', 2.8, 'low', true, 'Comfortable pace. Add a few minutes each week.'),
  A('walk-brisk', 'Brisk walking', 'Walking & running', 4.3, 'low', true, 'Fast enough that you can talk but not sing.'),
  A('walk-incline', 'Treadmill / hill walking', 'Walking & running', 5.3, 'low', true, 'Walk uphill or use a treadmill incline for a harder effort.'),
  A('hike', 'Hiking', 'Walking & running', 6.0, 'low', true, 'Steady pace on trails. Bring water.'),
  A('stairs', 'Stair climbing', 'Walking & running', 6.0, 'low', true, 'Climb at a steady pace. Hold the rail and rest as needed.'),
  A('jog', 'Jogging', 'Walking & running', 7.0, 'high', true, 'Easy jog or run-walk intervals.'),
  A('run', 'Running', 'Walking & running', 9.8, 'high', true, 'Steady run at a conversational pace.'),
  // Cycling
  A('cycle-leisure', 'Leisure cycling', 'Cycling', 4.0, 'low', true, 'Relaxed ride on flat ground.'),
  A('cycle-moderate', 'Cycling (moderate)', 'Cycling', 8.0, 'low', true, 'Steady, slightly breathless pace.'),
  A('bike-stationary', 'Stationary bike', 'Cycling', 5.5, 'low', true, 'Steady effort with light to medium resistance.'),
  A('spin', 'Spin class', 'Cycling', 8.5, 'low', true, 'Follow the instructor and go by feel.'),
  // Swimming & water
  A('swim-leisure', 'Swimming (easy)', 'Swimming & water', 6.0, 'low', true, 'Easy steady laps. Kind to joints.'),
  A('swim-laps', 'Swimming laps (steady)', 'Swimming & water', 8.0, 'low', true, 'Steady laps with short rests.'),
  A('water-walk', 'Water walking / aqua aerobics', 'Swimming & water', 5.3, 'low', true, 'Walk or move in chest-deep water.'),
  A('kayak', 'Kayaking / paddling', 'Swimming & water', 5.0, 'low', true),
  A('surf', 'Surfing / paddleboarding', 'Swimming & water', 3.0, 'low', false),
  // Ball & racket sports
  A('badminton', 'Badminton', 'Ball & racket sports', 5.5, 'low', true, 'Social games count. Keep moving between rallies.'),
  A('tennis', 'Tennis', 'Ball & racket sports', 7.3, 'low', true),
  A('table-tennis', 'Table tennis', 'Ball & racket sports', 4.0, 'low', true),
  A('pickleball', 'Pickleball', 'Ball & racket sports', 4.8, 'low', true),
  A('squash', 'Squash', 'Ball & racket sports', 7.3, 'low', true),
  A('basketball', 'Basketball (game)', 'Ball & racket sports', 8.0, 'high', true, 'Casual half-court games count.'),
  A('volleyball', 'Volleyball', 'Ball & racket sports', 4.0, 'high', true),
  A('football', 'Football / soccer', 'Ball & racket sports', 7.0, 'high', true),
  A('baseball', 'Baseball / softball', 'Ball & racket sports', 5.0, 'low', true),
  A('cricket', 'Cricket', 'Ball & racket sports', 4.8, 'low', true),
  A('frisbee', 'Frisbee / ultimate', 'Ball & racket sports', 3.0, 'low', false),
  A('bowling', 'Bowling', 'Ball & racket sports', 3.0, 'low', false),
  A('golf', 'Golf (walking)', 'Ball & racket sports', 4.3, 'low', false),
  // Dance & classes
  A('dance-social', 'Social / freestyle dancing', 'Dance & classes', 4.5, 'low', true, 'Put on songs you love and move. Low-impact steps are fine.'),
  A('zumba', 'Zumba / dance fitness', 'Dance & classes', 6.0, 'low', true, 'Follow a class or video. Keep it low impact if needed.'),
  A('aerobics-low', 'Low-impact aerobics', 'Dance & classes', 5.0, 'low', true),
  A('aerobics-high', 'High-impact aerobics', 'Dance & classes', 7.3, 'high', true),
  A('step-aerobics', 'Step aerobics', 'Dance & classes', 7.5, 'low', true),
  A('ballroom', 'Ballroom / line dancing', 'Dance & classes', 3.5, 'low', false),
  A('active-games', 'Active video games (Just Dance, Ring Fit)', 'Dance & classes', 4.0, 'low', true),
  // Strength & conditioning
  A('bodyweight-light', 'Bodyweight training (light)', 'Strength & conditioning', 3.5, 'low', false),
  A('bodyweight-hard', 'Bodyweight training (hard)', 'Strength & conditioning', 8.0, 'low', false),
  A('weights-light', 'Weights / resistance bands', 'Strength & conditioning', 3.5, 'low', false),
  A('weights-hard', 'Heavy weight training', 'Strength & conditioning', 6.0, 'low', false),
  A('circuit', 'Circuit training', 'Strength & conditioning', 6.0, 'low', true, 'Rotate through stations with short rests.'),
  A('hiit', 'HIIT', 'Strength & conditioning', 8.0, 'high', true, 'Short hard bursts with easy recovery.'),
  A('kettlebell', 'Kettlebell training', 'Strength & conditioning', 6.0, 'low', false),
  A('crossfit', 'CrossFit-style training', 'Strength & conditioning', 8.0, 'high', true),
  A('jump-rope', 'Jump rope', 'Strength & conditioning', 10.0, 'high', true),
  A('rowing', 'Rowing machine', 'Strength & conditioning', 7.0, 'low', true),
  A('elliptical', 'Elliptical', 'Strength & conditioning', 5.0, 'low', true, 'Smooth, low-impact steady effort.'),
  // Mind & body
  A('yoga', 'Yoga (gentle)', 'Mind & body', 2.5, 'low', false),
  A('yoga-power', 'Power / vinyasa yoga', 'Mind & body', 4.0, 'low', false),
  A('pilates', 'Pilates', 'Mind & body', 3.0, 'low', false),
  A('tai-chi', 'Tai chi / qigong', 'Mind & body', 3.0, 'low', false),
  A('stretching', 'Stretching / mobility', 'Mind & body', 2.3, 'low', false),
  // Martial arts & combat
  A('martial-arts', 'Martial arts class', 'Martial arts & combat', 5.3, 'low', true),
  A('boxing', 'Boxing / kickboxing class', 'Martial arts & combat', 7.0, 'low', true),
  A('taekwondo', 'Taekwondo / karate', 'Martial arts & combat', 7.0, 'low', true),
  A('bjj', 'Judo / jiu-jitsu / wrestling', 'Martial arts & combat', 8.0, 'low', false),
  A('shadow-box', 'Heavy bag / shadow boxing', 'Martial arts & combat', 5.5, 'low', true),
  // Outdoor & everyday
  A('gardening', 'Gardening / yard work', 'Outdoor & everyday', 3.8, 'low', false),
  A('housework', 'Heavy housework / cleaning', 'Outdoor & everyday', 3.3, 'low', false),
  A('play-kids', 'Active play with children', 'Outdoor & everyday', 4.0, 'low', false),
  A('walk-dog', 'Walking the dog', 'Outdoor & everyday', 3.0, 'low', true, 'Make it a brisk walk.'),
  A('skating', 'Skating (roller / ice)', 'Outdoor & everyday', 6.0, 'low', true),
  A('skateboard', 'Skateboarding / scootering', 'Outdoor & everyday', 5.0, 'low', false),
  A('climbing', 'Rock / wall climbing', 'Outdoor & everyday', 7.5, 'low', false),
  A('moving', 'Carrying / moving things', 'Outdoor & everyday', 6.0, 'low', false),
];

const BY_ID = new Map(ACTIVITIES.map((a) => [a.id, a]));
const CUSTOM_MET = 4.0; // moderate effort when the user adds an activity we do not list

export function isCustom(id: string): boolean {
  return id.startsWith('custom:');
}

export function activityName(id: string): string {
  return isCustom(id) ? id.slice(7) : BY_ID.get(id)?.name ?? id;
}

export function getActivity(id: string): Activity | undefined {
  return BY_ID.get(id);
}

export function metFor(id: string): number {
  return BY_ID.get(id)?.met ?? CUSTOM_MET;
}

/** Calories burned above resting for one session of `minutes`. */
export function activityKcal(id: string, weightKg: number, minutes: number): number {
  return Math.max(0, (metFor(id) - 1) * weightKg * (minutes / 60));
}

export function weeklyExerciseKcal(entries: { id: string; minutes: number }[], weightKg: number): number {
  return entries.reduce((a, e) => a + activityKcal(e.id, weightKg, e.minutes), 0);
}

export function searchActivities(q: string): Activity[] {
  const term = q.trim().toLowerCase();
  if (!term) return ACTIVITIES;
  return ACTIVITIES.filter((a) => `${a.name} ${a.category}`.toLowerCase().includes(term));
}
