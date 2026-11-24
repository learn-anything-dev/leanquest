import { useMemo, useState } from 'preact/hooks';
import { addDays, formatShort, today } from '../../core/dates';
import { MEAL_LABEL, excluded, sumEntries } from '../../core/nutrition';
import type { Food, Meal } from '../../core/types';
import type { Derived } from '../../store/derive';
import { addCustomFood, addFood, addQuickKcal, removeFood, setFoodDone } from '../../store/actions';
import { dayOf, uid, type AppState } from '../../store/store';
import { Bar, Card, Chips, useToast, Toast } from '../common';

const MEALS: Meal[] = ['b', 'l', 'd', 's'];
function defaultMeal(): Meal {
  const h = new Date().getHours();
  return h < 10 ? 'b' : h < 15 ? 'l' : h < 18 ? 's' : 'd';
}

export function FoodScreen({ s, d }: { s: AppState; d: Derived }) {
  const [date, setDate] = useState(today());
  const [q, setQ] = useState('');
  const [meal, setMeal] = useState<Meal>(defaultMeal());
  const [pick, setPick] = useState<Food | null>(null);
  const [servings, setServings] = useState(1);
  const [grams, setGrams] = useState<number | null>(null);
  const [quick, setQuick] = useState(false);
  const [custom, setCustom] = useState(false);
  const [toast, say] = useToast();
  const log = dayOf(s, date);
  const t = sumEntries(log.food);
  const cur = d.region.currency;

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = d.foods;
    if (!term) {
      const recents = s.recentFoodIds.map((id) => all.find((f) => f.id === id)).filter(Boolean) as Food[];
      return { label: recents.length ? 'Recent' : 'Suggestions', list: recents.length ? recents : all.filter((f) => f.cat !== 'treat').slice(0, 10) };
    }
    return { label: 'Results', list: all.filter((f) => `${f.name} ${f.local ?? ''}`.toLowerCase().includes(term)).slice(0, 25) };
  }, [q, d.foods, s.recentFoodIds]);

  const g = grams ?? Math.round((pick?.servingG ?? 100) * servings);
  const preview = pick ? { kcal: Math.round((pick.kcal * g) / 100), p: Math.round((pick.p * g) / 10) / 10, cost: (d.priceOf(pick) * g) / 100 } : null;
  const diets = (f: Food) => excluded(f, d.profile);

  return (
    <div class="stack">
      <div class="topbar">
        <h1 style="margin:0">Food</h1>
        <div class="row">
          <button class="ghost small" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>‹</button>
          <b>{date === today() ? 'Today' : formatShort(date)}</b>
          <button class="ghost small" aria-label="Next day" disabled={date >= today()} onClick={() => setDate(addDays(date, 1))}>›</button>
        </div>
      </div>

      <Card>
        <div class="row between"><b>{t.kcal} / {d.targets.kcal} kcal</b><span class="small muted">{Math.round(t.p)}g protein · {Math.round(t.c)}g carbs · {Math.round(t.f)}g fat</span></div>
        <Bar value={t.kcal} max={d.targets.kcal} tone={t.kcal > d.targets.kcal * 1.05 ? 'warn' : undefined} />
        <p class="small muted" style="margin:6px 0 0">Protein goal {d.targets.proteinG}g (at least {d.targets.proteinMinG}g) · Spent {cur}{t.cost.toFixed(0)} of {cur}{d.profile.budgetPerDay}</p>
      </Card>

      {!pick && !quick && !custom && (
        <Card title="Add food">
          <Chips<Meal> options={MEALS.map((m) => ({ id: m, label: MEAL_LABEL[m] }))} value={meal} onChange={setMeal} />
          <input type="search" placeholder="Search (e.g. itlog, rice, chicken)" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} style="margin-top:10px" aria-label="Search foods" />
          <p class="small muted" style="margin:8px 0 2px">{results.label}</p>
          <div class="list">
            {results.list.map((f) => (
              <div class="item" key={f.id}>
                <div>
                  <b>{f.name}</b>{f.local && f.local !== f.name ? <span class="muted"> · {f.local}</span> : null}
                  <div class="small muted">{f.servingLabel}: {Math.round((f.kcal * f.servingG) / 100)} kcal · {Math.round((f.p * f.servingG) / 100)}g protein{diets(f) ? ' · ⚠️ conflicts with your diet' : ''}</div>
                </div>
                <button class="small" onClick={() => { setPick(f); setServings(1); setGrams(null); }}>Add</button>
              </div>
            ))}
            {!results.list.length && <p class="muted small">No match. Add it as a custom food or quick calories below.</p>}
          </div>
          <div class="row wrap" style="margin-top:10px">
            <button class="soft small" onClick={() => setQuick(true)}>⚡ Quick calories</button>
            <button class="soft small" onClick={() => setCustom(true)}>＋ Custom food</button>
          </div>
        </Card>
      )}

      {pick && preview && (
        <Card title={pick.name}>
          <div class="row">
            <div class="grow"><label class="f" for="sv">Servings <small>({pick.servingLabel})</small></label>
              <input id="sv" type="number" inputMode="decimal" step="0.5" min="0.25" value={servings} onInput={(e) => { setServings(+(e.target as HTMLInputElement).value); setGrams(null); }} /></div>
            <div class="grow"><label class="f" for="gr">or grams</label>
              <input id="gr" type="number" inputMode="numeric" value={g} onInput={(e) => setGrams(+(e.target as HTMLInputElement).value)} /></div>
          </div>
          <div class="banner info">≈ <b>{preview.kcal} kcal</b> · {preview.p}g protein · {cur}{preview.cost.toFixed(1)}</div>
          {pick.cat === 'fat' && <p class="small muted">Oil adds up fast: 1 tsp ≈ 44 kcal. Measure it!</p>}
          <div class="row">
            <button class="ghost grow" onClick={() => setPick(null)}>Cancel</button>
            <button class="grow" disabled={!(g > 0)} onClick={() => { addFood(date, pick, g, meal, d.priceOf(pick)); say(`Added ${pick.name}`); setPick(null); setQ(''); }}>Add to {MEAL_LABEL[meal]}</button>
          </div>
        </Card>
      )}

      {quick && <QuickKcal onClose={() => setQuick(false)} onAdd={(n, k) => { addQuickKcal(date, n, k, meal); say('Added'); setQuick(false); }} />}
      {custom && <CustomFood region={cur} onClose={() => setCustom(false)} onSave={(f) => { addCustomFood(f); say('Saved. Find it in search'); setCustom(false); }} />}

      {MEALS.map((m) => {
        const items = log.food.filter((e) => e.meal === m);
        if (!items.length) return null;
        return (
          <Card key={m} title={MEAL_LABEL[m]} right={<span class="small muted">{items.reduce((a, e) => a + e.kcal, 0)} kcal</span>}>
            <div class="list">
              {items.map((e) => (
                <div class="item" key={e.id}>
                  <div><b>{e.name}</b><div class="small muted">{e.grams ? `${e.grams} g · ` : ''}{e.kcal} kcal{e.p ? ` · ${e.p}g P` : ''}</div></div>
                  <button class="ghost small" aria-label={`Remove ${e.name}`} onClick={() => removeFood(date, e.id)}>✕</button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {log.food.length > 0 && (
        <label class="row card" style="gap:12px"><input type="checkbox" style="width:26px;min-height:26px" checked={!!log.foodDone} onChange={(e) => setFoodDone(date, (e.target as HTMLInputElement).checked)} /> <span>I've logged everything I ate this day <span class="small muted">(helps me learn your real calorie burn)</span></span></label>
      )}
      <Toast msg={toast} />
    </div>
  );
}

function QuickKcal({ onAdd, onClose }: { onAdd: (name: string, kcal: number) => void; onClose: () => void }) {
  const [n, setN] = useState('');
  const [k, setK] = useState('');
  return (
    <Card title="Quick calories">
      <label class="f" for="qn">What was it?</label>
      <input id="qn" value={n} onInput={(e) => setN((e.target as HTMLInputElement).value)} placeholder="e.g. Birthday cake slice" />
      <label class="f" for="qk">Calories (estimate is fine)</label>
      <input id="qk" type="number" inputMode="numeric" value={k} onInput={(e) => setK((e.target as HTMLInputElement).value)} />
      <div class="row" style="margin-top:10px"><button class="ghost grow" onClick={onClose}>Cancel</button><button class="grow" disabled={!(+k > 0)} onClick={() => onAdd(n.trim() || 'Quick add', +k)}>Add</button></div>
    </Card>
  );
}

function CustomFood({ onSave, onClose, region }: { onSave: (f: Food) => void; onClose: () => void; region: string }) {
  const [v, setV] = useState({ name: '', kcal: '', p: '', c: '', f: '', serv: '100', label: '1 serving', price: '' });
  const set = (k: keyof typeof v) => (e: Event) => setV((x) => ({ ...x, [k]: (e.target as HTMLInputElement).value }));
  const ok = v.name.trim() && +v.kcal >= 0 && v.kcal !== '' && +v.serv > 0;
  return (
    <Card title="Custom food">
      <p class="small muted">Enter values <b>per 100 g</b> (from the label), and what one serving is.</p>
      <label class="f" for="cn">Name</label><input id="cn" value={v.name} onInput={set('name')} />
      <div class="grid2">
        <div><label class="f">kcal / 100 g</label><input type="number" inputMode="decimal" value={v.kcal} onInput={set('kcal')} /></div>
        <div><label class="f">Protein g</label><input type="number" inputMode="decimal" value={v.p} onInput={set('p')} /></div>
        <div><label class="f">Carbs g</label><input type="number" inputMode="decimal" value={v.c} onInput={set('c')} /></div>
        <div><label class="f">Fat g</label><input type="number" inputMode="decimal" value={v.f} onInput={set('f')} /></div>
        <div><label class="f">Serving (g)</label><input type="number" inputMode="decimal" value={v.serv} onInput={set('serv')} /></div>
        <div><label class="f">Serving name</label><input value={v.label} onInput={set('label')} /></div>
      </div>
      <label class="f">Price per 100 g ({region}) <small>(optional)</small></label><input type="number" inputMode="decimal" value={v.price} onInput={set('price')} />
      <div class="row" style="margin-top:10px"><button class="ghost grow" onClick={onClose}>Cancel</button>
        <button class="grow" disabled={!ok} onClick={() => onSave({ id: `custom-${uid()}`, name: v.name.trim(), cat: 'carb', kcal: +v.kcal, p: +v.p || 0, c: +v.c || 0, f: +v.f || 0, servingG: +v.serv, servingLabel: v.label || '1 serving', price100: +v.price || 0, meals: ['b', 'l', 'd', 's'] })}>Save</button></div>
    </Card>
  );
}
