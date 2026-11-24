import { KCAL_PER_KG } from './calc';
import { addDays, daysBetween } from './dates';
import { projectWeights } from './plan';
import type { SimInput } from './plan';
import type { Status } from './types';

export interface WeightPoint {
  date: string;
  kg: number;
}

/**
 * Smoothed "trend weight": an exponential moving average that only moves on days you weigh in.
 * Daily readings swing 1-2 kg from water, salt, food volume and (for women) the cycle, so the trend is what counts.
 */
export function trendSeries(points: WeightPoint[], alpha = 0.2): WeightPoint[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const out: WeightPoint[] = [];
  let t: number | null = null;
  for (const p of sorted) {
    t = t === null ? p.kg : t + alpha * (p.kg - t);
    out.push({ date: p.date, kg: t });
  }
  return out;
}

/** Least-squares slope in kg/week over the points in the last `windowDays` days. */
export function weeklyRate(points: WeightPoint[], windowDays = 14): number | null {
  if (points.length < 3) return null;
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1].date;
  const win = sorted.filter((p) => daysBetween(p.date, last) <= windowDays);
  if (win.length < 3) return null;
  const x0 = win[0].date;
  const xs = win.map((p) => daysBetween(x0, p.date));
  if (xs[xs.length - 1] - xs[0] < 6) return null;
  const n = win.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = win.reduce((a, p) => a + p.kg, 0) / n;
  let num = 0;
  let den = 0;
  win.forEach((p, i) => {
    num += (xs[i] - mx) * (p.kg - my);
    den += (xs[i] - mx) ** 2;
  });
  return den === 0 ? null : (num / den) * 7;
}

export interface OnTrack {
  status: Status;
  expectedKg: number | null;
  trendKg: number | null;
  diffKg: number | null; // trend - expected; negative = ahead of plan
  rateKgPerWeek: number | null;
  daysLogged: number; // days with food logged in the last 7
  message: string;
  tips: string[];
}

export interface OnTrackInput {
  start: WeightPoint; // day-0 weight at plan start
  weights: WeightPoint[]; // all weigh-ins (can include day 0)
  today: string;
  sim: SimInput;
  intake: number; // planned daily kcal
  tdeeScale?: number;
  foodDaysLast7: number;
}

export function evaluateOnTrack(i: OnTrackInput): OnTrack {
  const ws = i.weights.filter((w) => w.date >= i.start.date).sort((a, b) => a.date.localeCompare(b.date));
  const span = ws.length ? daysBetween(ws[0].date, ws[ws.length - 1].date) : 0;
  const base = { daysLogged: i.foodDaysLast7, rateKgPerWeek: weeklyRate(ws), tips: [] as string[] };
  if (ws.length < 3 || span < 6) {
    return {
      ...base,
      status: 'collecting',
      expectedKg: null,
      trendKg: ws.length ? trendSeries(ws)[ws.length - 1].kg : null,
      diffKg: null,
      message: 'Keep weighing in and logging. I need about a week of data (at least 3 weigh-ins) before I can say if you are on track. No verdict yet, and that is normal.',
      tips: ['Weigh yourself at the same time each morning, after the toilet, before eating.'],
    };
  }
  const trend = trendSeries(ws);
  const trendKg = trend[trend.length - 1].kg;
  const day = Math.max(0, daysBetween(i.start.date, i.today));
  const curve = projectWeights(i.sim, i.start.kg, i.intake, day, i.tdeeScale ?? 1);
  const expectedKg = curve[curve.length - 1];
  const diff = trendKg - expectedKg;
  const tol = Math.max(0.5, i.start.kg * 0.006);
  let status: Status;
  if (diff <= -tol) status = 'ahead';
  else if (diff <= tol) status = 'green';
  else if (diff <= 2 * tol) status = 'yellow';
  else status = 'red';

  const tips: string[] = [];
  if (status === 'yellow' || status === 'red') {
    if (i.foodDaysLast7 < 5) tips.push(`You logged food on ${i.foodDaysLast7} of the last 7 days. Untracked days are usually where the gap hides. Aim for 5+.`);
    tips.push('Check portions of oil, rice, drinks and snacks, which are the most common calorie leaks.');
    tips.push('Add a 10-15 minute walk after your biggest meal. Small daily movement adds up.');
    if (status === 'red') tips.push('If you have been honest with logging for 2+ weeks, tap "Re-time my plan" so the finish date matches reality. A longer timeline is not failure; it is how most people succeed.');
  }
  if (status === 'ahead') tips.push('Ahead of plan. Do not cut calories further: eat your target, keep protein up, and enjoy the lead.');
  if (i.foodDaysLast7 >= 5 && status !== 'ahead' && status !== 'green') tips.push('Your logging is solid, so your body may be burning a bit less than estimated. The app will adapt your numbers as data builds.');

  const msg: Record<Status, string> = {
    collecting: '',
    ahead: 'Ahead of plan. Your trend weight is below where the plan predicted.',
    green: 'On track. Your trend weight matches the plan.',
    yellow: 'A little behind plan. Not a problem: small tweaks can close this.',
    red: 'Behind plan. Not a failure, just information. Let us adjust the plan or the habits.',
  };
  return { ...base, status, expectedKg, trendKg, diffKg: diff, message: msg[status], tips };
}

export interface IntakeDay {
  date: string;
  kcal: number; // 0 if not logged
  complete: boolean;
}

/**
 * Estimate real maintenance from what you ate and how your trend weight moved.
 * Needs >= 10 complete food days and >= 10 days between first and last weigh-in. Returns null if not enough data.
 */
export function adaptiveTdee(weights: WeightPoint[], intake: IntakeDay[]): { tdee: number; days: number } | null {
  const ws = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  if (ws.length < 4) return null;
  const trend = trendSeries(ws);
  const first = trend[0];
  const last = trend[trend.length - 1];
  const span = daysBetween(first.date, last.date);
  if (span < 10) return null;
  const days = intake.filter((d) => d.complete && d.date >= first.date && d.date <= last.date && d.kcal >= 600);
  if (days.length < 10) return null;
  const avg = days.reduce((a, d) => a + d.kcal, 0) / days.length;
  const dTrend = last.kg - first.kg;
  const est = avg - (dTrend * KCAL_PER_KG) / span;
  return { tdee: Math.round(est), days: days.length };
}

/** Date the trend is projected to reach the goal if the user keeps eating `intake` from today's trend weight. */
export function projectedFinish(
  sim: SimInput,
  trendKg: number,
  goalKg: number,
  intake: number,
  today: string,
  tdeeScale = 1,
): string | null {
  if (trendKg <= goalKg) return today;
  const curve = projectWeights(sim, trendKg, intake, 730, tdeeScale);
  const idx = curve.findIndex((w) => w <= goalKg);
  return idx < 0 ? null : addDays(today, idx);
}
