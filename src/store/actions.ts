import { daysBetween, today } from '../core/dates';
import type { DayLog, Food, Meal, PlanChoice, Profile, WorkoutItem } from '../core/types';
import { entryFor } from '../core/nutrition';
import { ladderFor, progress, type Pattern } from '../data/exercises';
import { getState, uid, update } from './store';

function day(s: { days: Record<string, DayLog> }, date: string): DayLog {
  return (s.days[date] ??= { food: [], waterMl: 0 });
}

export function addFood(date: string, food: Food, grams: number, meal: Meal) {
  update((s) => {
    day(s, date).food.push({ id: uid(), ...entryFor(food, grams, meal) });
    s.recentFoodIds = [food.id, ...s.recentFoodIds.filter((x) => x !== food.id)].slice(0, 12);
  });
}

export function addQuickKcal(date: string, name: string, kcal: number, meal: Meal) {
  update((s) => {
    day(s, date).food.push({ id: uid(), foodId: 'quick', name, grams: 0, kcal: Math.round(kcal), p: 0, c: 0, f: 0, meal });
  });
}

export function removeFood(date: string, id: string) {
  update((s) => {
    const d = day(s, date);
    d.food = d.food.filter((e) => e.id !== id);
  });
}

export function addWater(date: string, ml: number) {
  update((s) => {
    const d = day(s, date);
    d.waterMl = Math.max(0, d.waterMl + ml);
  });
}

export function setWeight(date: string, kg: number | null) {
  update((s) => {
    if (kg === null) delete s.weights[date];
    else s.weights[date] = Math.round(kg * 10) / 10;
  });
}

export function setWaist(date: string, cm: number | null) {
  update((s) => {
    if (cm === null) delete s.waist[date];
    else s.waist[date] = cm;
  });
}

export function setSteps(date: string, steps: number) {
  update((s) => {
    day(s, date).steps = Math.max(0, Math.round(steps));
  });
}

export function toggleChallenge(date: string) {
  update((s) => {
    const d = day(s, date);
    d.challengeDone = !d.challengeDone;
  });
}

export function toggleMoveDone(date: string) {
  update((s) => {
    const d = day(s, date);
    d.moveDone = !d.moveDone;
  });
}

export function setFoodDone(date: string, v: boolean) {
  update((s) => {
    day(s, date).foodDone = v;
  });
}

/** Saves a food the user created so it shows up in search next time. Same name (any case) updates the saved one. */
export function saveCustomFood(f: Food): Food {
  const name = f.name.trim().toLowerCase();
  const existing = getState().customFoods.find((x) => x.name.trim().toLowerCase() === name);
  const saved: Food = existing ? { ...f, id: existing.id } : f;
  update((s) => {
    const i = s.customFoods.findIndex((x) => x.id === saved.id);
    if (i >= 0) s.customFoods[i] = saved;
    else s.customFoods.unshift(saved);
  });
  return saved;
}

export function deleteCustomFood(id: string) {
  update((s) => {
    s.customFoods = s.customFoods.filter((x) => x.id !== id);
    s.recentFoodIds = s.recentFoodIds.filter((x) => x !== id);
  });
}

export function addCustomFood(f: Food) {
  update((s) => {
    s.customFoods.unshift(f);
  });
}

/** Saves a finished workout and applies progression from each exercise's feedback. */
export function completeWorkout(items: WorkoutItem[]) {
  update((s) => {
    if (!s.profile) return;
    s.workouts.push({ id: uid(), date: today(), items });
    for (const it of items) {
      if (!it.feedback) continue;
      const ladder = ladderFor(it.pattern as Pattern, s.profile.equipment, s.profile.limitations);
      const cur = s.progression[it.pattern] ?? { step: 0, target: it.target };
      s.progression[it.pattern] = progress({ step: cur.step, target: it.target }, it.feedback, ladder);
    }
  });
}

export function setChoice(choice: PlanChoice) {
  update((s) => {
    if (s.profile) s.profile.choice = choice;
  });
}

/**
 * Re-time: re-anchors the plan at today's trend weight so the chosen plan's deadline matches reality.
 * History (weights, logs, XP, streak) is kept.
 */
export function retime(trendKg: number, newGoalWeeks: number) {
  update((s) => {
    if (!s.profile) return;
    s.profile.startDate = today();
    s.profile.startWeightKg = Math.round(trendKg * 10) / 10;
    s.profile.goalWeeks = Math.max(2, Math.round(newGoalWeeks));
  });
}

export function updateProfile(patch: Partial<Profile>) {
  update((s) => {
    if (s.profile) Object.assign(s.profile, patch);
  });
}

export function celebrate(id: string) {
  update((s) => {
    if (!s.celebrated.includes(id)) s.celebrated.push(id);
  });
}

export function daysSince(date: string) {
  return daysBetween(date, today());
}
