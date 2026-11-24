import { useState } from 'preact/hooks';
import { addDays, daysBetween, formatShort, today } from '../../core/dates';
import { projectWeights } from '../../core/plan';
import { trendSeries } from '../../core/progress';
import type { Derived } from '../../store/derive';
import { retime, setWaist, setWeight } from '../../store/actions';
import type { AppState } from '../../store/store';
import { Card, WeightChart, kgFmt } from '../common';

const LB = 2.20462;

export function ProgressScreen({ s, d }: { s: AppState; d: Derived }) {
  const p = d.profile;
  const imp = p.units === 'imperial';
  const [date, setDate] = useState(today());
  const [w, setW] = useState('');
  const [waist, setWaistV] = useState('');
  const raw = d.weightPoints;
  const trend = trendSeries(raw);
  const sim = { sex: p.sex, age: p.age, heightCm: p.heightCm, activity: d.plan.activity };
  const horizon = Math.max(30, Math.min(daysBetween(p.startDate, today()) + 28, p.goalWeeks * 7));
  const curve = projectWeights(sim, p.startWeightKg, d.plan.intake, horizon).map((kg, i) => ({ date: addDays(p.startDate, i), kg }));
  const lost = d.trendKg !== null ? p.startWeightKg - d.trendKg : 0;
  const toGo = d.currentKg - p.goalWeightKg;
  const pct = (lost / p.startWeightKg) * 100;
  const rate = d.onTrack.rateKgPerWeek;
  const waistPoints = Object.entries(s.waist).sort(([a], [b]) => a.localeCompare(b));
  const waistLost = waistPoints.length > 1 ? waistPoints[0][1] - waistPoints[waistPoints.length - 1][1] : 0;
  const retimeWeeks = d.finish ? Math.max(2, Math.ceil(daysBetween(today(), d.finish) / 7)) : null;
  const unit = imp ? 'lb' : 'kg';
  const conv = (kg: number) => (imp ? kg * LB : kg);

  return (
    <div class="stack">
      <h1>Progress</h1>
      <Card cls="span-all">
        <div class="grid3">
          <div class="kpi"><b>{conv(Math.abs(lost)).toFixed(1)} {unit}</b><span>{lost >= 0 ? 'lost' : 'gained'} ({pct.toFixed(1)}%)</span></div>
          <div class="kpi"><b>{toGo > 0 ? conv(toGo).toFixed(1) : '0'} {unit}</b><span>to goal</span></div>
          <div class="kpi"><b>{rate === null ? '–' : conv(-rate).toFixed(2)}</b><span>{unit}/wk lately</span></div>
        </div>
        <div><WeightChart raw={raw} trend={trend} plan={curve} goalKg={p.goalWeightKg} /></div>
      </Card>

      <Card title="Am I on track?">
        <div class={`banner ${d.onTrack.status === 'red' ? 'bad' : d.onTrack.status === 'yellow' ? 'warn' : d.onTrack.status === 'collecting' ? 'info' : 'ok'}`}>{d.onTrack.message}</div>
        {d.onTrack.diffKg !== null && <p class="small">Trend {kgFmt(d.onTrack.trendKg!, p.units)} vs plan {kgFmt(d.onTrack.expectedKg!, p.units)} ({d.onTrack.diffKg > 0 ? '+' : ''}{conv(d.onTrack.diffKg).toFixed(1)} {unit}).</p>}
        {d.onTrack.tips.map((t) => <p class="small" key={t}>{t}</p>)}
        {d.finish && d.trendKg !== null && <p class="small">Goal weight around <b>{formatShort(d.finish)}</b> at this pace.</p>}
        {(d.onTrack.status === 'red' || d.onTrack.status === 'yellow') && retimeWeeks && d.trendKg !== null && (
          <button class="soft" onClick={() => { if (confirm(`Re-time your plan to start from today's trend weight, with about ${retimeWeeks} weeks to your goal? Your history is kept.`)) retime(d.trendKg!, retimeWeeks); }}>Re-time my plan ({retimeWeeks} weeks)</button>
        )}
        {rate !== null && rate < -(0.01 * d.currentKg) && <div class="banner warn small">You're losing faster than 1% of body weight per week. Make sure you're eating your target and enough protein.</div>}
        <details><summary class="small">Why does the scale jump around?</summary>
          <p class="small muted">Day-to-day swings of 1–2 kg are normal (water, salt, hormones). Trust the trend over 2+ weeks.</p></details>
      </Card>

      {d.adaptive && (
        <Card title="Your real maintenance">
          <p class="small">About <b>{d.adaptive.tdee} kcal/day</b> from {d.adaptive.days} logged days (formula: {d.adaptive.formula}). {d.adaptive.applied ? 'Your target was adjusted.' : 'No change needed.'}</p>
        </Card>
      )}

      <Card title="Add a measurement">
        <div class="grid2">
          <div><label class="f" for="md">Date</label><input id="md" type="date" max={today()} value={date} onInput={(e) => setDate((e.target as HTMLInputElement).value)} /></div>
          <div><label class="f" for="mw">Weight ({unit})</label><input id="mw" type="number" inputMode="decimal" step="0.1" value={w} onInput={(e) => setW((e.target as HTMLInputElement).value)} /></div>
        </div>
        <div class="row"><button disabled={!w || +w <= 0 || !date} onClick={() => { setWeight(date, imp ? +w / LB : +w); setW(''); }}>Save weight</button></div>
        <div class="row"><input type="number" inputMode="decimal" step="0.1" placeholder="Waist (cm), at navel" value={waist} onInput={(e) => setWaistV((e.target as HTMLInputElement).value)} aria-label="Waist in centimetres" />
          <button class="soft" disabled={!waist || +waist <= 0} onClick={() => { setWaist(date, +waist); setWaistV(''); }}>Save</button></div>
      </Card>

      <Card title="Beyond the scale">
        <ul class="bullets small">
          <li>Workouts done: <b>{s.workouts.length}</b></li>
          <li>Push-up level: <b>{s.progression.push?.step ?? 0}</b> · Squat level: <b>{s.progression.squat?.step ?? 0}</b></li>
          <li>Days food logged: <b>{Object.values(s.days).filter((x) => x.food.length).length}</b></li>
          {waistPoints.length > 1 && <li>Waist: <b>{waistLost >= 0 ? '−' : '+'}{Math.abs(waistLost).toFixed(1)} cm</b></li>}
        </ul>
      </Card>

      <Card title="Weigh-in history">
        <div class="list">
          {[...raw].reverse().slice(0, 14).map((x) => (
            <div class="item" key={x.date}><span>{formatShort(x.date)}</span><span><b>{kgFmt(x.kg, p.units)}</b> <button class="ghost small" aria-label={`Delete weigh-in ${x.date}`} onClick={() => setWeight(x.date, null)}>Remove</button></span></div>
          ))}
        </div>
      </Card>
    </div>
  );
}
