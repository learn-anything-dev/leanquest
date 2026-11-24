import { bmi, tdee } from '../core/calc';
import { daysBetween, addDays } from '../core/dates';
import {
  computeBadges, computeStreak, computeXp, weeklyQuests,
  type GameInput,
} from '../core/gamify';
import { buildFeasibility, chosenPlan, targetsFor, type Feasibility, type PlanDetail, type Targets } from '../core/plan';
import { adaptiveTdee, evaluateOnTrack, projectedFinish, trendSeries, type OnTrack, type WeightPoint, type IntakeDay } from '../core/progress';
import type { Food, Profile, Region } from '../core/types';
import { levelFromStates, stepGoal } from '../data/exercises';
import { getRegion } from '../data/regions';
import type { AppState } from './store';

export interface Derived {
  profile: Profile;
  region: Region;
  foods: Food[];
  priceOf: (f: Food) => number;
  feas: Feasibility;
  plan: PlanDetail;
  targets: Targets;
  currentKg: number;
  trendKg: number | null;
  weightPoints: WeightPoint[];
  week: number;
  today: string;
  onTrack: OnTrack;
  adaptive: { tdee: number; days: number; formula: number; applied: boolean } | null;
  finish: string | null;
  game: GameInput;
  streak: ReturnType<typeof computeStreak>;
  xp: ReturnType<typeof computeXp>;
  badges: ReturnType<typeof computeBadges>;
  quests: ReturnType<typeof weeklyQuests>;
  level: ReturnType<typeof levelFromStates>;
  stepTarget: number;
}

export function derive(s: AppState, todayStr: string): Derived | null {
  const profile = s.profile;
  if (!profile) return null;
  const region = getRegion(profile.region);
  const foods = [...s.customFoods, ...region.foods];
  const priceOf = (f: Food) => s.priceOverrides[f.id] ?? f.price100;

  const feas = buildFeasibility(profile);
  const plan = chosenPlan(profile);
  const weightPoints: WeightPoint[] = Object.entries(s.weights).map(([date, kg]) => ({ date, kg })).sort((a, b) => a.date.localeCompare(b.date));
  const trend = trendSeries(weightPoints);
  const trendKg = trend.length ? trend[trend.length - 1].kg : null;
  const currentKg = trendKg ?? profile.startWeightKg;

  // adaptive maintenance estimate from logged intake + weight trend
  const intakeDays: IntakeDay[] = Object.entries(s.days).map(([date, d]) => ({
    date, kcal: d.food.reduce((a, e) => a + e.kcal, 0), complete: !!d.foodDone || d.food.reduce((a, e) => a + e.kcal, 0) >= 900,
  }));
  const est = s.adaptive ? adaptiveTdee(weightPoints.filter((w) => w.date >= profile.startDate), intakeDays) : null;
  const formulaNow = tdee(profile.sex, profile.age, currentKg, profile.heightCm, plan.activity);
  let kcalTarget = plan.intake;
  let adaptive: Derived['adaptive'] = null;
  if (est) {
    const clamped = Math.min(formulaNow * 1.25, Math.max(formulaNow * 0.75, est.tdee));
    const applied = Math.abs(clamped - formulaNow) >= 100;
    adaptive = { tdee: Math.round(clamped), days: est.days, formula: Math.round(formulaNow), applied };
    if (applied) {
      const planDeficit = Math.max(0, plan.deficit);
      kcalTarget = Math.max(feas.floor, Math.round(clamped - planDeficit));
    }
  }
  const targets = targetsFor(profile, kcalTarget, currentKg);

  const week = Math.max(1, Math.floor(daysBetween(profile.startDate, todayStr) / 7) + 1);
  const foodDaysLast7 = [...Array(7)].filter((_, i) => (s.days[addDays(todayStr, -i)]?.food.length ?? 0) > 0).length;
  const sim = { sex: profile.sex, age: profile.age, heightCm: profile.heightCm, activity: plan.activity };
  const onTrack = evaluateOnTrack({
    start: { date: profile.startDate, kg: profile.startWeightKg },
    weights: weightPoints.filter((w) => w.date >= profile.startDate),
    today: todayStr, sim, intake: plan.intake, foodDaysLast7,
  });
  const finish = projectedFinish(sim, currentKg, profile.goalWeightKg, kcalTarget, todayStr);

  const level = levelFromStates(s.progression);
  const stepTarget = stepGoal(profile.baselineSteps, week);
  const game: GameInput = {
    days: s.days, weights: s.weights, workouts: s.workouts,
    waterTarget: targets.waterMl, kcalTarget: targets.kcal, stepTarget, budgetPerDay: profile.budgetPerDay,
    startDate: s.createdOn, today: todayStr, startWeight: profile.startWeightKg, trendKg,
    pushStep: s.progression.push?.step ?? 0,
  };
  const streak = computeStreak(game);
  const xp = computeXp(game);
  const badges = computeBadges(game, streak, xp.level);
  const quests = weeklyQuests(game);

  return { profile, region, foods, priceOf, feas, plan, targets, currentKg, trendKg, weightPoints, week, today: todayStr, onTrack, adaptive, finish, game, streak, xp, badges, quests, level, stepTarget };
}

export { bmi };
