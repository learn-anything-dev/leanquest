import { useState } from 'preact/hooks';
import { formatShort } from '../../core/dates';
import { COACH_LINES, challengeFor } from '../../core/gamify';
import { sumEntries } from '../../core/nutrition';
import { DAY_PLANS } from '../../data/exercises';
import type { Derived } from '../../store/derive';
import { addWater, setSteps, setWeight, toggleChallenge } from '../../store/actions';
import { dayOf, type AppState } from '../../store/store';
import { Bar, Card, Ring, kgFmt } from '../common';

const STATUS_UI: Record<string, { pill: string; label: string }> = {
  collecting: { pill: 'info', label: 'Collecting data' },
  ahead: { pill: '', label: 'Ahead of plan' },
  green: { pill: '', label: 'On track' },
  yellow: { pill: 'warn', label: 'Slightly behind' },
  red: { pill: 'bad', label: 'Behind plan' },
};

export function Today({ s, d }: { s: AppState; d: Derived }) {
  const log = dayOf(s, d.today);
  const t = sumEntries(log.food);
  const left = d.targets.kcal - t.kcal;
  const todaysWorkout = s.workouts.some((w) => w.date === d.today);
  const dayIdx = s.workouts.length % DAY_PLANS.length;
  const st = STATUS_UI[d.onTrack.status];
  const lines = COACH_LINES[d.onTrack.status];
  const line = lines[new Date().getDate() % lines.length];
  const [w, setW] = useState('');
  const weighedToday = s.weights[d.today] !== undefined;
  const imp = d.profile.units === 'imperial';
  const waterL = (ml: number) => (ml / 1000).toFixed(1);
  const floorWarn = t.kcal > 0 && t.kcal < d.targets.floor * 0.7 && log.foodDone;

  return (
    <div>
      <header class="masthead">
        <div class="label">Week {d.week} · {formatShort(d.today)}</div>
        <h1>Hi {d.profile.name}</h1>
        <p class="coach">{line}</p>
        <div class="stats">
          <div><b>{d.streak.current}</b><span>Day streak</span></div>
          <div><b>{d.xp.level}</b><span>Level</span></div>
          <div><b>{d.xp.total}</b><span>XP</span></div>
        </div>
      </header>

      <div class="stack dash">
        <Card title="Status" right={<span class={`pill ${st.pill}`}><i class="dot" />{st.label}</span>}>
          <p>{d.onTrack.message}</p>
          {d.onTrack.trendKg !== null && (
            <p class="small muted">
              Trend {kgFmt(d.onTrack.trendKg, d.profile.units)}
              {d.onTrack.expectedKg !== null && <> · plan {kgFmt(d.onTrack.expectedKg, d.profile.units)}</>}
              {d.finish && <> · goal by {formatShort(d.finish)}</>}
            </p>
          )}
          {d.onTrack.tips[0] && <p class="small">{d.onTrack.tips[0]}</p>}
        </Card>

        <Card title="Calories">
          <Ring value={t.kcal} max={d.targets.kcal} label={`${Math.abs(left)}`} sub={left >= 0 ? 'kcal left' : 'kcal over'} />
          <div class="grid3 center">
            <div class="kpi"><b>{t.kcal}</b><span>Eaten</span></div>
            <div class="kpi"><b>{d.targets.kcal}</b><span>Target</span></div>
            <div class="kpi"><b>{Math.round(t.p)}/{d.targets.proteinG}</b><span>Protein g</span></div>
          </div>
          {floorWarn && <div class="banner bad small">Well below the {d.targets.floor} kcal minimum. Please eat a proper meal.</div>}
          <a class="btn block" href="#/food">Log food</a>
        </Card>

        <Card title="Water" right={<span class="small muted">{waterL(log.waterMl)} / {waterL(d.targets.waterMl)} L</span>}>
          <Bar value={log.waterMl} max={d.targets.waterMl} />
          <div class="row wrap">
            <button class="soft" onClick={() => addWater(d.today, 250)}>+ 250 ml</button>
            <button class="soft" onClick={() => addWater(d.today, 500)}>+ 500 ml</button>
            <button class="ghost small" onClick={() => addWater(d.today, -250)} aria-label="Remove 250 ml">−</button>
          </div>
        </Card>

        <Card title="Move">
          {todaysWorkout ? <div class="banner ok">Workout done today.</div> : <a class="btn block" href="#/train">Start workout · Day {dayIdx + 1}</a>}
          <label class="f" for="steps">Steps <small>goal {d.stepTarget.toLocaleString()}</small></label>
          <input id="steps" type="number" inputMode="numeric" value={log.steps ?? ''} placeholder="0" onChange={(e) => setSteps(d.today, +(e.target as HTMLInputElement).value)} />
          <div><Bar value={log.steps ?? 0} max={d.stepTarget} /></div>
        </Card>

        <Card title="Weigh-in">
          {weighedToday ? (
            <div class="row between"><b style="font-family:var(--serif);font-size:1.4rem;font-weight:500">{kgFmt(s.weights[d.today], d.profile.units)}</b><button class="ghost small" onClick={() => setWeight(d.today, null)}>Undo</button></div>
          ) : (
            <div class="row">
              <input type="number" inputMode="decimal" step="0.1" placeholder={imp ? 'lb' : 'kg'} value={w} onInput={(e) => setW((e.target as HTMLInputElement).value)} aria-label="Weight" />
              <button disabled={!w || +w <= 0} onClick={() => { const v = +w; setWeight(d.today, imp ? v / 2.20462 : v); setW(''); }}>Save</button>
            </div>
          )}
        </Card>

        <Card title="Today's challenge">
          <label class="row" style="gap:14px"><input type="checkbox" checked={!!log.challengeDone} onChange={() => toggleChallenge(d.today)} /> <span>{challengeFor(d.today)}</span></label>
        </Card>
      </div>
    </div>
  );
}
