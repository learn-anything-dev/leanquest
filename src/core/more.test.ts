import { describe, expect, it } from 'vitest';
import { planDay, excluded } from './nutrition';
import { computeStreak, levelFor } from './gamify';
import { progress, startingStates, ladderFor, buildWorkout } from '../data/exercises';
import { ph } from '../data/regions/ph';

const diet = { halal: false, vegetarian: false, allergens: [] as string[] };

describe('nutrition planner', () => {
  it('hits calories and protein within a modest budget', () => {
    const p = planDay(ph.foods, 1300, 100, 200, (f) => f.price100, diet);
    expect(p.kcal).toBeGreaterThan(1150);
    expect(p.kcal).toBeLessThanOrEqual(1360);
    expect(p.protein).toBeGreaterThan(85);
    expect(p.withinBudget).toBe(true);
  });
  it('respects halal, vegetarian and allergens', () => {
    const halal = planDay(ph.foods, 1500, 90, 300, (f) => f.price100, { ...diet, halal: true });
    expect(halal.items.some((i) => (i.food.tags ?? []).includes('pork'))).toBe(false);
    const veg = planDay(ph.foods, 1500, 90, 300, (f) => f.price100, { ...diet, vegetarian: true });
    expect(veg.items.some((i) => excluded(i.food, { ...diet, vegetarian: true }))).toBe(false);
    const noEgg = planDay(ph.foods, 1500, 90, 300, (f) => f.price100, { ...diet, allergens: ['egg', 'fish'] });
    expect(noEgg.items.some((i) => (i.food.tags ?? []).some((t) => ['egg', 'fish'].includes(t)))).toBe(false);
  });
  it('flags when budget cannot be met', () => {
    const p = planDay(ph.foods, 1500, 110, 20, (f) => f.price100, diet);
    expect(p.withinBudget).toBe(false);
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
