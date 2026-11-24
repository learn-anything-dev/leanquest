import { useRef } from 'preact/hooks';
import { today } from '../../core/dates';
import type { Derived } from '../../store/derive';
import { getState, replaceState, resetAll, update, type AppState } from '../../store/store';
import { updateProfile } from '../../store/actions';
import { REGIONS } from '../../data/regions';
import { Card } from '../common';

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
        <label class="f" for="sr">Region (food & prices)</label>
        <select id="sr" value={p.region} onChange={(e) => { const r = REGIONS.find((x) => x.id === (e.target as HTMLSelectElement).value)!; updateProfile({ region: r.id, budgetPerDay: r.budgetDefault }); }}>
          {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <label class="f" for="sb">Daily food budget ({d.region.currency})</label>
        <input id="sb" type="number" inputMode="decimal" value={p.budgetPerDay} onChange={(e) => updateProfile({ budgetPerDay: Math.max(0, +(e.target as HTMLInputElement).value) })} />
        <label class="f">Equipment</label>
        <select value={p.equipment} onChange={(e) => updateProfile({ equipment: (e.target as HTMLSelectElement).value as 'none' | 'home' | 'gym' })}>
          <option value="none">None (bodyweight only)</option><option value="home">Home: dumbbells/bands</option><option value="gym">Gym access</option>
        </select>
        <p class="small muted">Switching equipment adds harder, weighted moves at the top of each progression ladder.</p>
        <label class="row" style="margin-top:8px"><input type="checkbox" style="width:24px;min-height:24px" checked={s.adaptive} onChange={(e) => update((x) => { x.adaptive = (e.target as HTMLInputElement).checked; })} /> <span>Adapt my calories to my measured burn <span class="small muted">(after ~2 weeks of logging)</span></span></label>
      </Card>

      <Card title="Your data">
        <p class="small muted" style="margin:0 0 8px">Everything is stored only on this device (in your browser). Export a backup now and then, especially before clearing browser data or changing phones.</p>
        <div class="row wrap">
          <button class="soft" onClick={exportData}>⬇ Export backup</button>
          <button class="soft" onClick={() => fileRef.current?.click()}>⬆ Import backup</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) void importData(f); }} />
        </div>
      </Card>

      <Card title="Start over">
        <p class="small muted" style="margin:0 0 8px">Deletes all data on this device and restarts the setup.</p>
        <button class="danger" onClick={() => { if (confirm('Delete everything and start over? This cannot be undone.')) resetAll(); }}>Reset everything</button>
      </Card>
      <p class="disclaimer">LeanQuest v1 · educational tool, not medical advice. Nutrient and price data are estimates.</p>
    </div>
  );
}
