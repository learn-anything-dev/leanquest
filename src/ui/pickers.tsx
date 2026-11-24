import { useState } from 'preact/hooks';
import type { ExerciseEntry, Screening } from '../core/types';
import { ACTIVITIES, CATEGORIES, activityKcal, activityName, isCustom, searchActivities } from '../data/activities';
import { ALLERGENS, DIETS, getDiet } from '../data/diets';

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/* ---------- Activities ---------- */

/** Every activity in the catalog grouped by category, with search and "add your own". Selection is by id. */
export function ActivityPicker({ selected, onToggle, onAddCustom }: {
  selected: string[];
  onToggle: (id: string) => void;
  onAddCustom: (name: string) => void;
}) {
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState('');
  const list = searchActivities(q);
  const cats = CATEGORIES.filter((c) => list.some((a) => a.category === c));
  const customSelected = selected.filter(isCustom);
  const add = () => {
    const name = custom.trim();
    if (!name) return;
    onAddCustom(name);
    setCustom('');
  };
  return (
    <div class="picker">
      <input type="search" value={q} placeholder="Search activities" aria-label="Search activities" onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
      <div class="pick-cats">
        {cats.map((cat) => {
          const items = list.filter((a) => a.category === cat);
          const n = items.filter((a) => selected.includes(a.id)).length;
          return (
            <details class="pick-cat" key={cat} open={!!q || n > 0}>
              <summary><span>{cat}</span>{n > 0 && <span class="pick-count">{n}</span>}</summary>
              <div class="chips">
                {items.map((a) => (
                  <button type="button" key={a.id} class={selected.includes(a.id) ? 'chip on' : 'chip'} aria-pressed={selected.includes(a.id)} onClick={() => onToggle(a.id)}>{a.name}</button>
                ))}
              </div>
            </details>
          );
        })}
        {!cats.length && <p class="small muted">No match. Add it below.</p>}
      </div>
      <div class="pick-custom">
        <label class="f" for="own-activity">Not listed? Add your own</label>
        <div class="row">
          <input id="own-activity" value={custom} placeholder="e.g. Pole fitness" onInput={(e) => setCustom((e.target as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
          <button type="button" class="soft" disabled={!custom.trim()} onClick={add}>Add</button>
        </div>
        {customSelected.length > 0 && (
          <div class="chips">
            {customSelected.map((id) => <button type="button" key={id} class="chip on" aria-label={`Remove ${activityName(id)}`} onClick={() => onToggle(id)}>{activityName(id)} ×</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

/** What the user already does: yes/no, pick activities, then minutes per week for each with estimated calories. */
export function CurrentExercise({ entries, onChange, weightKg, active, onActive }: {
  entries: ExerciseEntry[];
  onChange: (e: ExerciseEntry[]) => void;
  weightKg: number;
  active: boolean;
  onActive: (v: boolean) => void;
}) {
  const ids = entries.map((e) => e.id);
  const total = entries.reduce((a, e) => a + e.minutes, 0);
  const kcal = entries.reduce((a, e) => a + activityKcal(e.id, weightKg, e.minutes), 0);
  const clampMin = (n: number) => Math.max(0, Math.min(2000, n));
  const nDays = (e: ExerciseEntry) => e.days?.length ?? 0;
  const perSession = (e: ExerciseEntry) => (nDays(e) ? Math.round(e.minutes / nDays(e)) : e.minutes);
  /** With days chosen the number is minutes per session; without days it is minutes per week. */
  const setMinutes = (id: string, v: number) => onChange(entries.map((e) => (e.id === id ? { ...e, minutes: clampMin(nDays(e) ? v * nDays(e) : v) } : e)));
  const setDays = (id: string, days: number[]) => onChange(entries.map((e) => {
    if (e.id !== id) return e;
    const per = nDays(e) ? e.minutes / nDays(e) : e.minutes;
    return { ...e, days, minutes: clampMin(Math.round(days.length ? per * days.length : per)) };
  }));
  return (
    <div class="stack-sm">
      <div class="options" role="radiogroup" aria-label="Do you already exercise">
        {[{ v: false, t: 'Not at the moment', h: 'I do not exercise regularly yet' }, { v: true, t: 'Yes, I do some', h: 'Pick what you do and how long' }].map((o) => (
          <button type="button" role="radio" key={String(o.v)} class={active === o.v ? 'option on' : 'option'} aria-checked={active === o.v} onClick={() => { onActive(o.v); if (!o.v) onChange([]); }}>
            <span class="option-text"><b>{o.t}</b><span>{o.h}</span></span><i class="option-check" aria-hidden="true" />
          </button>
        ))}
      </div>
      {active && (
        <>
          <ActivityPicker
            selected={ids}
            onToggle={(id) => onChange(ids.includes(id) ? entries.filter((e) => e.id !== id) : [...entries, { id, minutes: 60 }])}
            onAddCustom={(name) => { const id = `custom:${name}`; if (!ids.includes(id)) onChange([...entries, { id, minutes: 60 }]); }}
          />
          {entries.length > 0 && (
            <div class="ex-rows">
              <div class="ex-head">When and how long?</div>
              {entries.map((e) => (
                <div class="ex-row" key={e.id}>
                  <div class="ex-top">
                    <div class="ex-name"><b>{activityName(e.id)}</b><span>{nDays(e) ? `${nDays(e)}× a week · ` : ''}about {Math.round(activityKcal(e.id, weightKg, e.minutes))} kcal a week</span></div>
                    <div class="ex-min">
                      <input type="number" inputMode="numeric" min="0" value={perSession(e)} aria-label={nDays(e) ? `Minutes each time: ${activityName(e.id)}` : `Minutes per week: ${activityName(e.id)}`} onInput={(ev) => setMinutes(e.id, +(ev.target as HTMLInputElement).value)} />
                      <span>{nDays(e) ? 'min each day' : 'min / week'}</span>
                    </div>
                  </div>
                  <div class="ex-days">
                    <div class="ex-days-label">Which days? <small>Leave empty if it varies.</small></div>
                    <div class="day-chips" role="group" aria-label={`Days for ${activityName(e.id)}`}>
                      {DAY_LABELS.map((lab, i) => (
                        <button type="button" key={lab} class={e.days?.includes(i) ? 'day-chip on' : 'day-chip'} aria-pressed={!!e.days?.includes(i)} onClick={() => setDays(e.id, toggle(e.days ?? [], i).sort((a, b) => a - b))}>{lab}</button>
                      ))}
                    </div>
                    <div class="day-shortcuts">
                      <button type="button" class="ghost small" onClick={() => setDays(e.id, [5, 6])}>Weekends</button>
                      <button type="button" class="ghost small" onClick={() => setDays(e.id, [0, 1, 2, 3, 4])}>Weekdays</button>
                      {nDays(e) > 0 && <button type="button" class="ghost small" onClick={() => setDays(e.id, [])}>Clear</button>}
                    </div>
                  </div>
                </div>
              ))}
              <div class="banner info small">Total {total} min a week, roughly {Math.round(kcal)} kcal burned. I add this to your daily calorie burn.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Diets and allergies ---------- */

export function DietPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const groups = ['Restrictions', 'Eating styles', 'Health focus'] as const;
  const pick = (id: string) => {
    if (id === 'none') return onChange(['none']);
    const next = toggle(value.filter((x) => x !== 'none'), id);
    onChange(next.length ? next : ['none']);
  };
  const chosen = value.map((id) => getDiet(id)).filter((d) => d && d.id !== 'none');
  return (
    <div class="picker">
      {groups.map((g) => (
        <div key={g}>
          <div class="pick-group">{g}</div>
          <div class="chips">
            {DIETS.filter((d) => d.group === g).map((d) => (
              <button type="button" key={d.id} class={value.includes(d.id) ? 'chip on' : 'chip'} aria-pressed={value.includes(d.id)} onClick={() => pick(d.id)}>{d.name}</button>
            ))}
          </div>
        </div>
      ))}
      {chosen.length > 0 && (
        <ul class="bullets small">
          {chosen.map((d) => <li key={d!.id}><b>{d!.name}:</b> {d!.desc}{d!.approximate ? ' (applied approximately)' : ''}</li>)}
        </ul>
      )}
    </div>
  );
}

export function AllergyPicker({ hasAllergies, allergens, avoidFoods, onChange }: {
  hasAllergies: boolean;
  allergens: string[];
  avoidFoods: string[];
  onChange: (v: { hasAllergies: boolean; allergens: string[]; avoidFoods: string[] }) => void;
}) {
  const [custom, setCustom] = useState('');
  const add = () => {
    const w = custom.trim();
    if (!w || avoidFoods.some((x) => x.toLowerCase() === w.toLowerCase())) return setCustom('');
    onChange({ hasAllergies, allergens, avoidFoods: [...avoidFoods, w] });
    setCustom('');
  };
  return (
    <div class="stack-sm">
      <div class="options" role="radiogroup" aria-label="Allergies">
        {[{ v: false, t: 'No allergies', h: 'No foods to avoid' }, { v: true, t: 'I have allergies or foods to avoid', h: 'Choose them below' }].map((o) => (
          <button type="button" role="radio" key={String(o.v)} class={hasAllergies === o.v ? 'option on' : 'option'} aria-checked={hasAllergies === o.v} onClick={() => onChange(o.v ? { hasAllergies: true, allergens, avoidFoods } : { hasAllergies: false, allergens: [], avoidFoods: [] })}>
            <span class="option-text"><b>{o.t}</b><span>{o.h}</span></span><i class="option-check" aria-hidden="true" />
          </button>
        ))}
      </div>
      {hasAllergies && (
        <div class="picker">
          <div class="pick-group">Select all that apply</div>
          <div class="chips">
            {ALLERGENS.map((a) => (
              <button type="button" key={a.id} class={allergens.includes(a.id) ? 'chip on' : 'chip'} aria-pressed={allergens.includes(a.id)} onClick={() => onChange({ hasAllergies, allergens: toggle(allergens, a.id), avoidFoods })}>{a.name}</button>
            ))}
          </div>
          <div class="pick-custom">
            <label class="f" for="avoid-food">Something else? Type it</label>
            <div class="row">
              <input id="avoid-food" value={custom} placeholder="e.g. mango, kiwi, mushrooms" onInput={(e) => setCustom((e.target as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
              <button type="button" class="soft" disabled={!custom.trim()} onClick={add}>Add</button>
            </div>
            {avoidFoods.length > 0 && (
              <div class="chips">
                {avoidFoods.map((w) => <button type="button" key={w} class="chip on" aria-label={`Remove ${w}`} onClick={() => onChange({ hasAllergies, allergens, avoidFoods: avoidFoods.filter((x) => x !== w) })}>{w} ×</button>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Safety check ---------- */

const SAFETY_ITEMS = [
  { k: 'under18', label: 'I am under 18' },
  { k: 'pregnant', label: 'I am pregnant or breastfeeding' },
  { k: 'eatingDisorder', label: 'I have a history of an eating disorder' },
  { k: 'medical', label: 'I have diabetes, heart or kidney disease, high blood pressure, or take medicine that affects weight or diet' },
] as const;

export function SafetyList({ value, onChange }: { value: Screening; onChange: (s: Screening) => void }) {
  const [other, setOther] = useState('');
  const add = () => {
    const t = other.trim();
    if (!t) return;
    onChange({ ...value, other: [...value.other, t] });
    setOther('');
  };
  return (
    <>
      {SAFETY_ITEMS.map((it) => (
        <label key={it.k} class="row">
          <input type="checkbox" checked={value[it.k]} onChange={(e) => onChange({ ...value, [it.k]: (e.target as HTMLInputElement).checked })} />
          <span>{it.label}</span>
        </label>
      ))}
      <div class="pick-custom">
        <label class="f" for="safety-other">Anything else we should know?</label>
        <div class="row">
          <input id="safety-other" value={other} placeholder="e.g. recent surgery, thyroid condition, joint injury" onInput={(e) => setOther((e.target as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
          <button type="button" class="soft" disabled={!other.trim()} onClick={add}>Add</button>
        </div>
        {value.other.length > 0 && (
          <div class="chips">
            {value.other.map((t) => <button type="button" key={t} class="chip on" aria-label={`Remove ${t}`} onClick={() => onChange({ ...value, other: value.other.filter((x) => x !== t) })}>{t} ×</button>)}
          </div>
        )}
      </div>
      {value.under18 && <div class="banner warn">Calorie deficits are not appropriate while you are still growing. I'll plan maintenance-level eating and focus on movement and healthy habits. Please talk to a doctor if you are worried about your weight.</div>}
      {value.pregnant && <div class="banner warn">Dieting is not recommended in pregnancy or while breastfeeding. I'll set maintenance-level targets. Follow your doctor's or midwife's advice.</div>}
      {value.eatingDisorder && <div class="banner bad">Counting calories and chasing a goal weight can be harmful with an eating-disorder history. I'll plan maintenance only and keep the tone gentle. Please work with a professional (doctor, dietitian or therapist) on any weight changes.</div>}
      {(value.medical || value.other.length > 0) && <div class="banner warn">Please check this plan with your doctor before starting, especially the calorie level and exercise.</div>}
    </>
  );
}

export { ACTIVITIES };
