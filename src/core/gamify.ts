import { addDays, daysBetween, parseDate } from './dates';
import type { DayLog, WorkoutLog } from './types';

export interface GameInput {
  days: Record<string, DayLog>;
  weights: Record<string, number>;
  workouts: WorkoutLog[];
  waterTarget: number;
  kcalTarget: number;
  stepTarget: number;
  budgetPerDay: number;
  startDate: string;
  today: string;
  startWeight: number;
  trendKg: number | null;
  pushStep: number;
}

export const XP = { food: 20, water: 15, workout: 60, weigh: 10, steps: 15, challenge: 10 };

const hasFood = (d?: DayLog) => !!d && d.food.length > 0;
const kcalOf = (d?: DayLog) => (d ? d.food.reduce((a, e) => a + e.kcal, 0) : 0);

export function dayActive(i: GameInput, date: string): boolean {
  return hasFood(i.days[date]) || i.workouts.some((w) => w.date === date) || i.weights[date] !== undefined;
}

export interface Streak {
  current: number;
  best: number;
  freezes: number;
  freezeUsedOn: string[];
}

/**
 * A day counts if you logged food, a workout, or a weigh-in. Every 7 active days in a row earns a freeze (max 2);
 * a missed day uses a freeze automatically instead of breaking the streak. Today never breaks a streak (the day isn't over).
 */
export function computeStreak(i: GameInput): Streak {
  let current = 0;
  let best = 0;
  let freezes = 0;
  const used: string[] = [];
  let sinceFreeze = 0;
  const n = Math.max(0, daysBetween(i.startDate, i.today));
  for (let k = 0; k <= n; k++) {
    const date = addDays(i.startDate, k);
    if (dayActive(i, date)) {
      current += 1;
      sinceFreeze += 1;
      if (sinceFreeze >= 7) {
        freezes = Math.min(2, freezes + 1);
        sinceFreeze = 0;
      }
      best = Math.max(best, current);
    } else if (date !== i.today) {
      if (freezes > 0) {
        freezes -= 1;
        used.push(date);
      } else {
        current = 0;
        sinceFreeze = 0;
      }
    }
  }
  return { current, best, freezes, freezeUsedOn: used };
}

export interface XpBreakdown {
  total: number;
  level: number;
  intoLevel: number;
  levelSize: number;
  parts: { label: string; xp: number; n: number }[];
}

export function levelFor(xp: number): { level: number; intoLevel: number; levelSize: number } {
  let level = 1;
  let need = 100;
  let left = xp;
  while (left >= need) {
    left -= need;
    level += 1;
    need = Math.round(need * 1.18);
  }
  return { level, intoLevel: left, levelSize: need };
}

export function computeXp(i: GameInput): XpBreakdown {
  const dates = Object.keys(i.days);
  const foodDays = dates.filter((d) => hasFood(i.days[d])).length;
  const waterDays = dates.filter((d) => i.days[d].waterMl >= i.waterTarget * 0.95).length;
  const stepDays = dates.filter((d) => (i.days[d].steps ?? 0) >= i.stepTarget).length;
  const chDays = dates.filter((d) => i.days[d].challengeDone).length;
  const weighDays = Object.keys(i.weights).length;
  const parts = [
    { label: 'Logged food', n: foodDays, xp: foodDays * XP.food },
    { label: 'Hit water goal', n: waterDays, xp: waterDays * XP.water },
    { label: 'Workouts', n: i.workouts.length, xp: i.workouts.length * XP.workout },
    { label: 'Weigh-ins', n: weighDays, xp: weighDays * XP.weigh },
    { label: 'Step goal', n: stepDays, xp: stepDays * XP.steps },
    { label: 'Daily challenges', n: chDays, xp: chDays * XP.challenge },
  ];
  const total = parts.reduce((a, p) => a + p.xp, 0);
  return { total, parts, ...levelFor(total) };
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  earned: boolean;
}

export function computeBadges(i: GameInput, streak: Streak, level: number): Badge[] {
  const dates = Object.keys(i.days);
  const foodDays = dates.filter((d) => hasFood(i.days[d])).length;
  const waterDays = dates.filter((d) => i.days[d].waterMl >= i.waterTarget * 0.95).length;
  const budgetDays = dates.filter((d) => {
    const c = i.days[d].food.reduce((a, e) => a + e.cost, 0);
    return hasFood(i.days[d]) && c > 0 && c <= i.budgetPerDay;
  }).length;
  const onTargetDays = dates.filter((d) => {
    const k = kcalOf(i.days[d]);
    return hasFood(i.days[d]) && k >= i.kcalTarget * 0.9 && k <= i.kcalTarget * 1.05;
  }).length;
  const lost = i.trendKg === null ? 0 : i.startWeight - i.trendKg;
  const pct = (lost / i.startWeight) * 100;
  const b = (id: string, emoji: string, name: string, desc: string, earned: boolean): Badge => ({ id, emoji, name, desc, earned });
  return [
    b('first-log', '📝', 'First Bite', 'Log your first food.', foodDays >= 1),
    b('first-workout', '💥', 'Day One', 'Finish your first workout.', i.workouts.length >= 1),
    b('workouts-10', '🔟', 'Ten Strong', 'Finish 10 workouts.', i.workouts.length >= 10),
    b('workouts-30', '🏆', 'Thirty Club', 'Finish 30 workouts.', i.workouts.length >= 30),
    b('streak-3', '🔥', 'Spark', 'Reach a 3-day streak.', streak.best >= 3),
    b('streak-7', '🔥', 'On Fire', 'Reach a 7-day streak.', streak.best >= 7),
    b('streak-30', '🌋', 'Unstoppable', 'Reach a 30-day streak.', streak.best >= 30),
    b('water-7', '💧', 'Hydro Hero', 'Hit your water goal on 7 days.', waterDays >= 7),
    b('logger-30', '📒', 'Honest Logger', 'Log food on 30 days.', foodDays >= 30),
    b('on-target-10', '🎯', 'Bullseye', 'Land within your calorie range on 10 days.', onTargetDays >= 10),
    b('budget-7', '🪙', 'Budget Boss', 'Stay on budget on 7 logged days.', budgetDays >= 7),
    b('pushup', '💪', 'Full Push-up', 'Unlock the full push-up progression.', i.pushStep >= 3),
    b('lost-1', '⭐', 'First Kilo', 'Trend weight down 1 kg.', lost >= 1),
    b('lost-5pct', '🌟', '5% Club', 'Lose 5% of your starting weight (a clinically meaningful milestone).', pct >= 5),
    b('lost-10pct', '🏅', '10% Club', 'Lose 10% of your starting weight.', pct >= 10),
    b('level-5', '🚀', 'Level 5', 'Reach level 5.', level >= 5),
  ];
}

// ---- Weekly quests (derived, so they can never get out of sync) ----

export interface Quest {
  id: string;
  title: string;
  progress: number;
  goal: number;
  xp: number;
}

export function weekStart(date: string, startDate: string): string {
  const w = Math.floor(daysBetween(startDate, date) / 7);
  return addDays(startDate, w * 7);
}

export function weeklyQuests(i: GameInput): Quest[] {
  const ws = weekStart(i.today, i.startDate);
  const inWeek = (d: string) => d >= ws && d <= addDays(ws, 6);
  const dates = Object.keys(i.days).filter(inWeek);
  const q = (id: string, title: string, progress: number, goal: number, xp: number): Quest => ({ id, title, progress: Math.min(progress, goal), goal, xp });
  return [
    q('food', 'Log your food on 5 days', dates.filter((d) => hasFood(i.days[d])).length, 5, 50),
    q('water', 'Hit your water goal on 4 days', dates.filter((d) => i.days[d].waterMl >= i.waterTarget * 0.95).length, 4, 40),
    q('workout', 'Finish 3 workouts', i.workouts.filter((w) => inWeek(w.date)).length, 3, 80),
    q('steps', 'Reach your step goal on 3 days', dates.filter((d) => (i.days[d].steps ?? 0) >= i.stepTarget).length, 3, 40),
    q('weigh', 'Weigh in 3 times', Object.keys(i.weights).filter(inWeek).length, 3, 30),
  ];
}

export const CHALLENGES = [
  'Drink a full glass of water before each meal.',
  'Take a 10-minute walk after your biggest meal.',
  'Do 10 sit-to-stands during a TV break.',
  'Swap one sugary drink for water or unsweetened tea.',
  'Add one extra vegetable to a meal.',
  'Stand and stretch for 2 minutes every hour.',
  'Eat your protein first at one meal.',
  'Put your fork down between bites at lunch.',
  'Go to bed 30 minutes earlier tonight: sleep helps appetite control.',
  'Take the stairs or walk one extra errand today.',
  'Plate your food (no eating from the bag or pot) at every meal.',
  'Do a 1-minute wall sit or plank.',
];

export function challengeFor(date: string): string {
  const n = Math.floor(parseDate(date).getTime() / 86400000);
  return CHALLENGES[((n % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length];
}

export const COACH_LINES: Record<string, string[]> = {
  collecting: ['Day by day. Logging is the win right now, not the scale.', 'Every entry makes me smarter about you. Keep going!'],
  ahead: ['You are crushing it. Keep eating your target, do not cut more!', 'Ahead of plan. Protect your muscle: keep the protein up.'],
  green: ['Right on track. This is what steady looks like.', 'On plan. Boring is beautiful.'],
  yellow: ['A small nudge and you are back. One good day at a time.', 'Slightly behind. Not a problem: check the tips below.'],
  red: ['A rough patch is data, not defeat. Let us adjust together.', 'Behind plan. Consider re-timing: slower is still forward.'],
};
