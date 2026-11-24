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
        <p class="small muted" style="margin:8px 0 0">BMI {bmi(d.currentKg, p.heightCm).toFixed(1)} ({bmiCategory(bmi(d.currentKg, p.heightCm))}). Estimated maintenance {f.tdee} kcal. Minimum I'll ever plan: {f.floor} kcal. Protein is based on an adjusted body weight, as is usual for higher body weights, and carbs/fat are just the leftover calories.</p>
      </Card>

      {showChoice && (
        <Card title="Which plan?">
          <p class="small muted">You can switch any time. The tracker, targets and projection follow the one you choose.</p>
          <div class="grid2">
            <button class={p.choice === 'realistic' ? '' : 'ghost'} onClick={() => setChoice('realistic')}>Realistic<br /><span class="small">{f.realistic.intake} kcal</span></button>
            <button class={p.choice === 'goal' ? '' : 'ghost'} onClick={() => setChoice('goal')}>Your goal<br /><span class="small">{f.goal.intake} kcal</span></button>
          </div>
          {p.choice === 'goal' && <div class="banner warn small"><b>Risks:</b><ul style="margin:4px 0 0;padding-left:18px">{f.risks.map((r) => <li key={r}>{r}</li>)}</ul></div>}
        </Card>
      )}

      <Card title={`Budget meal ideas (${d.region.name})`} right={<span class="small muted">{cur}{p.budgetPerDay}/day</span>}>
        <p class="small muted" style="margin:0 0 6px">{meal.note}</p>
        {(['b', 'l', 'd', 's'] as const).map((m) => {
          const items = meal.items.filter((i) => i.meal === m);
          if (!items.length) return null;
          return (
            <div key={m} style="margin-bottom:8px"><b class="small">{MEAL_LABEL[m]}</b>
              {items.map((i) => (
                <div class="row between small" key={i.food.id + i.meal}><span>{i.servings}× {i.food.servingLabel} {i.food.name}{i.food.local ? ` (${i.food.local})` : ''}</span><span class="muted">{i.kcal} kcal · {cur}{i.cost.toFixed(0)}</span></div>
              ))}
            </div>
          );
        })}
        <div class="row between"><b>{meal.kcal} kcal · {meal.protein} g protein</b><b>{cur}{meal.cost.toFixed(0)}</b></div>
        <Bar value={meal.cost} max={p.budgetPerDay} tone={meal.withinBudget ? undefined : 'bad'} />
        <p class="small muted" style="margin:6px 0 0">Add your cooking oil, and season to taste. Prices are estimates.</p>
        <button class="soft small" style="margin-top:8px" onClick={() => setPricing(!pricing)}>{pricing ? 'Hide prices' : 'Edit food prices'}</button>
        {pricing && (
          <div class="list" style="margin-top:8px">
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
        <ul class="small" style="margin:0;padding-left:18px">
          {[...d.region.foods].filter((x) => x.p >= 7 && ['protein', 'dairy'].includes(x.cat)).sort((a, b) => d.priceOf(a) / a.p - d.priceOf(b) / b.p).slice(0, 5).map((x) => (
            <li key={x.id}>{x.name}: {cur}{((d.priceOf(x) / x.p) * 10).toFixed(1)} per 10 g protein</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
