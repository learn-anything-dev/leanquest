import { useEffect, useState } from 'preact/hooks';
import { today } from '../core/dates';
import type { DayLog, Food, PatternState, Profile, WorkoutLog } from '../core/types';

export interface AppState {
  v: 1;
  createdOn: string;
  profile: Profile | null;
  weights: Record<string, number>;
  waist: Record<string, number>; // cm
  days: Record<string, DayLog>;
  workouts: WorkoutLog[];
  progression: Record<string, PatternState>;
  customFoods: Food[];
  adaptive: boolean;
  recentFoodIds: string[];
  celebrated: string[]; // milestone ids already shown
  ackSafety: boolean;
}

const KEY = 'leanquest:v1';

export function emptyState(): AppState {
  return {
    v: 1,
    createdOn: today(),
    profile: null,
    weights: {},
    waist: {},
    days: {},
    workouts: [],
    progression: {},
    customFoods: [],
    adaptive: true,
    recentFoodIds: [],
    celebrated: [],
    ackSafety: false,
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return migrate(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

/** Fills in any fields added in later versions so old saves and imports keep working. */
export function migrate(o: Partial<AppState>): AppState {
  const base = emptyState();
  const merged = { ...base, ...o, v: 1 as const };
  delete (merged as Record<string, unknown>).priceOverrides;
  if (merged.profile) {
    const old = merged.profile as Partial<Profile> & { halal?: boolean; vegetarian?: boolean; region?: string; currentActivities?: unknown };
    const diets = old.diets ?? [old.halal ? 'halal' : '', old.vegetarian ? 'vegetarian' : ''].filter(Boolean);
    const country = old.country ?? (old.region === 'ph' ? 'PH' : '');
    const allergens = old.allergens ?? [];
    const comfortable = (old.comfortable ?? ['walk-brisk']).map((id) => ({ walking: 'walk-brisk', dance: 'dance-social', strength: 'bodyweight-light', stretch: 'stretching', intervals: 'circuit', sports: 'badminton', swim: 'swim-leisure' } as Record<string, string>)[id] ?? id);
    merged.profile = {
      currentExercise: [], currentMinutesPerWeek: 0, exerciseKcalPerDay: 0, abilities: [], baselineSteps: 3000, limitations: [], hotClimate: true,
      hasAllergies: allergens.length > 0, avoidFoods: [], ...old, diets: diets.length ? diets : ['none'], country, region: country === 'PH' ? 'ph' : 'global', allergens, comfortable,
      screening: { under18: false, pregnant: false, eatingDisorder: false, medical: false, other: [], ...(old.screening ?? {}) },
    } as Profile;
  }
  return merged;
}

let state: AppState = load();
const subs = new Set<() => void>();

export function getState(): AppState {
  return state;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

export function update(fn: (s: AppState) => AppState | void) {
  const draft: AppState = structuredClone(state);
  const out = fn(draft);
  state = out ?? draft;
  persist();
  subs.forEach((f) => f());
}

export function replaceState(s: AppState) {
  state = migrate(s);
  persist();
  subs.forEach((f) => f());
}

export function resetAll() {
  replaceState(emptyState());
}

export function useAppState(): AppState {
  const [, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((n) => n + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  return state;
}

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

export function dayOf(s: AppState, date: string): DayLog {
  return s.days[date] ?? { food: [], waterMl: 0 };
}
