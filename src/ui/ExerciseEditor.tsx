import { useState } from 'preact/hooks';
import type { Profile } from '../core/types';
import { activityName, weeklyExerciseKcal } from '../data/activities';
import { updateProfile } from '../store/actions';
import { CurrentExercise, DAY_LABELS, toggle } from './pickers';

const ALL = [0, 1, 2, 3, 4, 5, 6];

/**
 * A row of weekday chips. With emptyMeans "all" an empty list means every day (and the last day cannot be removed);
 * with "none" an empty list means no days.
 */
export function DaysPicker({ value, onChange, label, emptyMeans }: {
  value: number[];
  onChange: (v: number[]) => void;
  label: string;
  emptyMeans: 'all' | 'none';
}) {
  const selected = emptyMeans === 'all' && !value.length ? ALL : value;
  const commit = (next: number[]) => {
    const sorted = [...new Set(next)].sort((a, b) => a - b);
    if (emptyMeans === 'all') {
      if (!sorted.length) return;
      onChange(sorted.length === 7 ? [] : sorted);
    } else {
      onChange(sorted);
    }
  };
  return (
    <div class="picker">
      <div class="day-chips" role="group" aria-label={label}>
        {DAY_LABELS.map((lab, i) => (
          <button type="button" key={lab} class={selected.includes(i) ? 'day-chip on' : 'day-chip'} aria-pressed={selected.includes(i)} onClick={() => commit(toggle(selected, i))}>{lab}</button>
        ))}
      </div>
      <div class="day-shortcuts">
        <button type="button" class="ghost small" onClick={() => commit(ALL)}>Every day</button>
        <button type="button" class="ghost small" onClick={() => commit([0, 1, 2, 3, 4])}>Weekdays</button>
        <button type="button" class="ghost small" onClick={() => commit([5, 6])}>Weekends</button>
        {emptyMeans === 'none' && selected.length > 0 && <button type="button" class="ghost small" onClick={() => commit([])}>None</button>}
      </div>
    </div>
  );
}

/** Days you can train, and days you can go outside. Without outdoor days the plan is a home-only plan. */
export function ScheduleSettings({ trainDays, outdoorDays, onChange }: {
  trainDays: number[];
  outdoorDays: number[];
  onChange: (patch: { trainDays?: number[]; outdoorDays?: number[] }) => void;
}) {
  return (
    <div class="stack-sm">
      <div>
        <label class="f">Days I can train at home</label>
        <DaysPicker value={trainDays} emptyMeans="all" label="Days I can train" onChange={(v) => onChange({ trainDays: v })} />
      </div>
      <div>
        <label class="f">Days I can go outside <small>(optional)</small></label>
        <p class="muted small">Walks and outdoor cardio only appear on these days. Leave it empty for a home-only plan.</p>
        <DaysPicker value={outdoorDays} emptyMeans="none" label="Days I can go outside" onChange={(v) => onChange({ outdoorDays: v })} />
      </div>
    </div>
  );
}

/** Sports you already play, with days and minutes. Saves straight to your profile and refreshes the plan. */
export function ExerciseEditor({ profile, weightKg }: { profile: Profile; weightKg: number }) {
  const [active, setActive] = useState(profile.currentExercise.length > 0);
  return (
    <CurrentExercise
      entries={profile.currentExercise}
      active={active}
      onActive={setActive}
      weightKg={weightKg}
      onChange={(entries) => updateProfile({
        currentExercise: entries,
        currentMinutesPerWeek: entries.reduce((a, e) => a + e.minutes, 0),
        exerciseKcalPerDay: weeklyExerciseKcal(entries, profile.startWeightKg) / 7,
      })}
    />
  );
}

/** Read-only summary of sports, training days and outdoor days, shown when the editor is closed. */
export function scheduleSummary(profile: Profile): { sports: string[]; days: string; outdoor: string } {
  const sports = profile.currentExercise.map((e) => {
    const d = e.days ?? [];
    return d.length ? `${activityName(e.id)} on ${d.map((i) => DAY_LABELS[i]).join(', ')}` : `${activityName(e.id)} (no fixed days)`;
  });
  const td = profile.trainDays ?? [];
  const days = !td.length || td.length === 7 ? 'every day' : td.map((i) => DAY_LABELS[i]).join(', ');
  const od = profile.outdoorDays ?? [];
  const outdoor = od.length ? od.map((i) => DAY_LABELS[i]).join(', ') : 'none (home plan)';
  return { sports, days, outdoor };
}
