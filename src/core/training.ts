import { bmi } from './calc';
import { buildFeasibility } from './plan';
import type { Profile } from './types';
import { activityKcal, activityName, getActivity, isCustom } from '../data/activities';
import { DAY_PLANS, stepGoal } from '../data/exercises';

export type DayKind = 'strength' | 'cardio' | 'sport' | 'walk' | 'rest';
export type TrainingMode = 'standard' | 'gentle' | 'youth';

export interface ScheduleDay {
  day: string;
  kind: DayKind;
  title: string;
  detail: string;
  strengthDay?: number; // index into DAY_PLANS
  /** "yours" = a sport the user scheduled; "plan" = suggested by the app. */
  source: 'yours' | 'plan';
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
  /** Days (Mon = 0) the user plays their own sports. */
  sportDays: number[];
  /** Days (Mon = 0) the user said they can train. */
  trainDays: number[];
  /** Days (Mon = 0) the user can walk or exercise outside. */
  outdoorDays: number[];
  /** True when the plan is built around home bodyweight training (few or no outdoor days). */
  homeFocused: boolean;
}

export interface CardioPick {
  id: string;
  name: string;
  how: string;
}

const DEFAULT_HOW = 'Keep a steady, comfortable effort you could hold a conversation at.';
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Activities that need a venue, partner or team. They are only ever scheduled by the user, never suggested. */
const SCHEDULED_ONLY_CATEGORIES = new Set(['Ball & racket sports', 'Martial arts & combat']);

/**
 * Cardio the app may suggest on free days: things the user enjoys that can be done on any day. It never includes a
 * sport the user has scheduled, or sports that need a court/partner, and it always offers at least two choices so one
 * activity is not repeated all week.
 */
export function cardioPool(comfortable: string[], lowImpact: boolean, scheduled: ReadonlySet<string> = new Set()): CardioPick[] {
  const picks: CardioPick[] = [];
  const add = (id: string) => {
    if (picks.some((x) => x.id === id) || scheduled.has(id)) return;
    if (isCustom(id)) { picks.push({ id, name: activityName(id), how: DEFAULT_HOW }); return; }
    const a = getActivity(id);
    if (!a || !a.cardio) return;
    if (SCHEDULED_ONLY_CATEGORIES.has(a.category)) return;
    if (lowImpact && a.impact === 'high') return;
    picks.push({ id, name: a.name, how: a.how ?? DEFAULT_HOW });
  };
  comfortable.forEach(add);
  for (const fallback of ['walk-brisk', 'cycle-leisure', 'swim-leisure']) {
    if (picks.length >= 2) break;
    add(fallback);
  }
  return picks;
}

/** Cardio that needs no venue, equipment or going outside. These are the only cardio ideas for indoor-only days. */
export const HOME_CARDIO = ['circuit', 'dance-social', 'zumba', 'aerobics-low', 'aerobics-high', 'active-games', 'step-aerobics', 'hiit', 'jump-rope'];

export function homeCardioPool(comfortable: string[], lowImpact: boolean, scheduled: ReadonlySet<string> = new Set()): CardioPick[] {
  const picks: CardioPick[] = [];
  const add = (id: string) => {
    if (picks.some((x) => x.id === id) || scheduled.has(id)) return;
    const a = getActivity(id);
    if (!a) return;
    if (lowImpact && a.impact === 'high') return;
    picks.push({ id, name: a.name, how: a.how ?? DEFAULT_HOW });
  };
  add('circuit');
  comfortable.filter((id) => HOME_CARDIO.includes(id)).forEach(add);
  for (const fallback of ['dance-social', 'aerobics-low']) {
    if (picks.length >= 2) break;
    add(fallback);
  }
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
 * Picks `k` of the given days, spread out so sessions are not bunched up (Monday, Wednesday, Friday for three on a
 * full week). Prefers days that are not back to back.
 */
export function spreadDays(days: number[], k: number): number[] {
  const sorted = [...new Set(days)].sort((x, y) => x - y);
  if (k <= 0) return [];
  if (k >= sorted.length) return sorted;
  const noneAdjacent = (xs: number[]) => xs.every((d, i) => i === 0 || d - xs[i - 1] >= 2);
  // A: evenly spaced positions along the list.
  const even = [...new Set(Array.from({ length: k }, (_, i) => sorted[Math.floor((i * sorted.length) / k)]))];
  // B: every other available day starting from the first.
  const alt: number[] = [];
  for (const d of sorted) { if (alt.length < k && (!alt.length || d - alt[alt.length - 1] >= 2)) alt.push(d); }
  const pick = [even, alt].find((c) => c.length === k && noneAdjacent(c)) ?? (even.length === k ? even : null);
  if (pick) return pick;
  const out = new Set(even);
  for (const d of sorted) { if (out.size >= k) break; out.add(d); }
  return [...out].sort((x, y) => x - y);
}

function joinDays(idx: number[]): string {
  const names = idx.map((i) => DAYS[i]);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? '';
}

/**
 * Suggests a weekly training mix from the plan the user chose, their level, the sports they already play on fixed
 * days, the days they can train, their joints and the activities they enjoy.
 *
 * Rules the schedule always follows:
 *  - Sports the user scheduled appear exactly on their days and nowhere else.
 *  - Suggested strength and cardio only use days the user can train, and never a day that already has a sport.
 *  - Home first: without outdoor days the plan is bodyweight strength plus indoor cardio. Walks and outdoor cardio
 *    appear only on days the user says they can go outside.
 *  - At least one day a week is rest.
 *  - The same activity is never suggested more than needed, and scheduled sports are never suggested as extra cardio.
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

  const outdoorSet = new Set((p.outdoorDays ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6));
  const homeFocused = outdoorSet.size <= 2;

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
    strengthDays = homeFocused ? (level === 'Beginner' ? 4 : 5) : easeIn ? 2 : 3;
    cardioSessions = easeIn ? 3 : 4;
    cardioMinutes = clamp(25 + 5 * Math.floor((week - 1) / 2), 25, 45);
    steps = Math.min(10000, stepGoal(p.baselineSteps, 1 + (week - 1) * 2));
    headline = homeFocused ? 'More work at home to support a faster plan' : 'Higher activity to support a faster plan';
    why.push(outdoorSet.size
      ? `Your goal plan eats ${plan.intake} kcal${plan.atFloor ? ', the lowest the app plans' : ''}, so it counts on about ${steps.toLocaleString()} steps a day plus every workout.`
      : `Your goal plan eats ${plan.intake} kcal${plan.atFloor ? ', the lowest the app plans' : ''}, so it counts on every workout plus extra movement around the house.`);
    cautions.push('Low calories plus high activity can leave you drained. If you feel dizzy or unusually tired, drop a cardio session.');
  } else {
    strengthDays = homeFocused ? (level === 'Beginner' ? 4 : 5) : easeIn ? 2 : 3;
    cardioSessions = level === 'Beginner' ? 2 : 3;
    cardioMinutes = clamp(20 + 5 * Math.floor((week - 1) / 2), 20, 40);
    headline = homeFocused ? 'Build strength at home' : 'Build strength and stay active outdoors';
    why.push(`Your plan eats ${plan.intake} kcal${plan.deficit > 0 ? `, ${plan.deficit} below maintenance` : ''}. Training protects your muscle while the deficit does the fat loss.`);
  }

  if (p.currentMinutesPerWeek < 30 && easeIn && mode === 'standard') cardioMinutes = Math.max(15, cardioMinutes - 5);
  if (homeFocused && mode === 'standard') {
    cardioSessions = Math.min(cardioSessions, 2);
    why.push(easeIn
      ? 'A home plan: bodyweight strength most days, with indoor cardio circuits instead of walks. Sessions are short and easy for the first two weeks.'
      : 'A home plan: bodyweight strength most days, with indoor cardio circuits instead of walks. No equipment needed.');
  }
  why.push(level === 'Beginner'
    ? 'Moves start easy and step up each time they feel easy.'
    : `You are at ${level.toLowerCase()} level, so moves start harder than the basics.`);
  if (lowImpact) why.push('Everything is low impact: no jumping.');
  if (p.screening.medical || p.screening.other.length) cautions.push('Check with your doctor before increasing your activity.');

  const intensity = easeIn
    ? 'Easy to moderate: you can talk in full sentences.'
    : 'Moderate: you can talk but not sing.';

  // 1) The user's own sports are fixed anchors.
  const sportByDay = new Map<number, { names: string[]; minutes: number; kcal: number }>();
  const scheduledIds = new Set<string>();
  let sportMinutes = 0;
  for (const e of p.currentExercise) {
    const days = [...new Set((e.days ?? []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))];
    if (!days.length) continue;
    scheduledIds.add(e.id);
    const per = e.minutes / days.length;
    for (const d of days) {
      const cur = sportByDay.get(d) ?? { names: [], minutes: 0, kcal: 0 };
      cur.names.push(activityName(e.id));
      cur.minutes += per;
      cur.kcal += activityKcal(e.id, p.startWeightKg, per);
      sportByDay.set(d, cur);
      sportMinutes += per;
    }
  }
  const sportIdx = [...sportByDay.keys()].sort((a, b) => a - b);

  // 2) Days the user can train (default: every day). Sport days are always honoured, even if not in this list.
  const trainDays = (p.trainDays ?? []).length ? [...new Set(p.trainDays!)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b) : ALL_DAYS;
  const open = trainDays.filter((d) => !sportByDay.has(d));

  // Sports count as cardio, so fewer extra cardio sessions are needed.
  cardioSessions = Math.max(0, cardioSessions - sportIdx.length);
  if (sportIdx.length) why.unshift(`Your sports on ${joinDays(sportIdx)} are in your week and count as cardio, so I planned fewer extra cardio sessions.`);

  // 3) Strength first, spread across the open days; then cardio on what is left. Keep at least one rest day.
  const MAX_ACTIVE = 6;
  const strengthIdx = spreadDays(open, Math.min(strengthDays, open.length, Math.max(0, MAX_ACTIVE - sportIdx.length)));
  const afterStrength = open.filter((d) => !strengthIdx.includes(d));
  const cardioRoom = Math.max(0, MAX_ACTIVE - sportIdx.length - strengthIdx.length);
  const cardioIdx = spreadDays(afterStrength, Math.min(cardioSessions, afterStrength.length, cardioRoom));
  const leftover = afterStrength.filter((d) => !cardioIdx.includes(d));
  const outsideTrainDays = ALL_DAYS.filter((d) => !trainDays.includes(d) && !sportByDay.has(d));
  // Rest days: days the user cannot train, plus unused indoor-only days. If that leaves none, rest on Sunday or the last free day.
  const restSet = new Set<number>([...outsideTrainDays, ...leftover.filter((d) => !outdoorSet.has(d))]);
  if (!restSet.size && leftover.length) restSet.add(leftover.includes(6) ? 6 : leftover[leftover.length - 1]);

  const poolOutdoor = cardioPool(p.comfortable, lowImpact, scheduledIds);
  const poolHome = homeCardioPool(p.comfortable, lowImpact, scheduledIds);
  let s = 0;
  let cOut = 0;
  let cHome = 0;
  const schedule: ScheduleDay[] = DAYS.map((day, i) => {
    const sport = sportByDay.get(i);
    if (sport) {
      const kcal = Math.round(sport.kcal / 10) * 10;
      return { day, kind: 'sport', source: 'yours', title: sport.names.join(' + '), detail: `${Math.round(sport.minutes)} min · about ${kcal} kcal` };
    }
    if (strengthIdx.includes(i)) {
      const n = s++ % DAY_PLANS.length;
      return { day, kind: 'strength', source: 'plan', title: `Strength · Day ${n + 1}`, detail: DAY_PLANS[n].map((x) => PATTERN_NAME[x]).join(', '), strengthDay: n };
    }
    if (cardioIdx.includes(i)) {
      const opt = outdoorSet.has(i) ? poolOutdoor[cOut++ % poolOutdoor.length] : poolHome[cHome++ % poolHome.length];
      const kcal = Math.round(activityKcal(opt.id, p.startWeightKg, cardioMinutes) / 10) * 10;
      return { day, kind: 'cardio', source: 'plan', title: opt.name, detail: `${cardioMinutes} min · about ${kcal} kcal` };
    }
    if (outsideTrainDays.includes(i)) return { day, kind: 'rest', source: 'plan', title: 'Rest', detail: 'Not a training day' };
    if (restSet.has(i)) return { day, kind: 'rest', source: 'plan', title: 'Rest', detail: outdoorSet.has(i) ? 'Easy stretch if you like' : 'Rest or light stretching at home' };
    return { day, kind: 'walk', source: 'plan', title: 'Walk', detail: `${steps.toLocaleString()} steps` };
  });

  return {
    mode, headline, why, strengthDays: strengthIdx.length, cardioSessions: cardioIdx.length, cardioMinutes, steps,
    weeklyMinutes: Math.round(strengthIdx.length * 30 + cardioIdx.length * cardioMinutes + sportMinutes),
    intensity, lowImpact, schedule, cautions, sportDays: sportIdx, trainDays,
    outdoorDays: [...outdoorSet].sort((x, y) => x - y), homeFocused,
  };
}

export function todaysSession(rec: Recommendation, date: string): ScheduleDay {
  return rec.schedule[weekdayIndex(date)];
}
