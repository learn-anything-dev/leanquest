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
  priceOverrides: Record<string, number>; // foodId -> price per 100 g
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
    priceOverrides: {},
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
  if (merged.profile) {
    merged.profile = {
      currentActivities: [], currentMinutesPerWeek: 0, comfortable: ['walking'], abilities: [], baselineSteps: 3000,
      limitations: [], allergens: [], hotClimate: true, ...(merged.profile as Partial<Profile>),
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
