import { describe, expect, it } from 'vitest';
import { planDay, excluded } from './nutrition';
import { buildFeasibility } from './plan';
import { computeStreak, levelFor } from './gamify';
import { progress, startingStates, ladderFor, buildWorkout } from '../data/exercises';
import { ph } from '../data/regions/ph';
import { global } from '../data/regions/global';

const diet = { halal: false, vegetarian: false, allergens: [] as string[] };

describe('nutrition planner', () => {
  const dietOf = (diets: string[], extra: Partial<{ hasAllergies: boolean; allergens: string[]; avoidFoods: string[] }> = {}) => ({ diets, hasAllergies: false, allergens: [] as string[], avoidFoods: [] as string[], ...extra });
  const targets = { kcal: 1300, proteinG: 100, carbG: 130, fatG: 45 };
  it('hits calories and protein with no restrictions', () => {
    const p = planDay(ph.foods, targets, dietOf(['none']));
    expect(p.kcal).toBeGreaterThan(1100);
    expect(p.kcal).toBeLessThanOrEqual(1360);
    expect(p.protein).toBeGreaterThan(85);
  });
  it('halal, vegetarian and vegan plans contain no forbidden foods', () => {
    const check = (diets: string[], bad: string[]) => {
      const plan = planDay(ph.foods, targets, dietOf(diets));
      expect(plan.items.length).toBeGreaterThan(3);
      expect(plan.items.some((i) => (i.food.tags ?? []).some((t) => bad.includes(t)))).toBe(false);
    };
    check(['halal'], ['pork', 'alcohol']);
    check(['vegetarian'], ['meat', 'fish', 'shellfish']);
    check(['vegan'], ['meat', 'fish', 'shellfish', 'egg', 'dairy', 'honey']);
    check(['pescatarian'], ['meat']);
    check(['gluten-free'], ['gluten']);
  });
  it('respects allergies and typed foods to avoid', () => {
    const plan = planDay(ph.foods, targets, dietOf(['none'], { hasAllergies: true, allergens: ['egg', 'fish', 'peanut'], avoidFoods: ['tofu', 'mung'] }));
    for (const i of plan.items) {
      expect((i.food.tags ?? []).some((t) => ['egg', 'fish', 'peanut'].includes(t))).toBe(false);
      expect(/tofu|mung/i.test(i.food.name)).toBe(false);
    }
  });
  it('ignores allergy selections when the user said no allergies', () => {
    const f = ph.foods.find((x) => x.id === 'egg')!;
    expect(excluded(f, dietOf(['none'], { hasAllergies: false, allergens: ['egg'] }))).toBe(false);
    expect(excluded(f, dietOf(['none'], { hasAllergies: true, allergens: ['egg'] }))).toBe(true);
  });
  it('keto keeps carbs low', () => {
    const keto = planDay(global.foods, { kcal: 1500, proteinG: 110, carbG: 25, fatG: 100 }, dietOf(['keto']));
    expect(keto.carbs).toBeLessThan(60);
    expect(keto.kcal).toBeGreaterThan(1100);
  });
});

describe('exercise progression', () => {
  const ladder = ladderFor('push', 'none', []);
  it('easy adds reps then moves up a step', () => {
    let s = { step: 0, target: 6 };
    s = progress(s, 'easy', ladder);
    expect(s).toEqual({ step: 0, target: 8 });
    s = { step: 0, target: 14 };
    s = progress(s, 'easy', ladder);
    expect(s.step).toBe(1);
    expect(s.target).toBe(6);
  });
  it('hard eases off and never goes below the first step', () => {
    expect(progress({ step: 0, target: 6 }, 'hard', ladder)).toEqual({ step: 0, target: 6 });
    expect(progress({ step: 2, target: 6 }, 'hard', ladder).step).toBe(1);
  });
  it('gym users get extra harder steps; limitations are respected', () => {
    expect(ladderFor('squat', 'gym', []).length).toBeGreaterThan(ladderFor('squat', 'none', []).length);
    expect(ladderFor('squat', 'none', ['knees']).length).toBe(0);
    expect(ladderFor('push', 'none', ['wrists']).some((e) => e.id === 'pushup')).toBe(false);
  });
  it('starting step follows stated abilities', () => {
    expect(startingStates([], 'none', []).push.step).toBe(0);
    const strong = startingStates(['wallPushup', 'kneePushup', 'sitStand', 'plank'], 'none', []);
    expect(strong.push.step).toBeGreaterThan(0);
    expect(strong.squat.step).toBeGreaterThan(0);
  });
  it('builds a workout for every day', () => {
    const st = startingStates([], 'none', []);
    for (let d = 0; d < 3; d++) expect(buildWorkout(d, { equipment: 'none', limitations: [] }, st, 1).length).toBeGreaterThanOrEqual(4);
  });
});

describe('gamify', () => {
  it('levels increase with xp', () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(1000).level).toBeGreaterThan(levelFor(200).level);
  });
  it('a freeze covers a missed day', () => {
    const days: Record<string, { food: any[]; waterMl: number }> = {};
    for (let i = 1; i <= 8; i++) days[`2026-01-0${i}`] = { food: [{ kcal: 1, cost: 0 }], waterMl: 0 };
    // miss Jan 9, active Jan 10, today Jan 10
    days['2026-01-10'] = { food: [{ kcal: 1, cost: 0 }], waterMl: 0 };
    const st = computeStreak({ days, weights: {}, workouts: [], waterTarget: 1, kcalTarget: 1, stepTarget: 1, budgetPerDay: 1, startDate: '2026-01-01', today: '2026-01-10', startWeight: 80, trendKg: 80, pushStep: 0 } as any);
    expect(st.current).toBe(9);
    expect(st.freezeUsedOn).toEqual(['2026-01-09']);
  });
});

import { recommend, todaysSession, weekdayIndex } from './training';
import type { Profile } from './types';

const prof: Profile = {
  name: 'T', units: 'metric', sex: 'female', age: 28, heightCm: 154.94, startWeightKg: 80, goalWeightKg: 65, goalWeeks: 8,
  activity: 'sedentary', baselineSteps: 3000, currentExercise: [], currentMinutesPerWeek: 0, exerciseKcalPerDay: 0, comfortable: ['dance-social', 'walk-brisk'], abilities: [],
  equipment: 'none', limitations: [], country: 'PH', region: 'ph', diets: ['none'], hasAllergies: false, allergens: [], avoidFoods: [], hotClimate: true,
  startDate: '2026-01-01', choice: 'realistic', screening: { under18: false, pregnant: false, eatingDisorder: false, medical: false, other: [] },
};

describe('training recommendation', () => {
  it('gives a 7-day schedule with the right number of sessions', () => {
    const r = recommend(prof, 3, 'Beginner');
    expect(r.schedule).toHaveLength(7);
    expect(r.schedule.filter((d) => d.kind === 'strength')).toHaveLength(r.strengthDays);
    expect(r.schedule.filter((d) => d.kind === 'cardio')).toHaveLength(r.cardioSessions);
    expect(r.schedule.some((d) => d.kind === 'rest')).toBe(true);
  });
  it('goal plan asks for more activity than the realistic plan', () => {
    const real = recommend(prof, 5, 'Beginner');
    const goal = recommend({ ...prof, choice: 'goal' }, 5, 'Beginner');
    expect(goal.cardioSessions).toBeGreaterThan(real.cardioSessions);
    expect(goal.steps).toBeGreaterThanOrEqual(real.steps);
    expect(goal.cautions.length).toBeGreaterThan(0);
  });
  it('eases in during the first two weeks', () => {
    expect(recommend(prof, 1, 'Beginner').strengthDays).toBe(2);
    expect(recommend(prof, 3, 'Beginner').strengthDays).toBe(3);
  });
  it('is low impact for high BMI or sore knees, and uses the cardio the user likes', () => {
    expect(recommend(prof, 3, 'Beginner').lowImpact).toBe(true);
    expect(recommend({ ...prof, startWeightKg: 55, limitations: ['knees'] }, 3, 'Beginner').lowImpact).toBe(true);
    expect(recommend(prof, 3, 'Beginner').schedule.filter((d) => d.kind === 'cardio').map((d) => d.title)).toEqual(['Social / freestyle dancing', 'Brisk walking']);
  });
  it('is gentle for eating-disorder history and never frames it as calorie burning', () => {
    const r = recommend({ ...prof, screening: { ...prof.screening, eatingDisorder: true } }, 3, 'Beginner');
    expect(r.mode).toBe('gentle');
    expect(r.strengthDays).toBe(2);
    expect(r.why.join(' ')).toMatch(/not for burning calories/);
  });
  it('maps dates to weekdays and returns today\'s session', () => {
    expect(weekdayIndex('2026-11-23')).toBe(0); // Monday
    expect(weekdayIndex('2026-11-29')).toBe(6); // Sunday
    expect(todaysSession(recommend(prof, 3, 'Beginner'), '2026-11-23').kind).toBe('strength');
  });
});

import { estimateFood, suggestDishes } from './foodEstimator';
import { activityKcal, weeklyExerciseKcal, ACTIVITIES, CATEGORIES } from '../data/activities';
import { COUNTRIES, packFor } from '../data/countries';
import { DIETS, rulesFor } from '../data/diets';
import { targetsFor } from './plan';

describe('food estimator', () => {
  it('recognises a named dish and scales by portion size', () => {
    const m = estimateFood('chicken adobo', { size: 'medium' })!;
    const l = estimateFood('chicken adobo', { size: 'large' })!;
    expect(m.matched[0]).toMatch(/adobo/i);
    expect(m.kcal).toBeGreaterThan(200);
    expect(m.kcal).toBeLessThan(400);
    expect(l.kcal).toBeGreaterThan(m.kcal);
  });
  it('splits composite meals and multiplies quantities', () => {
    const e = estimateFood('2 eggs and 1 cup of rice')!;
    expect(e.matched.length).toBe(2);
    expect(e.kcal).toBeGreaterThan(350);
    expect(e.kcal).toBeLessThan(480);
  });
  it('adds calories for frying', () => {
    const plain = estimateFood('fish', { size: 'medium' })!;
    const fried = estimateFood('fried fish', { size: 'medium' })!;
    expect(fried.kcal).toBeGreaterThan(plain.kcal);
  });
  it('falls back to a category when nothing matches, and returns null without one', () => {
    expect(estimateFood('zzxq blorp')).toBeNull();
    const e = estimateFood('zzxq blorp', { category: 'fried' })!;
    expect(e.confidence).toBe('low');
    expect(e.kcal).toBeGreaterThan(200);
  });
  it('suggests close dishes for a partial name', () => {
    expect(suggestDishes('pizza')[0].name).toMatch(/pizza/i);
  });
});

describe('activities, countries and diets', () => {
  it('calories scale with MET, weight and time', () => {
    expect(activityKcal('run', 80, 60)).toBeGreaterThan(activityKcal('walk-easy', 80, 60));
    expect(activityKcal('badminton', 80, 60)).toBeCloseTo((5.5 - 1) * 80, 5);
    expect(activityKcal('custom:Pole fitness', 80, 30)).toBeGreaterThan(0);
    expect(weeklyExerciseKcal([{ id: 'badminton', minutes: 120 }, { id: 'swim-leisure', minutes: 60 }], 80)).toBeGreaterThan(900);
  });
  it('every category has activities and ids are unique', () => {
    for (const c of CATEGORIES) expect(ACTIVITIES.some((a) => a.category === c)).toBe(true);
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length);
  });
  it('lists all countries, with a local food pack only for the Philippines', () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(195);
    expect(COUNTRIES.some((c) => c.name === 'Philippines')).toBe(true);
    expect(packFor('PH')).toBe('ph');
    expect(packFor('JP')).toBe('global');
  });
  it('existing exercise raises maintenance and diets reshape macros', () => {
    const base = buildFeasibility(prof);
    const active = buildFeasibility({ ...prof, exerciseKcalPerDay: 250 });
    expect(active.tdee).toBeGreaterThan(base.tdee);
    const keto = targetsFor({ ...prof, diets: ['keto'] }, 1500, 80);
    const normal = targetsFor(prof, 1500, 80);
    expect(keto.carbG).toBeLessThan(normal.carbG / 2);
    expect(targetsFor({ ...prof, diets: ['high-protein'] }, 1500, 80).proteinG).toBeGreaterThan(normal.proteinG);
    expect(DIETS.length).toBeGreaterThanOrEqual(20);
    expect(rulesFor({ diets: ['vegan'], hasAllergies: false, allergens: [], avoidFoods: [] }).excludeTags.has('dairy')).toBe(true);
  });
});

describe('food estimator: ingredients and sauces', () => {
  it('recognises every part of "Cucumber Salad with Tuna and Japanese Mayo"', () => {
    const e = estimateFood('Cucumber Salad with Tuna and Japanese Mayo')!;
    expect(e.unmatched).toHaveLength(0);
    expect(e.matched.length).toBe(3);
    expect(e.matched.join(' ')).toMatch(/tuna/i);
    expect(e.matched.join(' ')).toMatch(/japanese mayo/i);
    expect(e.kcal).toBeGreaterThan(180);
    expect(e.kcal).toBeLessThan(330);
  });
  it('reads units: 2 tbsp mayo is 30 g, 100g chicken is 100 g', () => {
    expect(estimateFood('2 tbsp mayo')!.grams).toBe(30);
    expect(estimateFood('100g chicken')!.grams).toBe(100);
    expect(estimateFood('1 tsp olive oil')!.kcal).toBeGreaterThan(35);
  });
  it('never drops an unknown ingredient: it is estimated from a guessed category the user can change', () => {
    const e = estimateFood('rice with xyzzy dipping sauce')!;
    expect(e.unmatched).toHaveLength(1);
    expect(e.unmatched[0].category).toBe('sauce');
    const withFat = estimateFood('rice with xyzzy dipping sauce', { partCategories: { 'xyzzy dipping sauce': 'fat' } })!;
    expect(withFat.unmatched[0].category).toBe('fat');
    expect(withFat.kcal).toBeGreaterThan(e.kcal);
  });
  it('knows common condiments and seafood', () => {
    for (const name of ['kewpie', 'ketchup', 'soy sauce', 'sriracha', 'salmon', 'shrimp', 'kimchi', 'cream cheese']) {
      const e = estimateFood(name)!;
      expect(e && e.unmatched.length === 0).toBe(true);
    }
  });
});
