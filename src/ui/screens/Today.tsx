import { useState } from 'preact/hooks';
import { addDays, formatShort } from '../../core/dates';
import { COACH_LINES, challengeFor } from '../../core/gamify';
import { sumEntries } from '../../core/nutrition';
import { recommend, todaysSession, weekdayIndex } from '../../core/training';
import type { Derived } from '../../store/derive';
import { addWater, setSteps, setWeight, toggleChallenge, toggleMoveDone } from '../../store/actions';
import { dayOf, type AppState } from '../../store/store';
import { Bar, Check, Ring, Sparkline, WeekBars, kgFmt } from '../common';

const STATUS_UI: Record<string, { pill: string; label: string }> = {
  collecting: { pill: 'info', label: 'Collecting data' },
  ahead: { pill: '', label: 'Ahead of plan' },
  green: { pill: '', label: 'On track' },
  yellow: { pill: 'warn', label: 'Slightly behind' },
  red: { pill: 'bad', label: 'Behind plan' },
};
const KIND_LABEL = { strength: 'Strength', cardio: 'Cardio', sport: 'Sport', walk: 'Walk', rest: 'Rest' } as const;
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function Macro({ label, value, target }: { label: string; value: number; target: number }) {
  return (
    <div class="macro">
      <div class="macro-head"><span>{label}</span><span class="macro-val"><b>{Math.round(value)}</b> / {Math.round(target)} g</span></div>
      <Bar value={value} max={target} />
    </div>
  );
}

export function Today({ s, d }: { s: AppState; d: Derived }) {
  const log = dayOf(s, d.today);
  const t = sumEntries(log.food);
  const left = d.targets.kcal - t.kcal;
  const todaysWorkout = s.workouts.some((w) => w.date === d.today);
  const rec = recommend(d.profile, d.week, d.level.label);
  const session = todaysSession(rec, d.today);
  const st = STATUS_UI[d.onTrack.status];
  const lines = COACH_LINES[d.onTrack.status];
  const line = lines[new Date().getDate() % lines.length];
  const [w, setW] = useState('');
  const weighedToday = s.weights[d.today] !== undefined;
  const imp = d.profile.units === 'imperial';
  const waterL = (ml: number) => (ml / 1000).toFixed(1);
  const floorWarn = t.kcal > 0 && t.kcal < d.targets.floor * 0.7 && log.foodDone;

  const weights = d.weightPoints.slice(-14).map((x) => x.kg);
  const lost = d.trendKg !== null ? d.profile.startWeightKg - d.trendKg : 0;
  const week = [...Array(7)].map((_, i) => {
    const date = addDays(d.today, i - 6);
    return { label: DAY_LETTERS[weekdayIndex(date)], kcal: dayOf(s, date).food.reduce((a, e) => a + e.kcal, 0), today: i === 6 };
  });

  const tasks = [
    { id: 'food', label: 'Log your meals', done: log.food.length >= 2 || !!log.foodDone, href: '#/food' },
    { id: 'water', label: 'Reach your water goal', done: log.waterMl >= d.targets.waterMl * 0.95, href: undefined },
    { id: 'steps', label: `Walk ${d.stepTarget.toLocaleString()} steps`, done: (log.steps ?? 0) >= d.stepTarget, href: undefined },
    { id: 'move', label: session.kind === 'strength' ? 'Finish today\'s workout' : session.kind === 'rest' ? 'Rest day' : `${session.title}, ${session.detail}`, done: session.kind === 'strength' ? todaysWorkout : session.kind === 'rest' ? true : (session.kind === 'cardio' || session.kind === 'sport') ? !!log.moveDone : false, href: session.kind === 'strength' ? '#/train' : undefined, toggle: (session.kind === 'cardio' || session.kind === 'sport') ? () => toggleMoveDone(d.today) : undefined },
    { id: 'weigh', label: 'Weigh in', done: weighedToday, href: undefined },
  ];
  const doneCount = tasks.filter((x) => x.done).length + (log.challengeDone ? 1 : 0);

  return (
    <div>
      <header class="masthead">
        <img class="mast-photo" src="banner.jpg" alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <svg class="mast-swoosh" viewBox="0 0 1200 420" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="swoosh" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stop-color="#2563eb" stop-opacity="0" />
              <stop offset="0.5" stop-color="#2563eb" stop-opacity="0.55" />
              <stop offset="1" stop-color="#60a5fa" stop-opacity="0.12" />
            </linearGradient>
          </defs>
          <path d="M330,0 C520,90 700,260 1200,150 L1200,0 Z" fill="url(#swoosh)" />
          <path d="M330,0 C520,90 700,260 1200,150" fill="none" stroke="#60a5fa" stroke-opacity="0.35" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        </svg>
        <div class="mast-inner">
          <div class="label">Week {d.week} · {formatShort(d.today)}</div>
          <h1>Hi <span class="name">{d.profile.name}</span></h1>
          <p class="coach">{line}</p>
          <div class="stat-chips">
            <div class="stat-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /></svg><div><b>{d.streak.current}</b><span>Day streak</span></div></div>
            <div class="stat-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20v-7M12 20V5M18 20v-10" /></svg><div><b>{d.xp.level}</b><span>Level</span></div></div>
            <div class="stat-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg><div><b>{d.xp.total}</b><span>XP</span></div></div>
          </div>
        </div>
        <svg class="mast-wave" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0,38 C240,0 500,58 800,28 C980,10 1100,4 1200,22 L1200,60 L0,60 Z" fill="var(--bg)" /></svg>
      </header>

      <div class="dash-grid">
        <section class="card d-status">
          <div class="card-head"><h2>Status</h2><span class={`pill ${st.pill}`}><i class="dot" />{st.label}</span></div>
          <p>{d.onTrack.message}</p>
          <div class="facts">
            {d.onTrack.trendKg !== null && <div><span>Trend</span><b>{kgFmt(d.onTrack.trendKg, d.profile.units)}</b></div>}
            {d.onTrack.expectedKg !== null && <div><span>Plan</span><b>{kgFmt(d.onTrack.expectedKg, d.profile.units)}</b></div>}
            {d.finish && <div><span>Goal by</span><b>{formatShort(d.finish)}</b></div>}
          </div>
          {d.onTrack.tips[0] && <p class="small muted">{d.onTrack.tips[0]}</p>}
        </section>

        <section class="card d-cal">
          <div class="card-head"><h2>Calories</h2><span class="small muted">{t.kcal} of {d.targets.kcal} kcal</span></div>
          <Ring value={t.kcal} max={d.targets.kcal} label={`${Math.abs(left)}`} sub={left >= 0 ? 'kcal left' : 'kcal over'} />
          <div class="macros">
            <Macro label="Protein" value={t.p} target={d.targets.proteinG} />
            <Macro label="Carbs" value={t.c} target={d.targets.carbG} />
            <Macro label="Fat" value={t.f} target={d.targets.fatG} />
          </div>
          {floorWarn && <div class="banner bad small">Well below the {d.targets.floor} kcal minimum. Please eat a proper meal.</div>}
          <a class="btn block" href="#/food">Log food</a>
        </section>

        <section class="card d-session">
          <div class="card-head"><h2>Today's session</h2><span class="pill neutral">{KIND_LABEL[session.kind]}</span></div>
          <div class="today-plan"><b>{session.title}</b><span>{session.detail}</span></div>
          {session.kind === 'strength'
            ? (todaysWorkout ? <div class="banner ok">Workout done today.</div> : <a class="btn block" href="#/train">Start workout</a>)
            : (session.kind === 'cardio' || session.kind === 'sport')
              ? <button class={log.moveDone ? 'soft block' : 'block'} onClick={() => toggleMoveDone(d.today)}>{log.moveDone ? 'Done. Tap to undo' : 'Mark as done'}</button>
              : <a class="btn ghost block" href="#/train">See your week</a>}
        </section>

        <section class="card d-check">
          <div class="card-head"><h2>Checklist</h2><span class="small muted">{doneCount} of {tasks.length + 1}</span></div>
          <Bar value={doneCount} max={tasks.length + 1} />
          <div class="tasks">
            {tasks.map((x) => {
              const inner = (<><Check done={x.done} /><span class={x.done ? 'task-label done' : 'task-label'}>{x.label}</span></>);
              if (x.toggle) return <button type="button" class="task as-button" key={x.id} onClick={x.toggle} aria-pressed={x.done}>{inner}</button>;
              return x.href ? <a class="task" key={x.id} href={x.href}>{inner}</a> : <div class="task" key={x.id}>{inner}</div>;
            })}
            <button type="button" class="task as-button" onClick={() => toggleChallenge(d.today)} aria-pressed={!!log.challengeDone}>
              <Check done={!!log.challengeDone} /><span class={log.challengeDone ? 'task-label done' : 'task-label'}>{challengeFor(d.today)}</span>
            </button>
          </div>
        </section>

        <section class="card d-water">
          <div class="card-head"><h2>Water</h2></div>
          <div class="big-num"><b>{waterL(log.waterMl)}</b><span>of {waterL(d.targets.waterMl)} L</span></div>
          <Bar value={log.waterMl} max={d.targets.waterMl} />
          <div class="btn-row">
            <button class="soft" onClick={() => addWater(d.today, 250)}>+ 250 ml</button>
            <button class="soft" onClick={() => addWater(d.today, 500)}>+ 500 ml</button>
            <button class="ghost small" onClick={() => addWater(d.today, -250)} aria-label="Remove 250 ml">−</button>
          </div>
        </section>

        <section class="card d-steps">
          <div class="card-head"><h2>Steps</h2></div>
          <div class="big-num"><b>{(log.steps ?? 0).toLocaleString()}</b><span>of {d.stepTarget.toLocaleString()}</span></div>
          <Bar value={log.steps ?? 0} max={d.stepTarget} />
          <input type="number" inputMode="numeric" value={log.steps ?? ''} placeholder="Enter today's steps" aria-label="Steps today" onChange={(e) => setSteps(d.today, +(e.target as HTMLInputElement).value)} />
        </section>

        <section class="card d-weight">
          <div class="card-head"><h2>Weight</h2>{d.trendKg !== null && <span class="small muted">{lost >= 0 ? '−' : '+'}{Math.abs(imp ? lost * 2.20462 : lost).toFixed(1)} {imp ? 'lb' : 'kg'} so far</span>}</div>
          <div class="big-num"><b>{kgFmt(d.currentKg, d.profile.units)}</b><span>trend</span></div>
          <Sparkline values={weights} />
          {weighedToday ? (
            <div class="btn-row between"><span class="small muted">Today: {kgFmt(s.weights[d.today], d.profile.units)}</span><button class="ghost small" onClick={() => setWeight(d.today, null)}>Undo</button></div>
          ) : (
            <div class="row">
              <input type="number" inputMode="decimal" step="0.1" placeholder={`Today (${imp ? 'lb' : 'kg'})`} value={w} onInput={(e) => setW((e.target as HTMLInputElement).value)} aria-label="Weight" />
              <button disabled={!w || +w <= 0} onClick={() => { const v = +w; setWeight(d.today, imp ? v / 2.20462 : v); setW(''); }}>Save</button>
            </div>
          )}
        </section>

        <section class="card d-week">
          <div class="card-head"><h2>This week</h2><span class="small muted">Calories vs target</span></div>
          <WeekBars days={week} target={d.targets.kcal} />
        </section>
      </div>
    </div>
  );
}
