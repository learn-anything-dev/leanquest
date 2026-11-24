import { Card } from '../common';

const POINTS: [string, string][] = [
  ['Food drives the deficit', 'Exercise protects muscle and health, but a workout burns less than most people think. Aim for 0.5–1% of body weight per week.'],
  ['Why the pace slows', 'You burn less as you get lighter. The plan recalculates as you go, then learns your real burn from your logs.'],
  ['Protein and strength training', 'Both reduce muscle loss while dieting. Default is 1.6 g per kg of adjusted body weight, minimum 1.2.'],
  ['Track, then trust the trend', 'People who log food and weigh in often tend to lose more. Daily weight is noisy, so the app shows the smoothed trend.'],
];

const SOURCES: [string, string][] = [
  ['Mifflin-St Jeor accuracy in obesity', 'https://pubmed.ncbi.nlm.nih.gov/23631843/'],
  ['Resting metabolic rate equations validation', 'https://pubmed.ncbi.nlm.nih.gov/12963943/'],
  ['Protein and lean mass in energy restriction', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7231581'],
  ['ISSN position stand: protein and exercise', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5477153/'],
  ['Self-monitoring in weight loss', 'https://pubmed.ncbi.nlm.nih.gov/21185970/'],
  ['Daily weighing and weight loss', 'https://pubmed.ncbi.nlm.nih.gov/25683820/'],
  ['Harvard Health: realistic rate of weight loss', 'https://content.health.harvard.edu/blog/what-does-a-healthy-realistic-rate-of-weight-loss-look-like-and-why-does-it-matter'],
  ['Cleveland Clinic: how long to lose weight', 'https://health.clevelandclinic.org/how-long-does-it-take-to-lose-weight'],
];

export function Learn() {
  return (
    <div class="stack">
      <h1>Why it works</h1>
      <Card>
        {POINTS.map(([t, b]) => (
          <details key={t}><summary>{t}</summary><p class="small muted">{b}</p></details>
        ))}
      </Card>
      <Card title="Limits">
        <ul class="bullets small">
          <li>Not medical advice. See a doctor if you have a condition or take medication.</li>
          <li>Never plans below 1,200 kcal (women) or 1,500 kcal (men) a day.</li>
          <li>Food and calorie data are estimates.</li>
        </ul>
      </Card>
      <Card title="Sources">
        <ul class="bullets small">{SOURCES.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer">{t}</a></li>)}</ul>
      </Card>
    </div>
  );
}
