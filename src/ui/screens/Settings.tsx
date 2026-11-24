import { useRef } from 'preact/hooks';
import { today } from '../../core/dates';
import { activityName } from '../../data/activities';
import { COUNTRIES, packFor } from '../../data/countries';
import type { Derived } from '../../store/derive';
import { getState, replaceState, resetAll, update, type AppState } from '../../store/store';
import { updateProfile } from '../../store/actions';
import { Card } from '../common';
import { ActivityPicker, AllergyPicker, DietPicker, toggle } from '../pickers';
import { ExerciseEditor, ScheduleSettings } from '../ExerciseEditor';

export function Settings({ s, d }: { s: AppState; d: Derived }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const p = d.profile;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leanquest-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = async (f: File) => {
    try {
      const o = JSON.parse(await f.text());
      if (!o || typeof o !== 'object' || o.v !== 1) throw new Error('bad file');
      if (confirm('Replace everything on this device with this backup?')) replaceState(o);
    } catch {
      alert('That file is not a LeanQuest backup.');
    }
  };

  return (
    <div class="stack">
      <h1>Settings</h1>
      <Card title="Profile">
        <label class="f" for="sn">Name</label>
        <input id="sn" value={p.name} onChange={(e) => updateProfile({ name: (e.target as HTMLInputElement).value })} />
        <label class="f" for="sc">Country</label>
        <select id="sc" value={p.country} onChange={(e) => { const code = (e.target as HTMLSelectElement).value; updateProfile({ country: code, region: packFor(code) }); }}>
          <option value="">Select your country</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <label class="f" for="se">Equipment</label>
        <select id="se" value={p.equipment} onChange={(e) => updateProfile({ equipment: (e.target as HTMLSelectElement).value as 'none' | 'home' | 'gym' })}>
          <option value="none">None (bodyweight only)</option><option value="home">Home: dumbbells/bands</option><option value="gym">Gym access</option>
        </select>
        <label class="row"><input type="checkbox" checked={s.adaptive} onChange={(e) => update((x) => { x.adaptive = (e.target as HTMLInputElement).checked; })} /> <span>Adapt my calories to my measured burn</span></label>
      </Card>

      <Card title="Diet">
        <DietPicker value={p.diets} onChange={(v) => updateProfile({ diets: v })} />
      </Card>

      <Card title="Allergies and foods to avoid">
        <AllergyPicker hasAllergies={p.hasAllergies} allergens={p.allergens} avoidFoods={p.avoidFoods} onChange={(v) => updateProfile(v)} />
      </Card>

      <Card title="Your week">
        <ScheduleSettings trainDays={p.trainDays ?? []} outdoorDays={p.outdoorDays ?? []} onChange={(patch) => updateProfile(patch)} />
      </Card>

      <Card title="Sports you play">
        <ExerciseEditor profile={p} weightKg={d.currentKg} />
      </Card>

      <Card title="Exercise you enjoy">
        <ActivityPicker
          selected={p.comfortable}
          onToggle={(id) => updateProfile({ comfortable: toggle(p.comfortable, id) })}
          onAddCustom={(name) => { const id = `custom:${name}`; if (!p.comfortable.includes(id)) updateProfile({ comfortable: [...p.comfortable, id] }); }}
        />
        {p.comfortable.length > 0 && <p class="small muted">Selected: {p.comfortable.map(activityName).join(', ')}</p>}
      </Card>

      <Card title="Your data">
        <p class="small muted">Stored only on this device. Export a backup now and then.</p>
        <div class="row wrap">
          <button class="soft" onClick={exportData}>Export backup</button>
          <button class="soft" onClick={() => fileRef.current?.click()}>Import backup</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) void importData(f); }} />
        </div>
      </Card>

      <Card title="Start over">
        <button class="danger" onClick={() => { if (confirm('Delete everything and start over? This cannot be undone.')) resetAll(); }}>Reset everything</button>
      </Card>
      <p class="disclaimer">LeanQuest v1 · Not medical advice. Food data is estimated.</p>
    </div>
  );
}
