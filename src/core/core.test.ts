import { describe, expect, it } from 'vitest';
import { bmi, bmr, tdee, adjustedWeight } from './calc';
import { buildFeasibility, calorieFloor, projectWeights, targetsFor } from './plan';
import { adaptiveTdee, evaluateOnTrack, trendSeries, weeklyRate } from './progress';
import { addDays } from './dates';
import type { Profile } from './types';

const base: Profile = {
  name: 'Test', units: 'metric', sex: 'female', age: 28, heightCm: 154.94, startWeightKg: 80, goalWeightKg: 65, goalWeeks: 8,
  activity: 'sedentary', baselineSteps: 3000, currentExercise: [], currentMinutesPerWeek: 0, exerciseKcalPerDay: 0, comfortable: ['walk-brisk'], abilities: [],
  equipment: 'none', limitations: [], country: 'PH', region: 'ph', diets: ['none'], hasAllergies: false, allergens: [], avoidFoods: [], hotClimate: true,
  startDate: '2026-01-01', choice: 'realistic', screening: { under18: false, pregnant: false, eatingDisorder: false, medical: false, other: [] },
};

describe('calc', () => {
  it('computes BMI', () => expect(bmi(80, 154.94)).toBeCloseTo(33.3, 1));
  it('Mifflin-St Jeor female/male', () => {
    expect(bmr('female', 28, 80, 154.94)).toBeCloseTo(10 * 80 + 6.25 * 154.94 - 140 - 161, 5);
    expect(bmr('male', 28, 80, 154.94)).toBeGreaterThan(bmr('female', 28, 80, 154.94));
    expect(tdee('female', 28, 80, 154.94, 'sedentary')).toBeGreaterThan(1500);
  });
  it('adjusted weight sits between ideal and actual', () => {
    const a = adjustedWeight(80, 154.94);
    expect(a).toBeGreaterThan(60);
    expect(a).toBeLessThan(80);
  });
});

describe('feasibility', () => {
  it('flags 15 kg in 8 weeks as unsafe and needing ~2,000 kcal/day deficit', () => {
    const f = buildFeasibility(base);
    expect(f.requiredDeficit).toBeGreaterThan(1900);
    expect(f.requiredDeficit).toBeLessThan(2200);
    expect(f.requiredPctPerWeek).toBeGreaterThan(2);
    expect(f.verdict).toBe('unsafe');
    expect(f.goal.reachesGoal).toBe(false);
    expect(f.risks.length).toBeGreaterThan(0);
  });
  it('never schedules below the calorie floor, for either plan', () => {
    for (const sex of ['female', 'male', 'unspecified'] as const) {
      const f = buildFeasibility({ ...base, sex });
      expect(f.realistic.intake).toBeGreaterThanOrEqual(calorieFloor(sex));
      expect(f.goal.intake).toBeGreaterThanOrEqual(calorieFloor(sex));
    }
  });
  it('a modest goal is safe and reached', () => {
    const f = buildFeasibility({ ...base, goalWeightKg: 76, goalWeeks: 12 });
    expect(f.verdict).toBe('safe');
    expect(f.realistic.reachesGoal).toBe(true);
  });
  it('projection slows as weight falls', () => {
    const w = projectWeights({ sex: 'female', age: 28, heightCm: 154.94, activity: 'light' }, 80, 1400, 120);
    const firstMonth = w[0] - w[30];
    const lastMonth = w[90] - w[120];
    expect(firstMonth).toBeGreaterThan(lastMonth);
  });
  it('protein target is above minimum and macros add up', () => {
    const t = targetsFor(base, 1400, 80);
    expect(t.proteinG).toBeGreaterThan(t.proteinMinG);
    expect(t.carbG).toBeGreaterThan(0);
    expect(t.waterMl).toBeGreaterThan(2000);
  });
});

describe('progress', () => {
  const sim = { sex: 'female' as const, age: 28, heightCm: 154.94, activity: 'sedentary' as const };
  const mk = (kgs: number[]) => kgs.map((kg, i) => ({ date: addDays('2026-01-01', i), kg }));
  it('trend smooths noise', () => {
    const t = trendSeries(mk([80, 81, 79.5, 80.5, 80]));
    expect(Math.abs(t[4].kg - 80)).toBeLessThan(0.6);
  });
  it('weekly rate detects loss', () => {
    const r = weeklyRate(mk([80, 79.9, 79.8, 79.7, 79.6, 79.5, 79.4, 79.3, 79.2, 79.1]));
    expect(r).not.toBeNull();
    expect(r!).toBeLessThan(-0.5);
  });
  it('says collecting with too little data', () => {
    const o = evaluateOnTrack({ start: { date: '2026-01-01', kg: 80 }, weights: mk([80, 80]), today: '2026-01-02', sim, intake: 1300, foodDaysLast7: 2 });
    expect(o.status).toBe('collecting');
  });
  it('red when weight does not move', () => {
    const w = mk(Array(29).fill(80));
    const o = evaluateOnTrack({ start: { date: '2026-01-01', kg: 80 }, weights: w, today: '2026-01-29', sim, intake: 1300, foodDaysLast7: 3 });
    expect(['yellow', 'red']).toContain(o.status);
  });
  it('green/ahead when weight tracks the plan', () => {
    const curve = projectWeights(sim, 80, 1300, 28);
    const w = curve.map((kg, i) => ({ date: addDays('2026-01-01', i), kg }));
    const o = evaluateOnTrack({ start: { date: '2026-01-01', kg: 80 }, weights: w, today: '2026-01-29', sim, intake: 1300, foodDaysLast7: 7 });
    expect(['green', 'ahead']).toContain(o.status);
  });
  it('adaptive TDEE recovers the true maintenance', () => {
    // person eats 1500, loses 0.4kg/week => maintenance ~ 1500 + 0.4*7700/7 = 1940
    const days = 21;
    const w = Array.from({ length: days }, (_, i) => ({ date: addDays('2026-01-01', i), kg: 80 - (0.4 / 7) * i }));
    const intake = Array.from({ length: days }, (_, i) => ({ date: addDays('2026-01-01', i), kcal: 1500, complete: true }));
    const est = adaptiveTdee(w, intake);
    expect(est).not.toBeNull();
    expect(est!.tdee).toBeGreaterThan(1850);
    expect(est!.tdee).toBeLessThan(2050);
  });
});
