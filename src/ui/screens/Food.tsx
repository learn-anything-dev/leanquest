import { useMemo, useState } from 'preact/hooks';
import { addDays, formatShort, today } from '../../core/dates';
import { estimateFood, estimateToFood, suggestDishes, type Size } from '../../core/foodEstimator';
import { MEAL_LABEL, excluded, excludedReason, sumEntries } from '../../core/nutrition';
import type { Food, Meal } from '../../core/types';
import { DISH_CATEGORIES } from '../../data/dishes';
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
  const [mode, setMode] = useState<'search' | 'estimate' | 'quick'>('search');
  const [toast, say] = useToast();
  const log = dayOf(s, date);
  const t = sumEntries(log.food);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = d.foods;
    if (!term) {
      const recents = s.recentFoodIds.map((id) => all.find((f) => f.id === id)).filter(Boolean) as Food[];
      return { label: recents.length ? 'Recent' : 'Suggestions', list: recents.length ? recents : all.filter((f) => f.cat !== 'treat' && !excluded(f, d.profile)).slice(0, 10) };
    }
    return { label: 'Results', list: all.filter((f) => f.name.toLowerCase().includes(term)).slice(0, 25) };
  }, [q, d.foods, s.recentFoodIds, d.profile]);

  const g = grams ?? Math.round((pick?.servingG ?? 100) * servings);
  const preview = pick ? { kcal: Math.round((pick.kcal * g) / 100), p: Math.round((pick.p * g) / 10) / 10 } : null;
  const conflict = (f: Food) => excludedReason(f, d.profile);

  return (
    <div class="stack">
      <div class="topbar">
        <h1>Food</h1>
        <div class="row">
          <button class="ghost small" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>‹</button>
          <b>{date === today() ? 'Today' : formatShort(date)}</b>
          <button class="ghost small" aria-label="Next day" disabled={date >= today()} onClick={() => setDate(addDays(date, 1))}>›</button>
        </div>
      </div>

      <Card>
        <div class="daysum"><div class="kpi"><b>{t.kcal} <small>/ {d.targets.kcal} kcal</small></b></div><span class="small muted">{Math.round(t.p)} g protein · {Math.round(t.c)} g carbs · {Math.round(t.f)} g fat</span></div>
        <Bar value={t.kcal} max={d.targets.kcal} tone={t.kcal > d.targets.kcal * 1.05 ? 'warn' : undefined} />
        <p class="small muted">Protein goal {d.targets.proteinG} g</p>
      </Card>

      {!pick && mode === 'search' && (
        <Card title="Add food">
          <Chips<Meal> fit options={MEALS.map((m) => ({ id: m, label: MEAL_LABEL[m] }))} value={meal} onChange={setMeal} />
          <input type="search" placeholder="Search foods" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} aria-label="Search foods" />
          <p class="small muted">{results.label}</p>
          <div class="list">
            {results.list.map((f) => (
              <div class="item" key={f.id}>
                <div>
                  <b>{f.name}</b>
                  <div class="small muted">{f.servingLabel}: {Math.round((f.kcal * f.servingG) / 100)} kcal · {Math.round((f.p * f.servingG) / 100)}g protein{conflict(f) ? ' · conflicts with your diet or allergies' : ''}</div>
                </div>
                <button class="small" onClick={() => { setPick(f); setServings(1); setGrams(null); }}>Add</button>
              </div>
            ))}
            {!results.list.length && <p class="muted small">Not in the list? Describe it and I will estimate the calories.</p>}
          </div>
          <div class="row wrap">
            <button class="soft" onClick={() => setMode('estimate')}>Can't find it? Describe it</button>
            <button class="soft" onClick={() => setMode('quick')}>Quick calories</button>
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
          <div class="banner info">≈ <b>{preview.kcal} kcal</b> · {preview.p}g protein</div>
          {conflict(pick) && <div class="banner warn small">This conflicts with your diet or allergies ({conflict(pick)}).</div>}
          <div class="row">
            <button class="ghost grow" onClick={() => setPick(null)}>Cancel</button>
            <button class="grow" disabled={!(g > 0)} onClick={() => { addFood(date, pick, g, meal); say(`Added ${pick.name}`); setPick(null); setQ(''); }}>Add to {MEAL_LABEL[meal]}</button>
          </div>
        </Card>
      )}

      {mode === 'quick' && <QuickKcal onClose={() => setMode('search')} onAdd={(n, k) => { addQuickKcal(date, n, k, meal); say('Added'); setMode('search'); }} />}
      {mode === 'estimate' && (
        <EstimatePanel
          initial={q}
          meal={meal}
          profile={d.profile}
          onClose={() => setMode('search')}
          onAdd={(food, grams2, save) => {
            if (save) addCustomFood(food);
            addFood(date, food, grams2, meal);
            say(`Added ${food.name}`);
            setMode('search');
            setQ('');
          }}
        />
      )}

      {MEALS.map((m) => {
        const items = log.food.filter((e) => e.meal === m);
        if (!items.length) return null;
        return (
          <Card key={m} title={MEAL_LABEL[m]} right={<span class="small muted">{items.reduce((a, e) => a + e.kcal, 0)} kcal</span>}>
            <div class="list">
              {items.map((e) => (
                <div class="item" key={e.id}>
                  <div><b>{e.name}</b><div class="small muted">{e.grams ? `${e.grams} g · ` : ''}{e.estimated ? '~' : ''}{e.kcal} kcal{e.p ? ` · ${e.p}g P` : ''}</div></div>
                  <button class="ghost small" aria-label={`Remove ${e.name}`} onClick={() => removeFood(date, e.id)}>Remove</button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {log.food.length > 0 && (
        <label class="row card"><input type="checkbox" checked={!!log.foodDone} onChange={(e) => setFoodDone(date, (e.target as HTMLInputElement).checked)} /> <span>Everything logged for this day</span></label>
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
      <div class="row"><button class="ghost grow" onClick={onClose}>Cancel</button><button class="grow" disabled={!(+k > 0)} onClick={() => onAdd(n.trim() || 'Quick add', +k)}>Add</button></div>
    </Card>
  );
}

const SIZES: { id: Size; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Regular' },
  { id: 'large', label: 'Large' },
];

/** Type what you ate; the app works out the calories. No numbers needed. */
function EstimatePanel({ initial, meal, profile, onClose, onAdd }: {
  initial: string;
  meal: Meal;
  profile: Derived['profile'];
  onClose: () => void;
  onAdd: (food: Food, grams: number, save: boolean) => void;
}) {
  const [text, setText] = useState(initial);
  const [size, setSize] = useState<Size>('medium');
  const [category, setCategory] = useState<string>('');
  const [gramsStr, setGramsStr] = useState('');
  const [manual, setManual] = useState(false);
  const [mv, setMv] = useState({ kcal: '', p: '', c: '', f: '' });
  const grams = +gramsStr > 0 ? +gramsStr : undefined;

  const est = estimateFood(text, { size, grams, category: category || undefined });
  const needsCategory = text.trim().length > 1 && !est;
  const ideas = text.trim().length > 1 ? suggestDishes(text, 4) : [];
  const food = est ? estimateToFood(est, `custom-${uid()}`) : null;
  const clash = food ? excludedReason(food, profile) : null;
  const confLabel = est ? (est.confidence === 'high' ? 'Good match' : est.confidence === 'medium' ? 'Reasonable estimate' : 'Rough estimate') : '';

  const manualFood: Food | null = manual && +mv.kcal > 0 && text.trim()
    ? { id: `custom-${uid()}`, name: text.trim(), cat: 'carb', kcal: +mv.kcal, p: +mv.p || 0, c: +mv.c || 0, f: +mv.f || 0, servingG: 100, servingLabel: '100 g', meals: ['b', 'l', 'd', 's'] }
    : null;

  return (
    <Card title="Describe what you ate">
      <label class="f" for="est-text">What did you eat or drink?</label>
      <input id="est-text" value={text} autoFocus placeholder="e.g. chicken adobo with rice, 2 slices of pizza, milk tea" onInput={(e) => { setText((e.target as HTMLInputElement).value); setCategory(''); }} />
      {ideas.length > 0 && !est?.matched.length && <div class="chips">{ideas.map((x) => <button type="button" class="chip" key={x.name} onClick={() => setText(x.name)}>{x.name}</button>)}</div>}

      {needsCategory && (
        <div>
          <label class="f">I do not recognise that. What is it mostly?</label>
          <div class="chips">{DISH_CATEGORIES.map((c) => <button type="button" key={c.id} class={category === c.id ? 'chip on' : 'chip'} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.name}</button>)}</div>
        </div>
      )}

      {est && food && (
        <>
          <div>
            <label class="f">How big was it?</label>
            <Chips<Size> fit={3} options={SIZES} value={size} onChange={(v) => { setSize(v); setGramsStr(''); }} />
            <p class="small muted">{size === 'medium' ? 'A regular portion' : size === 'small' ? 'About 30% smaller than regular' : 'About 40% bigger than regular'} · {Math.round(est.grams)} g</p>
          </div>
          <div class="estimate">
            <div class="estimate-kcal"><b>{est.kcal}</b><span>kcal</span></div>
            <div class="estimate-macros"><span><b>{Math.round(est.p)} g</b> protein</span><span><b>{Math.round(est.c)} g</b> carbs</span><span><b>{Math.round(est.f)} g</b> fat</span></div>
          </div>
          <p class="small muted">{confLabel}: {est.matched.join(' + ')}. Real meals vary by about 25%.{est.note ? ` ${est.note}.` : ''}</p>
          {clash && <div class="banner warn small">This may conflict with your diet or allergies ({clash}).</div>}
          <details>
            <summary>Adjust the portion in grams</summary>
            <label class="f" for="est-g">Weight (g)</label>
            <input id="est-g" type="number" inputMode="numeric" value={gramsStr} placeholder={String(est.grams)} onInput={(e) => setGramsStr((e.target as HTMLInputElement).value)} />
          </details>
          <div class="row wrap">
            <button class="ghost grow" onClick={onClose}>Cancel</button>
            <button class="grow" onClick={() => onAdd(food, food.servingG, false)}>Add to {MEAL_LABEL[meal]}</button>
          </div>
          <button class="soft block" onClick={() => onAdd(food, food.servingG, true)}>Add and save for next time</button>
        </>
      )}

      {!est && (
        <>
          <details open={manual} onToggle={(e) => setManual((e.target as HTMLDetailsElement).open)}>
            <summary>I know the numbers</summary>
            <div class="grid2">
              <div><label class="f" for="mv-k">kcal per 100 g</label><input id="mv-k" type="number" inputMode="decimal" value={mv.kcal} onInput={(e) => setMv({ ...mv, kcal: (e.target as HTMLInputElement).value })} /></div>
              <div><label class="f" for="mv-p">Protein g</label><input id="mv-p" type="number" inputMode="decimal" value={mv.p} onInput={(e) => setMv({ ...mv, p: (e.target as HTMLInputElement).value })} /></div>
              <div><label class="f" for="mv-c">Carbs g</label><input id="mv-c" type="number" inputMode="decimal" value={mv.c} onInput={(e) => setMv({ ...mv, c: (e.target as HTMLInputElement).value })} /></div>
              <div><label class="f" for="mv-f">Fat g</label><input id="mv-f" type="number" inputMode="decimal" value={mv.f} onInput={(e) => setMv({ ...mv, f: (e.target as HTMLInputElement).value })} /></div>
            </div>
          </details>
          <div class="row">
            <button class="ghost grow" onClick={onClose}>Cancel</button>
            <button class="grow" disabled={!manualFood} onClick={() => manualFood && onAdd(manualFood, 100, true)}>Add 100 g</button>
          </div>
        </>
      )}
    </Card>
  );
}
