import { describe, expect, it } from 'vitest';
import { activityName } from '../data/activities';
import { cardioPool, recommend, spreadDays } from './training';
import type { ExerciseEntry, PlanChoice, Profile } from './types';

const base: Profile = {
  name: 'T', units: 'metric', sex: 'female', age: 28, heightCm: 154.94, startWeightKg: 80, goalWeightKg: 65, goalWeeks: 24,
  activity: 'sedentary', baselineSteps: 3000, currentExercise: [], currentMinutesPerWeek: 0, exerciseKcalPerDay: 0,
  comfortable: ['walk-brisk'], abilities: [], equipment: 'none', limitations: [], country: 'PH', region: 'ph', diets: ['none'],
  hasAllergies: false, allergens: [], avoidFoods: [], hotClimate: true, startDate: '2026-01-01', choice: 'realistic',
  screening: { under18: false, pregnant: false, eatingDisorder: false, medical: false, other: [] },
};

const sportsVariants: ExerciseEntry[][] = [
  [],
  [{ id: 'pickleball', minutes: 60, days: [5] }],
  [{ id: 'badminton', minutes: 180, days: [5, 6] }, { id: 'swim-leisure', minutes: 60, days: [2] }],
  [{ id: 'run', minutes: 300, days: [0, 1, 2, 3, 4] }],
  [{ id: 'pickleball', minutes: 60 }],
  [{ id: 'tennis', minutes: 90, days: [6] }, { id: 'basketball', minutes: 60, days: [6] }],
  [{ id: 'custom:Pole fitness', minutes: 120, days: [1, 3] }],
];
const comfortVariants = [['pickleball', 'walk-brisk'], ['pickleball'], ['dance-social'], [], ['badminton', 'tennis', 'jump-rope'], ['custom:Pole fitness', 'zumba']];
const trainDayVariants: (number[] | undefined)[] = [undefined, [], [5, 6], [0, 2, 4], [1, 3, 5, 6], [3], [0, 1, 2, 3, 4]];
const choices: PlanChoice[] = ['realistic', 'goal'];
const weeks = [1, 2, 3, 8, 20];
const levels = ['Beginner', 'Intermediate', 'Expert'] as const;

describe('weekly schedule invariants (every combination)', () => {
  it('always follows the rules', { timeout: 120000 }, () => {
    let checked = 0;
    for (const sports of sportsVariants) for (const comfortable of comfortVariants) for (const trainDays of trainDayVariants)
      for (const choice of choices) for (const week of weeks) for (const level of levels) for (const weight of [55, 80]) {
        const p: Profile = { ...base, currentExercise: sports, comfortable, trainDays, choice, startWeightKg: weight, limitations: weight === 55 ? [] : ['knees'] };
        const r = recommend(p, week, level);
        const ctx = JSON.stringify({ sports: sports.map((s) => s.id + ':' + (s.days ?? []).join('')), comfortable, trainDays, choice, week, level, weight });

        // 7 well-formed days, in order
        expect(r.schedule, ctx).toHaveLength(7);
        expect(r.schedule.map((d) => d.day), ctx).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
        r.schedule.forEach((d) => { expect(d.title, ctx).toBeTruthy(); expect(d.detail, ctx).toBeTruthy(); });

        // the user's sports appear on exactly their days, as theirs, and nowhere else
        const expectedSportDays = new Set(sports.flatMap((s) => s.days ?? []));
        r.schedule.forEach((d, i) => {
          if (expectedSportDays.has(i)) { expect(d.kind, ctx).toBe('sport'); expect(d.source, ctx).toBe('yours'); }
          else { expect(d.kind, ctx).not.toBe('sport'); expect(d.source, ctx).toBe('plan'); }
        });
        expect([...r.sportDays], ctx).toEqual([...expectedSportDays].sort((a, b) => a - b));

        // suggested sessions only on training days, never on a sport day
        const allowed = trainDays && trainDays.length ? new Set(trainDays) : new Set([0, 1, 2, 3, 4, 5, 6]);
        r.schedule.forEach((d, i) => {
          if (d.kind === 'strength' || d.kind === 'cardio') { expect(allowed.has(i), ctx).toBe(true); expect(expectedSportDays.has(i), ctx).toBe(false); }
        });

        // a scheduled sport is never also suggested as extra cardio
        const scheduledNames = new Set(sports.filter((s) => (s.days ?? []).length).map((s) => activityName(s.id).toLowerCase()));
        r.schedule.filter((d) => d.kind === 'cardio').forEach((d) => expect(scheduledNames.has(d.title.toLowerCase()), ctx).toBe(false));

        // venue/partner sports are never suggested unless scheduled
        r.schedule.filter((d) => d.kind === 'cardio').forEach((d) => expect(/pickleball|badminton|tennis|basketball/i.test(d.title), ctx).toBe(false));

        // counts agree with the schedule, and cardio is not one activity repeated
        expect(r.schedule.filter((d) => d.kind === 'strength').length, ctx).toBe(r.strengthDays);
        const cardio = r.schedule.filter((d) => d.kind === 'cardio');
        expect(cardio.length, ctx).toBe(r.cardioSessions);
        if (cardio.length >= 2) expect(new Set(cardio.map((d) => d.title)).size, ctx).toBeGreaterThan(1);

        // at most one "easy stretch" rest day, and numbers are sane
        expect(r.schedule.filter((d) => d.kind === 'rest' && d.detail.startsWith('Easy')).length, ctx).toBeLessThanOrEqual(1);
        expect(Number.isFinite(r.weeklyMinutes) && r.weeklyMinutes > 0, ctx).toBe(true);
        checked++;
      }
    expect(checked).toBeGreaterThan(5000);
  });
});

describe('the reported case: Pickleball only on Saturday', () => {
  const p: Profile = { ...base, choice: 'goal', comfortable: ['pickleball', 'walk-brisk'], currentExercise: [{ id: 'pickleball', minutes: 60, days: [5] }] };
  it('shows Pickleball once, on Saturday, as the user\'s sport', () => {
    const r = recommend(p, 3, 'Beginner');
    const rows = r.schedule.filter((d) => /pickleball/i.test(d.title));
    expect(rows).toHaveLength(1);
    expect(rows[0].day).toBe('Sat');
    expect(rows[0].source).toBe('yours');
  });
  it('changing the day moves it and nothing else changes name', () => {
    const r = recommend({ ...p, currentExercise: [{ id: 'pickleball', minutes: 60, days: [6] }] }, 3, 'Beginner');
    expect(r.schedule[6].title).toBe('Pickleball');
    expect(r.schedule[5].kind).not.toBe('sport');
    expect(r.schedule.filter((d) => /pickleball/i.test(d.title))).toHaveLength(1);
  });
});

describe('training days', () => {
  it('only uses the days the user can train', () => {
    const r = recommend({ ...base, trainDays: [1, 3, 5] }, 3, 'Beginner');
    r.schedule.forEach((d, i) => { if (d.kind === 'strength' || d.kind === 'cardio') expect([1, 3, 5]).toContain(i); });
    expect(r.schedule.filter((d) => d.kind === 'rest').length).toBeGreaterThanOrEqual(4);
  });
  it('reduces sessions instead of breaking when few days are available', () => {
    const r = recommend({ ...base, trainDays: [3] }, 3, 'Beginner');
    expect(r.strengthDays + r.cardioSessions).toBe(1);
  });
  it('spreadDays spreads evenly and never returns duplicates', () => {
    expect(spreadDays([0, 1, 2, 3, 4], 3)).toEqual([0, 2, 4]);
    expect(spreadDays([0, 1, 2], 5)).toEqual([0, 1, 2]);
    expect(spreadDays([], 2)).toEqual([]);
    for (let n = 1; n <= 7; n++) for (let k = 0; k <= 7; k++) {
      const days = [0, 1, 2, 3, 4, 5, 6].slice(0, n);
      const out = spreadDays(days, k);
      expect(new Set(out).size).toBe(out.length);
      expect(out.length).toBe(Math.min(k, n));
    }
  });
});

describe('cardio suggestions', () => {
  it('skips scheduled sports and venue sports, and always offers two choices', () => {
    const pool = cardioPool(['pickleball', 'badminton', 'zumba'], false, new Set(['zumba']));
    const ids = pool.map((x) => x.id);
    expect(ids).not.toContain('pickleball');
    expect(ids).not.toContain('badminton');
    expect(ids).not.toContain('zumba');
    expect(pool.length).toBeGreaterThanOrEqual(2);
  });
  it('swaps high-impact activities when joints need care', () => {
    expect(cardioPool(['jump-rope', 'run'], true).map((x) => x.id)).not.toContain('run');
    expect(cardioPool(['jump-rope', 'run'], false).map((x) => x.id)).toContain('run');
  });
});
