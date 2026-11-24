import { useEffect, useRef, useState } from 'preact/hooks';
import type { WorkoutItem } from '../../core/types';
import { cardioPool, recommend, todaysSession, weekdayIndex } from '../../core/training';
import { DAY_PLANS, RANGES, buildWorkout, type PlannedItem } from '../../data/exercises';
import { ACTIVITIES } from '../../data/activities';
import type { Derived } from '../../store/derive';
import { completeWorkout } from '../../store/actions';
import type { AppState } from '../../store/store';
import { Card, Confetti, Chips } from '../common';
import { ExerciseEditor, TrainDaysPicker, scheduleSummary } from '../ExerciseEditor';
import { updateProfile } from '../../store/actions';

type Fb = 'easy' | 'right' | 'hard';

function useCountdown(): [number, (n: number) => void, boolean] {
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { setRunning(false); try { navigator.vibrate?.(200); } catch { /* ignore */ } return 0; }
        return l - 1;
      });
    }, 1000);
    return () => window.clearInterval(ref.current);
  }, [running]);
  return [left, (n: number) => { setLeft(n); setRunning(n > 0); }, running];
}

export function Train({ s, d }: { s: AppState; d: Derived }) {
  const rec = recommend(d.profile, d.week, d.level.label);
  const todaySession = todaysSession(rec, d.today);
  const todayIdx = weekdayIndex(d.today);
  const dayIdx = s.workouts.length % DAY_PLANS.length;
  const [dayPick, setDayPick] = useState(todaySession.kind === 'strength' && todaySession.strengthDay !== undefined ? todaySession.strengthDay : dayIdx);
  const plan = buildWorkout(dayPick, d.profile, s.progression, d.week);
  const scheduledIds = new Set(d.profile.currentExercise.filter((e) => e.days?.length).map((e) => e.id));
  const pool = cardioPool(d.profile.comfortable, rec.lowImpact, scheduledIds);
  const [editing, setEditing] = useState(false);
  const summary = scheduleSummary(d.profile);
  const cardio = pool[s.workouts.length % pool.length];
  const [mode, setMode] = useState<'overview' | 'run' | 'done'>('overview');
  const doneToday = s.workouts.some((w) => w.date === d.today);

  if (mode === 'run') return <Run plan={plan} onExit={() => setMode('overview')} onFinish={(items) => { completeWorkout(items); setMode('done'); }} />;
  if (mode === 'done') return (
    <div class="stack center narrow">
      <Confetti show />
            <h1>Workout complete!</h1>
      <p>+60 XP. Your next session adapts to how this one felt.</p>
      <a class="btn" href="#/today">Back to Today</a>
    </div>
  );

  return (
    <div class="stack">
      <h1>Train</h1>
      <Card>
        <div class="row between"><div><b>Level: {d.level.label}</b><div class="small muted">{s.workouts.length} {s.workouts.length === 1 ? 'workout' : 'workouts'} · Week {d.week}</div></div><span class="pill">{d.profile.equipment === 'none' ? 'Bodyweight' : d.profile.equipment === 'home' ? 'Home gear' : 'Gym'}</span></div>
        <p class="small muted">{rec.intensity}</p>
      </Card>

      <Card title="Your week" right={<span class="pill neutral">About {rec.weeklyMinutes} min</span>}>
        <div>
          <h3>{rec.headline}</h3>
          <p class="small muted">{rec.why[0]}</p>
        </div>
        <div class="grid3 center">
          <div class="kpi"><b>{rec.strengthDays}</b><span>Strength</span></div>
          <div class="kpi"><b>{rec.cardioSessions}</b><span>Cardio</span></div>
          <div class="kpi"><b>{rec.steps.toLocaleString()}</b><span>Daily steps</span></div>
        </div>
        <div class="sched">
          {rec.schedule.map((x, i) => (
            <div key={x.day} class={`sched-row ${x.kind}${i === todayIdx ? ' today' : ''}`}>
              <span class="sched-day">{x.day}</span>
              <div class="sched-main"><b>{x.title}</b><span>{x.detail}</span></div>
              {x.source === 'yours' && <span class="pill neutral">Your sport</span>}
              {i === todayIdx && <span class="pill">Today</span>}
            </div>
          ))}
        </div>
        {rec.cautions.map((c) => <div class="banner warn small" key={c}>{c}</div>)}
      </Card>

      <Card title="Your sports and days" right={<button class="ghost small" onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>}>
        {!editing && (
          <div class="summary-lines">
            {summary.sports.length ? summary.sports.map((t) => <div key={t}>{t}</div>) : <div class="muted">No sports added yet</div>}
            <div class="muted">Training days: {summary.days}</div>
          </div>
        )}
        {editing && (
          <>
            <div>
              <label class="f">Days I can train</label>
              <TrainDaysPicker value={d.profile.trainDays ?? []} onChange={(v) => updateProfile({ trainDays: v })} />
            </div>
            <div>
              <label class="f">Sports I play</label>
              <ExerciseEditor profile={d.profile} weightKg={d.currentKg} />
            </div>
          </>
        )}
      </Card>

      <Card title="Pick your day">
        <Chips options={DAY_PLANS.map((_, i) => ({ id: String(i), label: `Day ${i + 1}${i === dayIdx ? ' · next' : ''}` }))} value={String(dayPick)} onChange={(v) => setDayPick(+v)} />
      </Card>

      <Card title="1 · Warm up (2–3 min)">
        <p class="small">March in place, arm circles, 5 easy squats.</p>
      </Card>

      <Card title="2 · Strength circuit" right={<span class="small muted">{plan.length} moves · ~{Math.round(plan.length * plan[0]?.sets * 1.7) || 20} min</span>}>
        <div class="list">
          {plan.map((p) => (
            <details key={p.exercise.id}>
              <summary>{p.exercise.name} <span class="muted">{p.sets} × {p.target} {p.unit === 'sec' ? 's' : 'reps'}</span></summary>
              <p class="small muted">{p.exercise.cue}</p>
            </details>
          ))}
        </div>
      </Card>

      <Card title={`3 · Cardio finisher: ${cardio.name}`}>
        <p class="small">{cardio.how}</p>
      </Card>

      {doneToday && <div class="banner ok">Already trained today. Rest is part of the plan.</div>}
      <button class="block" onClick={() => setMode('run')} disabled={!plan.length}>▶ Start guided workout</button>
      <details class="card"><summary>Other cardio options</summary>
        <div class="list">{ACTIVITIES.filter((a) => a.cardio && !(rec.lowImpact && a.impact === 'high')).map((a) => <div class="item" key={a.id}><div><b>{a.name}</b><div class="small muted">{a.how ?? 'Steady, comfortable effort.'}</div></div></div>)}</div>
      </details>
      <p class="disclaimer">Stop if you feel sharp pain or dizziness.</p>
    </div>
  );
}

function Run({ plan, onExit, onFinish }: { plan: PlannedItem[]; onExit: () => void; onFinish: (items: WorkoutItem[]) => void }) {
  const [i, setI] = useState(0);
  const [set, setSet] = useState(1);
  const [phase, setPhase] = useState<'work' | 'rest' | 'rate'>('work');
  const [fb, setFb] = useState<Record<number, Fb>>({});
  const [left, startTimer, running] = useCountdown();
  const p = plan[i];
  const isHold = p.exercise.kind === 'hold';

  const afterSet = () => {
    if (set < p.sets) { setPhase('rest'); startTimer(45); } else setPhase('rate');
  };
  const nextExercise = (f: Fb) => {
    const nf = { ...fb, [i]: f };
    setFb(nf);
    if (i + 1 < plan.length) { setI(i + 1); setSet(1); setPhase('work'); startTimer(0); }
    else onFinish(plan.map((x, k) => ({ exerciseId: x.exercise.id, pattern: x.pattern, sets: x.sets, target: x.target, feedback: nf[k] })));
  };

  return (
    <div class="stack narrow">
      <div class="row between"><button class="ghost small" onClick={onExit}>Exit</button><span class="muted small">Move {i + 1} of {plan.length}</span></div>
      <div class="steps">{plan.map((_, k) => <i key={k} class={k <= i ? 'on' : ''} />)}</div>
      <Card>
        <div class="center"><h1>{p.exercise.name}</h1>
          <p class="muted">{p.exercise.cue}</p></div>
        {phase === 'work' && (
          <div class="stack center">
            <div><b style="font-size:1.4rem">Set {set} of {p.sets}</b><br /><span class="muted">Target: {p.target} {isHold ? 'seconds' : 'reps'}</span></div>
            {isHold && (running ? <div class="timer">{left}</div> : <button class="soft" onClick={() => startTimer(p.target)}>Start {p.target}s timer</button>)}
            <button class="block" onClick={afterSet}>✔ Set done</button>
          </div>
        )}
        {phase === 'rest' && (
          <div class="stack center">
            <div class="muted">Rest. Breathe, shake it out, sip water.</div>
            <div class="timer">{left}</div>
            <button class="block" onClick={() => { startTimer(0); setSet(set + 1); setPhase('work'); }}>{left > 0 ? 'Skip rest' : 'Next set'}</button>
          </div>
        )}
        {phase === 'rate' && (
          <div class="stack center">
            <b>How did it feel?</b>
            <button class="block soft" onClick={() => nextExercise('easy')}>Too easy: make it harder</button>
            <button class="block soft" onClick={() => nextExercise('right')}>Just right</button>
            <button class="block soft" onClick={() => nextExercise('hard')}>Too hard: ease off</button>
          </div>
        )}
      </Card>
    </div>
  );
}
