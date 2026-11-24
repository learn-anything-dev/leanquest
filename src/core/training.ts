import { bmi } from './calc';
import { buildFeasibility } from './plan';
import type { Profile } from './types';
import { ACTIVITIES, activityKcal, activityName, getActivity, isCustom } from '../data/activities';
import { DAY_PLANS, stepGoal } from '../data/exercises';

export type DayKind = 'strength' | 'cardio' | 'walk' | 'rest';
export type TrainingMode = 'standard' | 'gentle' | 'youth';

export interface ScheduleDay {
  day: string;
  kind: DayKind;
  title: string;
  detail: string;
  strengthDay?: number; // index into DAY_PLANS
}

export interface Recommendation {
  mode: TrainingMode;
  headline: string;
  why: string[];
  strengthDays: number;
  cardioSessions: number;
  cardioMinutes: number;
  steps: number;
  weeklyMinutes: number;
  intensity: string;
  lowImpact: boolean;
  schedule: ScheduleDay[];
  cautions: string[];
}

export interface CardioPick {
  id: string;
  name: string;
  how: string;
}

const DEFAULT_HOW = 'Keep a steady, comfortable effort you could hold a conversation at.';

/** Cardio the user could be asked to do: their picks (cardio-capable only), swapping high-impact ones when joints need care. */
export function cardioPool(comfortable: string[], lowImpact: boolean): CardioPick[] {
  const picks: CardioPick[] = [];
  for (const id of comfortable) {
    if (isCustom(id)) { picks.push({ id, name: activityName(id), how: DEFAULT_HOW }); continue; }
    const a = getActivity(id);
    if (!a || !a.cardio) continue;
    if (lowImpact && a.impact === 'high') continue;
    picks.push({ id, name: a.name, how: a.how ?? DEFAULT_HOW });
  }
  if (!picks.length) { const w = getActivity('walk-brisk')!; picks.push({ id: w.id, name: w.name, how: w.how ?? DEFAULT_HOW }); }
  return picks;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PATTERN_NAME: Record<string, string> = { squat: 'Squat', push: 'Push', pull: 'Pull', hinge: 'Hinge', lunge: 'Lunge', core: 'Core' };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Monday = 0 ... Sunday = 6, from a YYYY-MM-DD string. */
export function weekdayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

/**
 * Suggests a weekly training mix from the plan the user chose (calorie level, how aggressive it is),
 * their starting level, how much they already move, their joints and the cardio they enjoy.
 */
export function recommend(p: Profile, week: number, level: 'Beginner' | 'Intermediate' | 'Expert'): Recommendation {
  const feas = buildFeasibility(p);
  const plan = p.choice === 'goal' ? feas.goal : feas.realistic;
  const b = bmi(p.startWeightKg, p.heightCm);
  const lowImpact = b >= 30 || p.limitations.includes('knees') || p.limitations.includes('back');
  const easeIn = week <= 2;
  const cautions: string[] = [];

  let mode: TrainingMode = 'standard';
  if (p.screening.eatingDisorder) mode = 'gentle';
  else if (p.screening.under18) mode = 'youth';
  else if (p.screening.pregnant) mode = 'gentle';

  let strengthDays: number;
  let cardioSessions: number;
  let cardioMinutes: number;
  let steps = stepGoal(p.baselineSteps, week);
  let headline: string;
  const why: string[] = [];

  if (mode === 'gentle') {
    strengthDays = 2; cardioSessions = 2; cardioMinutes = 20;
    headline = 'Gentle, enjoyable movement';
    why.push('Movement here is for strength, mood and energy, not for burning calories.');
    cautions.push(p.screening.pregnant ? 'Follow your doctor or midwife on what exercise is right for you.' : 'Please work with a health professional on exercise and eating.');
  } else if (mode === 'youth') {
    strengthDays = 3; cardioSessions = 3; cardioMinutes = 30;
    headline = 'Stay active and build strength';
    why.push('Aim for about 60 minutes of active play, sport or walking on most days.');
    cautions.push('Talk to a doctor if you are worried about your weight.');
  } else if (p.choice === 'goal' && feas.plansDiffer) {
    strengthDays = easeIn ? 2 : 3;
    cardioSessions = easeIn ? 3 : 4;
    cardioMinutes = clamp(25 + 5 * Math.floor((week - 1) / 2), 25, 45);
    steps = Math.min(10000, stepGoal(p.baselineSteps, 1 + (week - 1) * 2));
    headline = 'Higher activity to support a faster plan';
    why.push(`Your goal plan eats ${plan.intake} kcal${plan.atFloor ? ', the lowest the app plans' : ''}, so it counts on about ${steps.toLocaleString()} steps a day plus every workout.`);
    cautions.push('Low calories plus high activity can leave you drained. If you feel dizzy or unusually tired, drop a cardio session.');
  } else {
    strengthDays = easeIn ? 2 : 3;
    cardioSessions = level === 'Beginner' ? 2 : 3;
    cardioMinutes = clamp(20 + 5 * Math.floor((week - 1) / 2), 20, 40);
    headline = 'Build strength and walk more';
    why.push(`Your plan eats ${plan.intake} kcal${plan.deficit > 0 ? `, ${plan.deficit} below maintenance` : ''}. Training protects your muscle while the deficit does the fat loss.`);
  }

  if (p.currentMinutesPerWeek < 30 && easeIn && mode === 'standard') cardioMinutes = Math.max(15, cardioMinutes - 5);
  why.push(level === 'Beginner'
    ? 'Moves start easy and step up each time they feel easy.'
    : `You are at ${level.toLowerCase()} level, so moves start harder than the basics.`);
  if (lowImpact) why.push('Everything is low impact: no jumping.');
  if (p.screening.medical) cautions.push('Check with your doctor before increasing your activity.');

  const intensity = easeIn
    ? 'Easy to moderate: you can talk in full sentences.'
    : 'Moderate: you can talk but not sing.';

  // build the week
  const pool = cardioPool(p.comfortable, lowImpact);
  const strengthIdx = strengthDays >= 3 ? [0, 2, 4] : [0, 3];
  const cardioOrder = [1, 5, 3, 6, 2, 4].filter((i) => !strengthIdx.includes(i));
  const cardioIdx = cardioOrder.slice(0, cardioSessions);
  const free = [0, 1, 2, 3, 4, 5, 6].filter((i) => !strengthIdx.includes(i) && !cardioIdx.includes(i));
  const restIdx = free.includes(6) ? 6 : free.length > 1 ? free[free.length - 1] : -1;

  let s = 0;
  let c = 0;
  const schedule: ScheduleDay[] = DAYS.map((day, i) => {
    if (strengthIdx.includes(i)) {
      const n = s++ % DAY_PLANS.length;
      return { day, kind: 'strength', title: `Strength · Day ${n + 1}`, detail: DAY_PLANS[n].map((x) => PATTERN_NAME[x]).join(', '), strengthDay: n };
    }
    if (cardioIdx.includes(i)) {
      const opt = pool[c++ % pool.length];
      const kcal = Math.round(activityKcal(opt.id, p.startWeightKg, cardioMinutes) / 10) * 10;
      return { day, kind: 'cardio', title: opt.name, detail: `${cardioMinutes} min · about ${kcal} kcal` };
    }
    if (i === restIdx) return { day, kind: 'rest', title: 'Rest', detail: 'Easy stretch if you like' };
    return { day, kind: 'walk', title: 'Walk', detail: `${steps.toLocaleString()} steps` };
  });

  return {
    mode, headline, why, strengthDays, cardioSessions, cardioMinutes, steps,
    weeklyMinutes: strengthDays * 30 + cardioSessions * cardioMinutes,
    intensity, lowImpact, schedule, cautions,
  };
}

export function todaysSession(rec: Recommendation, date: string): ScheduleDay {
  return rec.schedule[weekdayIndex(date)];
}
