import { useState } from 'preact/hooks';
import { formatShort } from '../../core/dates';
import { COACH_LINES, challengeFor } from '../../core/gamify';
import { sumEntries } from '../../core/nutrition';
import { DAY_PLANS } from '../../data/exercises';
import type { Derived } from '../../store/derive';
import { addWater, setSteps, setWeight, toggleChallenge } from '../../store/actions';
import { dayOf, type AppState } from '../../store/store';
import { Bar, Card, Ring, kgFmt } from '../common';

const STATUS_UI: Record<string, { pill: string; label: string; tone: string }> = {
  collecting: { pill: 'info', label: '🔎 Collecting data', tone: 'info' },
  ahead: { pill: '', label: '🚀 Ahead of plan', tone: 'ok' },
  green: { pill: '', label: '✅ On track', tone: 'ok' },
  yellow: { pill: 'warn', label: '🟡 Slightly behind', tone: 'warn' },
  red: { pill: 'bad', label: '🔴 Behind plan', tone: 'bad' },
};

export function Today({ s, d }: { s: AppState; d: Derived }) {
  const log = dayOf(s, d.today);
  const t = sumEntries(log.food);
  const left = d.targets.kcal - t.kcal;
  const nWorkouts = s.workouts.length;
  const todaysWorkout = s.workouts.some((w) => w.date === d.today);
  const dayIdx = nWorkouts % DAY_PLANS.length;
  const st = STATUS_UI[d.onTrack.status];
  const lines = COACH_LINES[d.onTrack.status];
  const line = lines[new Date().getDate() % lines.length];
  const [w, setW] = useState('');
  const weighedToday = s.weights[d.today] !== undefined;
  const imp = d.profile.units === 'imperial';
  const waterL = (ml: number) => (ml / 1000).toFixed(2).replace(/\.?0+$/, '');
  const over = t.kcal > d.targets.kcal * 1.05;
  const floorWarn = t.kcal > 0 && t.kcal < d.targets.floor * 0.7 && log.foodDone;

  return (
    <div class="stack">
      <div class="topbar">
        <div><h1 style="margin:0">Hi {d.profile.name}!</h1><span class="muted small">{formatShort(d.today)} · Week {d.week}</span></div>
        <div class="right"><span class="pill">🔥 {d.streak.current}-day streak</span><br /><span class="small muted">Lv {d.xp.level} · {d.xp.total} XP</span></div>
      </div>

      <div class="hero"><div class="mascot">🦁</div><div class="bubble">{line}</div></div>

      <Card title="On track?" right={<span class={`pill ${st.pill}`}>{st.label}</span>}>
        <div class={`banner ${st.tone}`}>{d.onTrack.message}</div>
        {d.onTrack.trendKg !== null && (
          <p class="small muted" style="margin:6px 0 0">
            Trend weight <b>{kgFmt(d.onTrack.trendKg, d.profile.units)}</b>
            {d.onTrack.expectedKg !== null && <> · plan says {kgFmt(d.onTrack.expectedKg, d.profile.units)}</>}
            {d.finish && <> · projected goal date <b>{formatShort(d.finish)}</b></>}
          </p>
        )}
        {d.onTrack.tips.slice(0, 2).map((x) => <p class="small" key={x} style="margin:6px 0 0">💡 {x}</p>)}
        <p style="margin:8px 0 0"><a href="#/progress" class="small">See full progress →</a></p>
      </Card>

      <Card title="Calories">
        <Ring value={t.kcal} max={d.targets.kcal} label={`${Math.abs(left)}`} sub={left >= 0 ? 'kcal left' : 'kcal over'} />
        <div class="grid3" style="margin-top:12px">
          <div class="kpi"><b>{t.kcal}</b><span>eaten</span></div>
          <div class="kpi"><b>{d.targets.kcal}</b><span>target</span></div>
          <div class="kpi"><b>{Math.round(t.p)}g</b><span>of {d.targets.proteinG}g protein</span></div>
        </div>
        <div style="margin-top:8px"><Bar value={t.p} max={d.targets.proteinG} /></div>
        {over && <div class="banner warn small">A bit over today. One day does not matter: aim to be closer tomorrow, and do not skip meals to "make up" for it.</div>}
        {floorWarn && <div class="banner bad small">That is well under the minimum of {d.targets.floor} kcal. Eating too little backfires (muscle loss, rebound hunger). Please eat a proper meal.</div>}
        <div class="row" style="margin-top:10px"><a class="btn grow" href="#/food">＋ Log food</a></div>
        <p class="small muted" style="margin:8px 0 0">Spent {d.region.currency}{t.cost.toFixed(0)} of {d.region.currency}{d.profile.budgetPerDay} budget today.</p>
      </Card>

      <Card title="Water" right={<span class="small muted">{waterL(log.waterMl)} / {waterL(d.targets.waterMl)} L</span>}>
        <Bar value={log.waterMl} max={d.targets.waterMl} />
        <div class="row wrap" style="margin-top:10px">
          <button class="soft" onClick={() => addWater(d.today, 250)}>＋ Glass 250 ml</button>
          <button class="soft" onClick={() => addWater(d.today, 500)}>＋ 500 ml</button>
          <button class="ghost small" onClick={() => addWater(d.today, -250)} aria-label="Remove a glass">−</button>
        </div>
        {log.waterMl >= d.targets.waterMl * 0.95 && <p class="small" style="margin:8px 0 0">💧 Water goal hit! +15 XP</p>}
      </Card>

      <Card title="Move">
        {todaysWorkout ? <div class="banner ok">💥 Workout done today. Great work! +60 XP</div> : (
          <a class="btn block" href="#/train">▶ Start today's workout (Day {dayIdx + 1})</a>
        )}
        <label class="f" for="steps">Steps today <small>(goal {d.stepTarget.toLocaleString()})</small></label>
        <input id="steps" type="number" inputMode="numeric" value={log.steps ?? ''} placeholder="Enter from your phone or just estimate" onChange={(e) => setSteps(d.today, +(e.target as HTMLInputElement).value)} />
        <div style="margin-top:6px"><Bar value={log.steps ?? 0} max={d.stepTarget} /></div>
      </Card>

      <Card title="Weigh-in">
        {weighedToday ? (
          <p style="margin:0">Logged: <b>{kgFmt(s.weights[d.today], d.profile.units)}</b> <button class="ghost small" onClick={() => setWeight(d.today, null)}>Undo</button></p>
        ) : (
          <div class="row">
            <input type="number" inputMode="decimal" step="0.1" placeholder={`Today's weight (${imp ? 'lb' : 'kg'})`} value={w} onInput={(e) => setW((e.target as HTMLInputElement).value)} aria-label="Weight" />
            <button disabled={!w || +w <= 0} onClick={() => { const v = +w; setWeight(d.today, imp ? v / 2.20462 : v); setW(''); }}>Save</button>
          </div>
        )}
        <p class="small muted" style="margin:6px 0 0">Daily readings bounce around. I track the smooth trend, not any single day.</p>
      </Card>

      <Card title="Today's challenge" right={<span class="small muted">+10 XP</span>}>
        <label class="row" style="gap:12px"><input type="checkbox" style="width:26px;min-height:26px" checked={!!log.challengeDone} onChange={() => toggleChallenge(d.today)} /> <span>{challengeFor(d.today)}</span></label>
      </Card>

      <Card title="This week's quests" right={<a href="#/rewards" class="small">All rewards</a>}>
        {d.quests.map((q) => (
          <div key={q.id} style="margin-bottom:8px">
            <div class="row between small"><span>{q.progress >= q.goal ? '✅ ' : ''}{q.title}</span><span class="muted">{q.progress}/{q.goal}</span></div>
            <Bar value={q.progress} max={q.goal} />
          </div>
        ))}
      </Card>
    </div>
  );
}
