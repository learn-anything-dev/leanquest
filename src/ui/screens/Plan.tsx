import { useMemo, useState } from 'preact/hooks';
import { bmi, bmiCategory } from '../../core/calc';
import { MEAL_LABEL, planDay } from '../../core/nutrition';
import type { Derived } from '../../store/derive';
import { setChoice, setPrice } from '../../store/actions';
import type { AppState } from '../../store/store';
import { Card, Bar } from '../common';

export function PlanScreen({ s, d }: { s: AppState; d: Derived }) {
  const p = d.profile;
  const f = d.feas;
  const cur = d.region.currency;
  const [pricing, setPricing] = useState(false);
  const meal = useMemo(
    () => planDay(d.region.foods, d.targets.kcal, d.targets.proteinG, p.budgetPerDay, d.priceOf, p),
    [d.region, d.targets.kcal, d.targets.proteinG, p.budgetPerDay, s.priceOverrides, p.halal, p.vegetarian, p.allergens],
  );
  const showChoice = f.plansDiffer && !f.maintenanceOnly;

  return (
    <div class="stack">
      <h1>Plan</h1>
      <Card title="Your targets today">
        <div class="grid2">
          <div class="kpi"><b>{d.targets.kcal}</b><span>kcal / day</span></div>
          <div class="kpi"><b>{d.targets.proteinG} g</b><span>protein (min {d.targets.proteinMinG})</span></div>
          <div class="kpi"><b>{d.targets.carbG} g / {d.targets.fatG} g</b><span>carbs / fat (flexible)</span></div>
          <div class="kpi"><b>{(d.targets.waterMl / 1000).toFixed(1)} L</b><span>water</span></div>
        </div>
        <p class="small muted">BMI {bmi(d.currentKg, p.heightCm).toFixed(1)} · Maintenance about {f.tdee} kcal · Minimum {f.floor} kcal</p>
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

      <Card title={`Meal ideas`} right={<span class="small muted">{cur}{p.budgetPerDay}/day</span>}>
        {!meal.withinBudget || !meal.proteinMet ? <p class="small muted">{meal.note}</p> : null}
        {(['b', 'l', 'd', 's'] as const).map((m) => {
          const items = meal.items.filter((i) => i.meal === m);
          if (!items.length) return null;
          return (
            <div class="meal" key={m}>
              <div class="meal-title">{MEAL_LABEL[m]}</div>
              {items.map((i) => (
                <div class="meal-row" key={i.food.id + i.meal}>
                  <div class="meal-name"><b>{i.food.name}</b><span class="muted small">{i.servings} × {i.food.servingLabel}</span></div>
                  <div class="meal-meta"><span>{i.kcal} kcal</span><span class="muted small">{cur}{i.cost.toFixed(0)}</span></div>
                </div>
              ))}
            </div>
          );
        })}
        <div class="meal-total">
          <div class="row between"><b>Total</b><b>{meal.kcal} kcal · {meal.protein} g protein</b></div>
          <div class="row between small muted"><span>Cost</span><span>{cur}{meal.cost.toFixed(0)} of {cur}{p.budgetPerDay}</span></div>
          <Bar value={meal.cost} max={p.budgetPerDay} tone={meal.withinBudget ? undefined : 'bad'} />
        </div>
        <button class="soft small" onClick={() => setPricing(!pricing)}>{pricing ? 'Hide prices' : 'Edit food prices'}</button>
        {pricing && (
          <div class="list">
            {d.region.foods.filter((x) => x.cat !== 'treat' && x.cat !== 'drink').map((x) => (
              <div class="item" key={x.id}>
                <span class="small">{x.name}<br /><span class="muted">per {x.servingLabel}</span></span>
                <input style="width:90px" type="number" inputMode="decimal" step="0.1" value={Math.round((d.priceOf(x) * x.servingG) / 10) / 10} aria-label={`Price per serving of ${x.name}`}
                  onChange={(e) => { const v = +(e.target as HTMLInputElement).value; setPrice(x.id, v >= 0 ? (v / x.servingG) * 100 : null); }} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Cheap-protein cheat sheet">
        <div class="list">
          {[...d.region.foods].filter((x) => x.p >= 7 && ['protein', 'dairy'].includes(x.cat)).sort((a, b) => d.priceOf(a) / a.p - d.priceOf(b) / b.p).slice(0, 5).map((x) => (
            <div class="item" key={x.id}><span>{x.name}</span><span class="muted nowrap">{cur}{((d.priceOf(x) / x.p) * 10).toFixed(1)} / 10 g</span></div>
          ))}
        </div>
      </Card>
    </div>
  );
}
