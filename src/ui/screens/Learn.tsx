import { Card } from '../common';

const SOURCES: [string, string][] = [
  ['Mifflin-St Jeor accuracy in adults with and without obesity', 'https://pubmed.ncbi.nlm.nih.gov/23631843/'],
  ['Validation of resting metabolic rate equations in obese and non-obese people', 'https://pubmed.ncbi.nlm.nih.gov/12963943/'],
  ['Protein intake and lean-mass preservation during energy restriction (meta-analysis)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7231581'],
  ['ISSN position stand: protein and exercise', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5477153/'],
  ['Self-monitoring in weight loss: a systematic review', 'https://pubmed.ncbi.nlm.nih.gov/21185970/'],
  ['Daily weighing improves weight loss and weight-control behaviours', 'https://pubmed.ncbi.nlm.nih.gov/25683820/'],
  ['Harvard Health: a healthy, realistic rate of weight loss', 'https://content.health.harvard.edu/blog/what-does-a-healthy-realistic-rate-of-weight-loss-look-like-and-why-does-it-matter'],
  ['Cleveland Clinic: how long does it take to lose weight', 'https://health.clevelandclinic.org/how-long-does-it-take-to-lose-weight'],
];

export function Learn() {
  return (
    <div class="stack">
      <h1>Why it works</h1>
      <Card title="1 · It's mostly about food, and a steady deficit">
        <p class="small" style="margin:0">Weight loss needs you to eat less energy than you burn. Exercise helps your health and protects muscle, but a 30-minute workout burns far less than most people think, so food is the main lever. A pace of roughly <b>0.5–1% of body weight per week</b> is the commonly recommended range: faster tends to cost muscle and be hard to keep up. Larger goals simply take longer, and that's okay.</p>
      </Card>
      <Card title="2 · Why the plan slows down">
        <p class="small" style="margin:0">The old "3,500 kcal per lb / 7,700 per kg" rule treats your body like a fixed machine. In reality, as you get lighter you burn less, so loss slows. The app re-computes your maintenance as your weight falls, and after a couple of weeks of logging it measures <i>your</i> real burn from your food and weight trend, because calorie equations can be off by 10% or more for individuals.</p>
      </Card>
      <Card title="3 · Protein and strength training protect muscle">
        <p class="small" style="margin:0">When you eat less, you can lose muscle along with fat. Higher protein intake and resistance training both reduce that loss. Your default target is about 1.6 g per kg of an adjusted body weight (minimum 1.2). Note that most research on higher intakes comes from lean, trained people, so this is a sensible target rather than a guarantee. Beans, eggs, tofu, canned fish and chicken are the budget picks.</p>
      </Card>
      <Card title="4 · Tracking works, but weigh the trend">
        <p class="small" style="margin:0">People who log their food and weigh in often tend to lose more weight. (These studies show an association, so motivated people may also track more.) Daily weight is noisy because of water and hormones, so the app shows a smoothed trend and the status compares that to the plan.</p>
      </Card>
      <Card title="5 · The fun part is a tool, not a trick">
        <p class="small" style="margin:0">XP, streaks and badges reward <i>behaviours</i> you control. Streak freezes mean a bad day never erases your progress. I haven't verified research on gamification, so treat it as a way to make the habit more enjoyable.</p>
      </Card>
      <Card title="Limits and safety">
        <ul class="small" style="margin:0;padding-left:18px">
          <li>This is not medical advice. If you have a medical condition or take medication, talk to your doctor first.</li>
          <li>The app never plans below {1200} kcal (women) / {1500} kcal (men) per day.</li>
          <li>Nutrient and price data are estimates. Check labels, and edit prices to match your market.</li>
          <li>Under 18, pregnant, or a history of disordered eating: the app plans maintenance only. Please see a professional.</li>
        </ul>
      </Card>
      <Card title="Sources">
        <ul class="small" style="margin:0;padding-left:18px">{SOURCES.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer">{t}</a></li>)}</ul>
      </Card>
    </div>
  );
}
