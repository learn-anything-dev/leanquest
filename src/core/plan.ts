import { KCAL_PER_KG, adjustedWeight, bmi, round, tdee } from './calc';
import { rulesFor } from '../data/diets';
import type { Activity, PlanChoice, Profile, Sex } from './types';

/** Lowest daily intake the app will ever schedule. Common convention for unsupervised plans. */
export function calorieFloor(sex: Sex): number {
  if (sex === 'female') return 1200;
  if (sex === 'male') return 1500;
  return 1350;
}

const NEXT_ACTIVITY: Record<Activity, Activity> = {
  sedentary: 'light',
  light: 'moderate',
  moderate: 'active',
  active: 'active',
};

export interface SimInput {
  sex: Sex;
  age: number;
  heightCm: number;
  activity: Activity;
  /** Extra kcal/day from deliberate exercise the user already does. */
  extra?: number;
}

/**
 * Day-by-day projection. Maintenance is recomputed from the current (falling) weight each day,
 * so loss naturally slows over time instead of staying linear like the static 7,700 kcal rule.
 * Returns weights for day 0..days.
 */
export function projectWeights(input: SimInput, startKg: number, intake: number, days: number, tdeeScale = 1): number[] {
  const out = [startKg];
  let w = startKg;
  for (let d = 0; d < days; d++) {
    const maint = tdee(input.sex, input.age, w, input.heightCm, input.activity) * tdeeScale + (input.extra ?? 0);
    w += (intake - maint) / KCAL_PER_KG;
    out.push(w);
  }
  return out;
}

/** Highest daily intake that still reaches `goalKg` after `days` (bisection; weight at deadline is monotonic in intake). */
export function intakeToReach(input: SimInput, startKg: number, goalKg: number, days: number, maint: number): number {
  let lo = 0;
  let hi = maint;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const w = projectWeights(input, startKg, mid, days)[days];
    if (w <= goalKg) lo = mid;
    else hi = mid;
  }
  return lo;
}

export interface PlanDetail {
  key: PlanChoice;
  title: string;
  intake: number;
  activity: Activity;
  deficit: number;
  atFloor: boolean;
  kgPerWeek: number; // average over the deadline window, from the dynamic projection
  pctPerWeek: number;
  projectedKg: number; // projected weight on the deadline day
  projectedLossKg: number;
  reachesGoal: boolean;
  daysToGoal: number | null; // null if not reached within 2 years
  extraSteps: number | null; // approx. daily steps needed for the activity assumption
}

export type Verdict = 'safe' | 'fast' | 'unsafe';

export interface Feasibility {
  bmi: number;
  tdee: number;
  floor: number;
  neededLossKg: number;
  requiredKgPerWeek: number;
  requiredPctPerWeek: number;
  requiredDeficit: number; // kcal/day against maintenance, using the 7,700 rule
  verdict: Verdict;
  realistic: PlanDetail;
  goal: PlanDetail;
  plansDiffer: boolean;
  lowestSafeWeeks: number; // weeks to reach goal at the realistic plan's pace
  risks: string[];
  maintenanceOnly: boolean;
}

function detail(
  key: PlanChoice,
  title: string,
  p: Profile,
  intake: number,
  activity: Activity,
  floor: number,
): PlanDetail {
  const sim: SimInput = { sex: p.sex, age: p.age, heightCm: p.heightCm, activity, extra: p.exerciseKcalPerDay };
  const days = Math.round(p.goalWeeks * 7);
  const curve = projectWeights(sim, p.startWeightKg, intake, Math.max(days, 730));
  const projectedKg = curve[Math.min(days, curve.length - 1)];
  const lossKg = p.startWeightKg - projectedKg;
  const hit = curve.findIndex((w) => w <= p.goalWeightKg);
  const maint0 = tdee(p.sex, p.age, p.startWeightKg, p.heightCm, activity) + p.exerciseKcalPerDay;
  const kgPerWeek = days > 0 ? lossKg / (days / 7) : 0;
  return {
    key,
    title,
    intake: Math.round(intake),
    activity,
    deficit: Math.round(maint0 - intake),
    atFloor: intake <= floor + 1,
    kgPerWeek,
    pctPerWeek: (kgPerWeek / p.startWeightKg) * 100,
    projectedKg,
    projectedLossKg: lossKg,
    reachesGoal: hit >= 0 && hit <= days,
    daysToGoal: hit >= 0 ? hit : null,
    extraSteps: null,
  };
}

export function riskList(pctPerWeek: number, atFloor: boolean): string[] {
  const r: string[] = [];
  if (pctPerWeek > 1) {
    r.push('Faster than 1% a week costs muscle and makes regain easier.');
    r.push('Raises gallstone risk.');
  }
  if (atFloor) {
    r.push('Eating at the minimum is hard to sustain: hunger, low energy, poor sleep.');
    r.push('Very low intake makes it hard to get enough protein, iron and calcium.');
  }
  if (pctPerWeek > 1.5) {
    r.push('Beyond this pace you would need medical supervision.');
  }
  return r;
}

export function buildFeasibility(p: Profile): Feasibility {
  const floor = calorieFloor(p.sex);
  const maint = tdee(p.sex, p.age, p.startWeightKg, p.heightCm, p.activity) + p.exerciseKcalPerDay;
  const neededLoss = Math.max(0, p.startWeightKg - p.goalWeightKg);
  const days = Math.max(1, Math.round(p.goalWeeks * 7));
  const reqPerWeek = neededLoss / (days / 7);
  const reqDeficit = (neededLoss * KCAL_PER_KG) / days;

  // Realistic: deficit <= 0.75% body weight/week, <= 25% of maintenance and <= 750 kcal, never below the floor.
  // If the goal needs less than that, eat exactly what reaches it (solved against the dynamic model).
  const paceDeficit = ((p.startWeightKg * 0.0075) * KCAL_PER_KG) / 7;
  // Guidelines for adults with obesity use ~500-750 kcal/day deficits; for lower BMI we keep it to 25% of maintenance.
  const pctCap = bmi(p.startWeightKg, p.heightCm) >= 30 ? 0.3 : 0.25;
  const maxDeficit = Math.min(paceDeficit, pctCap * maint, 750);
  const simReal: SimInput = { sex: p.sex, age: p.age, heightCm: p.heightCm, activity: p.activity, extra: p.exerciseKcalPerDay };
  const needIntake = intakeToReach(simReal, p.startWeightKg, p.goalWeightKg, days, maint);
  const realIntake = neededLoss <= 0 ? maint : Math.max(floor, needIntake, maint - maxDeficit);
  // Under 18, pregnant or eating-disorder history: no calorie deficit is ever planned (maintenance only).
  const maintOnly = p.screening.under18 || p.screening.pregnant || p.screening.eatingDisorder;
  const realistic = detail('realistic', 'Realistic plan', p, maintOnly ? maint : realIntake, p.activity, floor);

  // Goal: the intake the goal asks for, but never below the floor, assuming one activity level up.
  const boosted = NEXT_ACTIVITY[p.activity];
  const maintBoost = tdee(p.sex, p.age, p.startWeightKg, p.heightCm, boosted) + p.exerciseKcalPerDay;
  const simBoost: SimInput = { ...simReal, activity: boosted };
  const goalIntake = neededLoss <= 0 ? maintBoost : Math.max(floor, intakeToReach(simBoost, p.startWeightKg, p.goalWeightKg, days, maintBoost));
  const goal = maintOnly
    ? { ...realistic, key: 'goal' as const, title: 'Your goal plan' }
    : detail('goal', 'Your goal plan', p, goalIntake, boosted, floor);
  goal.extraSteps = boosted === p.activity || maintOnly ? null : 9000;

  let verdict: Verdict = 'safe';
  const reqPct = (reqPerWeek / p.startWeightKg) * 100;
  if (maintOnly) verdict = 'safe';
  else if (reqPct > 1) verdict = goal.reachesGoal && reqPct <= 1.5 ? 'fast' : 'unsafe';

  // weeks to goal at the realistic pace
  const wk = realistic.daysToGoal !== null ? Math.ceil(realistic.daysToGoal / 7) : 104;

  const plansDiffer = Math.abs(goal.intake - realistic.intake) > 25 || goal.activity !== realistic.activity;

  return {
    bmi: bmi(p.startWeightKg, p.heightCm),
    tdee: Math.round(maint),
    floor,
    neededLossKg: neededLoss,
    requiredKgPerWeek: reqPerWeek,
    requiredPctPerWeek: reqPct,
    requiredDeficit: Math.round(reqDeficit),
    verdict,
    realistic,
    goal,
    plansDiffer,
    lowestSafeWeeks: wk,
    risks: maintOnly ? [] : riskList(Math.max(reqPct, goal.pctPerWeek), goal.atFloor),
    maintenanceOnly: maintOnly,
  };
}

export interface Targets {
  kcal: number;
  proteinG: number;
  proteinMinG: number;
  fatG: number;
  carbG: number;
  waterMl: number;
  floor: number;
}

export function waterTargetMl(weightKg: number, hot: boolean): number {
  return round(weightKg * 30 * (hot ? 1.15 : 1), 50);
}

/** Daily targets for a given calorie intake at a given current weight, shaped by the user's diets. */
export function targetsFor(p: Profile, kcal: number, weightKg: number): Targets {
  const rules = rulesFor(p);
  const adj = adjustedWeight(weightKg, p.heightCm);
  const proteinG = Math.round(adj * 1.6 * rules.proteinBoost);
  const proteinMinG = Math.round(adj * 1.2);
  let carbG: number;
  let fatG: number;
  if (rules.carbPct !== undefined) {
    carbG = Math.round((kcal * rules.carbPct) / 4);
    fatG = Math.max(0, Math.round((kcal - proteinG * 4 - carbG * 4) / 9));
  } else {
    fatG = Math.round((kcal * (rules.fatPct ?? 0.27)) / 9);
    carbG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));
  }
  return { kcal: Math.round(kcal), proteinG, proteinMinG, fatG, carbG, waterMl: waterTargetMl(weightKg, p.hotClimate), floor: calorieFloor(p.sex) };
}

/** The plan the user chose, as a daily calorie intake (before any adaptive re-estimation). */
export function chosenPlan(p: Profile): PlanDetail {
  const f = buildFeasibility(p);
  return p.choice === 'goal' ? f.goal : f.realistic;
}

export function weeksElapsed(startDate: string, todayStr: string, daysBetween: (a: string, b: string) => number): number {
  return Math.floor(daysBetween(startDate, todayStr) / 7) + 1;
}
