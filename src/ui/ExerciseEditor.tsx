import { useState } from 'preact/hooks';
import type { Profile } from '../core/types';
import { activityName, weeklyExerciseKcal } from '../data/activities';
import { updateProfile } from '../store/actions';
import { CurrentExercise, DAY_LABELS, toggle } from './pickers';

const ALL = [0, 1, 2, 3, 4, 5, 6];

/** "Which days can you train?" Empty or all seven means every day. Never lets the last day be removed. */
export function TrainDaysPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const selected = value.length ? value : ALL;
  const commit = (next: number[]) => {
    if (!next.length) return;
    onChange(next.length === 7 ? [] : [...next].sort((a, b) => a - b));
  };
  return (
    <div class="picker">
      <div class="day-chips" role="group" aria-label="Days I can train">
        {DAY_LABELS.map((lab, i) => (
          <button type="button" key={lab} class={selected.includes(i) ? 'day-chip on' : 'day-chip'} aria-pressed={selected.includes(i)} onClick={() => commit(toggle(selected, i))}>{lab}</button>
        ))}
      </div>
      <div class="day-shortcuts">
        <button type="button" class="ghost small" onClick={() => commit(ALL)}>Every day</button>
        <button type="button" class="ghost small" onClick={() => commit([0, 1, 2, 3, 4])}>Weekdays</button>
        <button type="button" class="ghost small" onClick={() => commit([5, 6])}>Weekends</button>
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

/** Read-only summary of sports and training days, shown when the editor is closed. */
export function scheduleSummary(profile: Profile): { sports: string[]; days: string } {
  const sports = profile.currentExercise.map((e) => {
    const d = e.days ?? [];
    return d.length ? `${activityName(e.id)} on ${d.map((i) => DAY_LABELS[i]).join(', ')}` : `${activityName(e.id)} (no fixed days)`;
  });
  const td = profile.trainDays ?? [];
  const days = !td.length || td.length === 7 ? 'every day' : td.map((i) => DAY_LABELS[i]).join(', ');
  return { sports, days };
}
