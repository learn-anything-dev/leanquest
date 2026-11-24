import { useMemo, useState } from 'preact/hooks';
import { bmi } from '../../core/calc';
import { MEAL_LABEL, excluded, planDay } from '../../core/nutrition';
import { getDiet } from '../../data/diets';
import type { Derived } from '../../store/derive';
import { setChoice } from '../../store/actions';
import type { AppState } from '../../store/store';
import { Card } from '../common';

export function PlanScreen({ d }: { s: AppState; d: Derived }) {
  const p = d.profile;
  const f = d.feas;
  const [seed, setSeed] = useState(0);
  const meal = useMemo(
    () => planDay(d.region.foods, { kcal: d.targets.kcal, proteinG: d.targets.proteinG, carbG: d.targets.carbG, fatG: d.targets.fatG }, p, seed),
    [d.region, d.targets.kcal, d.targets.proteinG, d.targets.carbG, d.targets.fatG, p.diets, p.hasAllergies, p.allergens, p.avoidFoods, seed],
  );
  const showChoice = f.plansDiffer && !f.maintenanceOnly;
  const dietNames = p.diets.filter((x) => x !== 'none').map((x) => getDiet(x)?.name).filter(Boolean) as string[];
  const restrictions = [...(p.hasAllergies ? p.allergens : []), ...(p.hasAllergies ? p.avoidFoods : [])];
  const topProtein = [...d.region.foods]
    .filter((x) => x.p >= 7 && ['protein', 'dairy'].includes(x.cat) && !excluded(x, p))
    .sort((a, b) => (b.p * b.servingG) / Math.max(40, b.kcal * b.servingG / 100) - (a.p * a.servingG) / Math.max(40, a.kcal * a.servingG / 100))
    .slice(0, 6);

  return (
    <div class="stack">
      <h1>Plan</h1>
      <Card title="Your targets today">
        <div class="grid2">
          <div class="kpi"><b>{d.targets.kcal}</b><span>kcal / day</span></div>
          <div class="kpi"><b>{d.targets.proteinG} g</b><span>protein (min {d.targets.proteinMinG})</span></div>
          <div class="kpi"><b>{d.targets.carbG} g</b><span>carbs</span></div>
          <div class="kpi"><b>{d.targets.fatG} g</b><span>fat</span></div>
        </div>
        <p class="small muted">BMI {bmi(d.currentKg, p.heightCm).toFixed(1)} · Maintenance about {f.tdee} kcal · Minimum {f.floor} kcal · Water {(d.targets.waterMl / 1000).toFixed(1)} L</p>
      </Card>

      {showChoice && (
        <Card title="Which plan?">
          <div class="seg" role="radiogroup" aria-label="Choose plan">
            <button type="button" role="radio" aria-checked={p.choice === 'realistic'} class={p.choice === 'realistic' ? 'on' : ''} onClick={() => setChoice('realistic')}><b>Realistic</b><span>{f.realistic.intake} kcal</span></button>
            <button type="button" role="radio" aria-checked={p.choice === 'goal'} class={p.choice === 'goal' ? 'on' : ''} onClick={() => setChoice('goal')}><b>Your goal</b><span>{f.goal.intake} kcal</span></button>
          </div>
          {p.choice === 'goal' && <div class="banner warn small"><b>Risks</b><ul class="bullets">{f.risks.map((r) => <li key={r}>{r}</li>)}</ul></div>}
        </Card>
      )}

      <Card title="Your diet" right={<a class="small" href="#/settings">Change</a>}>
        <div class="chips">
          {(dietNames.length ? dietNames : ['No specific diet']).map((n) => <span class="chip on static" key={n}>{n}</span>)}
        </div>
        {restrictions.length > 0 && <p class="small muted">Avoiding: {restrictions.join(', ')}</p>}
      </Card>

      <Card title="Meal ideas" right={<button class="ghost small" onClick={() => setSeed(seed + 1)}>Shuffle</button>}>
        {meal.note && <p class="small muted">{meal.note}</p>}
        {meal.items.length === 0 && <p class="small muted">No foods fit your diet and allergies in the food list yet. Add foods you eat with "Describe it" on the Food screen.</p>}
        {(['b', 'l', 'd', 's'] as const).map((m) => {
          const items = meal.items.filter((i) => i.meal === m);
          if (!items.length) return null;
          return (
            <div class="meal" key={m}>
              <div class="meal-title">{MEAL_LABEL[m]}</div>
              {items.map((i) => (
                <div class="meal-row" key={i.food.id + i.meal}>
                  <div class="meal-name"><b>{i.food.name}</b><span class="muted small">{i.servings} × {i.food.servingLabel}</span></div>
                  <div class="meal-meta"><span>{i.kcal} kcal</span><span class="muted small">{i.protein} g protein</span></div>
                </div>
              ))}
            </div>
          );
        })}
        <div class="meal-total">
          <div class="row between"><b>Total</b><b>{meal.kcal} kcal</b></div>
          <div class="row between small muted"><span>Protein · carbs · fat</span><span>{meal.protein} g · {meal.carbs} g · {meal.fat} g</span></div>
        </div>
        <p class="small muted">Swap foods freely. Aim for the calorie and protein numbers.</p>
      </Card>

      <Card title="Best protein sources for you">
        <div class="list">
          {topProtein.map((x) => (
            <div class="item" key={x.id}><span>{x.name}</span><span class="muted nowrap">{Math.round((x.p * x.servingG) / 100)} g per {x.servingLabel}</span></div>
          ))}
          {!topProtein.length && <p class="small muted">Nothing in the list fits your restrictions. Add foods with "Describe it".</p>}
        </div>
      </Card>
    </div>
  );
}
