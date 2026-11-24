import { XP } from '../../core/gamify';
import type { Derived } from '../../store/derive';
import { Bar, Card } from '../common';

export function Rewards({ d }: { d: Derived }) {
  const x = d.xp;
  return (
    <div class="stack">
      <h1>Rewards</h1>
      <Card>
        <div class="row between"><h2>Level {x.level}</h2><span class="muted small">{x.total} XP</span></div>
        <Bar value={x.intoLevel} max={x.levelSize} />
        <p class="small muted">{x.levelSize - x.intoLevel} XP to level {x.level + 1}</p>
      </Card>

      <Card title="Streak">
        <div class="grid3">
          <div class="kpi"><b>{d.streak.current}</b><span>current days</span></div>
          <div class="kpi"><b>{d.streak.best}</b><span>best</span></div>
          <div class="kpi"><b>{d.streak.freezes}</b><span>freezes</span></div>
        </div>
        <p class="small muted">Log food, a workout or a weigh-in to keep it. A freeze covers a missed day.</p>
      </Card>

      <Card title="This week's quests">
        {d.quests.map((q) => (
          <div key={q.id}>
            <div class="row between small"><span>{q.progress >= q.goal ? '' : ''}{q.title}</span><span class="muted">{q.progress}/{q.goal} · +{q.xp} XP</span></div>
            <Bar value={q.progress} max={q.goal} />
          </div>
        ))}
      </Card>

      <Card title={`Badges (${d.badges.filter((b) => b.earned).length}/${d.badges.length})`}>
        <div class="grid3">
          {d.badges.map((b) => (
            <div key={b.id} class={`badge ${b.earned ? '' : 'off'}`} title={b.desc}>
              <div class="e" aria-hidden="true">{b.earned ? '★' : '☆'}</div><b>{b.name}</b><span>{b.desc}</span>
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
        <details><summary class="small">Your XP so far</summary>
          <table class="t"><tbody>{x.parts.map((p) => <tr key={p.label}><td>{p.label} ×{p.n}</td><td>{p.xp}</td></tr>)}</tbody></table></details>
      </Card>
    </div>
  );
}
