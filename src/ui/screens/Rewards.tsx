import { XP } from '../../core/gamify';
import type { Derived } from '../../store/derive';
import { Bar, Card } from '../common';

export function Rewards({ d }: { d: Derived }) {
  const x = d.xp;
  return (
    <div class="stack">
      <h1>Rewards</h1>
      <Card>
        <div class="row between"><h2 style="margin:0">Level {x.level}</h2><span class="muted small">{x.total} XP</span></div>
        <Bar value={x.intoLevel} max={x.levelSize} />
        <p class="small muted" style="margin:6px 0 0">{x.levelSize - x.intoLevel} XP to level {x.level + 1}. XP comes from <i>habits</i> (logging, water, workouts), never from the scale, so you can always earn it.</p>
      </Card>

      <Card title="Streak">
        <div class="grid3">
          <div class="kpi"><b>🔥 {d.streak.current}</b><span>current days</span></div>
          <div class="kpi"><b>🏆 {d.streak.best}</b><span>best</span></div>
          <div class="kpi"><b>🧊 {d.streak.freezes}</b><span>freezes</span></div>
        </div>
        <p class="small muted" style="margin:8px 0 0">A day counts if you log food, a workout or a weigh-in. Every 7 days in a row earns a freeze (max 2). A freeze covers a missed day automatically, so one bad day never wipes you out.</p>
      </Card>

      <Card title="This week's quests">
        {d.quests.map((q) => (
          <div key={q.id} style="margin-bottom:8px">
            <div class="row between small"><span>{q.progress >= q.goal ? '✅ ' : ''}{q.title}</span><span class="muted">{q.progress}/{q.goal} · +{q.xp} XP</span></div>
            <Bar value={q.progress} max={q.goal} />
          </div>
        ))}
        <p class="small muted">Quests reset every 7 days from your start date. They're for fun and are shown as progress. The XP is already counted in the habit totals.</p>
      </Card>

      <Card title={`Badges (${d.badges.filter((b) => b.earned).length}/${d.badges.length})`}>
        <div class="grid3">
          {d.badges.map((b) => (
            <div key={b.id} class={`badge ${b.earned ? '' : 'off'}`} title={b.desc}>
              <div class="e">{b.emoji}</div><b>{b.name}</b><span>{b.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="How XP works">
        <table class="t"><tbody>
          <tr><td>Log food for the day</td><td>+{XP.food}</td></tr>
          <tr><td>Hit your water goal</td><td>+{XP.water}</td></tr>
          <tr><td>Finish a workout</td><td>+{XP.workout}</td></tr>
          <tr><td>Weigh in</td><td>+{XP.weigh}</td></tr>
          <tr><td>Reach your step goal</td><td>+{XP.steps}</td></tr>
          <tr><td>Daily challenge</td><td>+{XP.challenge}</td></tr>
        </tbody></table>
        <details style="margin-top:8px"><summary class="small">Your XP so far</summary>
          <table class="t"><tbody>{x.parts.map((p) => <tr key={p.label}><td>{p.label} ×{p.n}</td><td>{p.xp}</td></tr>)}</tbody></table></details>
      </Card>
    </div>
  );
}
