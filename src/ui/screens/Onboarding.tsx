import { useState } from 'preact/hooks';
import { bmi, bmiCategory, referenceWeight } from '../../core/calc';
import { today } from '../../core/dates';
import { buildFeasibility, type PlanDetail } from '../../core/plan';
import type { AbilityId, Activity, Equipment, Limitation, PlanChoice, Profile, Sex, StyleId } from '../../core/types';
import { startingStates } from '../../data/exercises';
import { REGIONS, getRegion } from '../../data/regions';
import { update } from '../../store/store';
import { Chips } from '../common';

const LB = 2.20462;
const STEPS = ['Welcome', 'About you', 'Safety', 'Your day', 'Exercise', 'Goal', 'Food', 'Ready'];

const ACTIVITY: { id: Activity; label: string; hint: string }[] = [
  { id: 'sedentary', label: 'Mostly sitting', hint: 'Desk, school, or at home most of the day' },
  { id: 'light', label: 'Lightly active', hint: 'Some walking, chores, standing work' },
  { id: 'moderate', label: 'Active', hint: 'On your feet much of the day, or regular exercise' },
  { id: 'active', label: 'Very active', hint: 'Physical job plus regular exercise' },
];

const STYLES: { id: StyleId; label: string }[] = [
  { id: 'walking', label: 'Walking' },
  { id: 'dance', label: 'Dancing / Zumba' },
  { id: 'strength', label: 'Strength (bodyweight)' },
  { id: 'stretch', label: 'Stretching / yoga' },
  { id: 'intervals', label: '⏱Short intervals' },
  { id: 'sports', label: 'Sports / games' },
  { id: 'swim', label: 'Swimming' },
];

const ABILITIES: { id: AbilityId; label: string }[] = [
  { id: 'sitStand', label: 'Stand up from a chair without using my hands' },
  { id: 'wallPushup', label: 'Do 10 push-ups against a wall' },
  { id: 'kneePushup', label: 'Do 5 push-ups on my knees' },
  { id: 'floorGetUp', label: 'Get down to the floor and back up on my own' },
  { id: 'plank', label: 'Hold a forearm plank (knees ok) for 20 seconds' },
  { id: 'walk30', label: 'Walk 30 minutes without stopping' },
  { id: 'stairs', label: 'Climb two flights of stairs without a long rest' },
];

const ALLERGENS = [
  { id: 'egg', label: 'Egg' }, { id: 'fish', label: 'Fish' }, { id: 'nuts', label: 'Peanuts / nuts' }, { id: 'dairy', label: 'Dairy' },
  { id: 'soy', label: 'Soy' }, { id: 'gluten', label: 'Gluten' }, { id: 'shellfish', label: 'Shellfish' },
];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function planCard(p: PlanDetail, sel: boolean, onPick: () => void, goalWeeks: number, goalKg: number, startKg: number, units: 'metric' | 'imperial') {
  const disp = (kg: number) => (units === 'imperial' ? `${(kg * LB).toFixed(0)} lb` : `${kg.toFixed(1)} kg`);
  const weeks = p.daysToGoal !== null ? Math.ceil(p.daysToGoal / 7) : null;
  return (
    <div class={`plan ${sel ? 'sel' : ''}`} onClick={onPick} role="radio" aria-checked={sel} tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick()}>
      <div class="row between">
        <h3>{p.title}</h3>
        {sel && <span class="pill">Selected</span>}
      </div>
      <div class="big">{p.intake} kcal/day</div>
      <p class="small muted">{p.atFloor ? 'Lowest intake the app plans.' : `${p.deficit} kcal below maintenance.`}{p.extraSteps ? ` About ${p.extraSteps.toLocaleString()} steps a day.` : ''}</p>
      <ul class="bullets small">
        <li>By week {goalWeeks}: about <b>{disp(startKg - p.projectedLossKg)}</b> (lose ~{disp(p.projectedLossKg)}, about {p.pctPerWeek.toFixed(1)}% of body weight a week)</li>
        <li>{weeks ? <>Reaches {disp(goalKg)} in about <b>{weeks} weeks</b> (~{(weeks / 4.33).toFixed(0)} months)</> : <>Does not reach {disp(goalKg)} within 2 years at this intake</>}</li>
      </ul>
    </div>
  );
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Profile>({
    name: '', units: 'metric', sex: 'unspecified', age: 28, heightCm: 160, startWeightKg: 75, goalWeightKg: 68, goalWeeks: 12,
    activity: 'sedentary', baselineSteps: 3000, currentActivities: [], currentMinutesPerWeek: 0, comfortable: ['walking'], abilities: [],
    equipment: 'none', limitations: [], region: 'ph', budgetPerDay: 200, halal: false, vegetarian: false, allergens: [], hotClimate: true,
    startDate: today(), choice: 'realistic', screening: { under18: false, pregnant: false, eatingDisorder: false, medical: false },
  });
  const [ft, setFt] = useState(5);
  const [inch, setInch] = useState(3);
  const [touched, setTouched] = useState({ height: false, weight: false, goal: false });
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setD((x) => ({ ...x, [k]: v }));
  const imp = d.units === 'imperial';
  const wDisp = (kg: number) => (imp ? Math.round(kg * LB * 10) / 10 : Math.round(kg * 10) / 10);
  const wParse = (v: number) => (imp ? v / LB : v);
  const region = getRegion(d.region);

  const goalBmi = bmi(d.goalWeightKg, d.heightCm);
  const startBmi = bmi(d.startWeightKg, d.heightCm);
  const feas = buildFeasibility(d);
  const blocked = d.screening.under18 || d.screening.pregnant || d.screening.eatingDisorder;

  const errors: string[] = [];
  if (step === 1) {
    if (d.age < 10 || d.age > 100) errors.push('Enter an age between 10 and 100.');
    if (d.heightCm < 120 || d.heightCm > 220) errors.push('Height should be between 120 and 220 cm.');
    if (d.startWeightKg < 30 || d.startWeightKg > 300) errors.push('Weight looks out of range.');
  }
  if (step === 5) {
    if (!blocked && goalBmi < 18.5) errors.push(`That goal weight is below the healthy range for your height (BMI ${goalBmi.toFixed(1)}). The app will not plan toward it. Pick a goal of at least ${wDisp(referenceWeight(d.heightCm) * 18.5 / 25)} ${imp ? 'lb' : 'kg'}.`);
    if (d.goalWeeks < 2 || d.goalWeeks > 156) errors.push('Choose a time frame between 2 and 156 weeks.');
  }

  function finish() {
    const profile: Profile = { ...d, name: d.name.trim() || 'Friend', age: Math.round(d.age), startDate: today() };
    update((s) => {
      s.profile = profile;
      s.createdOn = today();
      s.weights = { ...s.weights, [today()]: profile.startWeightKg };
      s.progression = startingStates(profile.abilities, profile.equipment, profile.limitations);
      s.ackSafety = true;
    });
    onDone();
  }

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div class="wizard">
      <div class="steps" aria-label={`Step ${step + 1} of ${STEPS.length}`}>{STEPS.map((_, i) => <i key={i} class={i <= step ? 'on' : ''} />)}</div>

      {step === 0 && (
        <div class="stack">
          <div class="splash"><div class="label">LeanQuest</div><h1>Let's build your plan.</h1><p>A few quick questions so it fits your body, budget and day. About 3 minutes. Everything stays on your device.</p></div>
          <div class="card">
            <label class="f" for="nm">What should I call you?</label>
            <input id="nm" value={d.name} placeholder="Your name or nickname" onInput={(e) => set('name', (e.target as HTMLInputElement).value)} />
            <label class="f">Units</label>
            <Chips options={[{ id: 'metric', label: 'kg / cm' }, { id: 'imperial', label: 'lb / ft-in' }]} value={d.units} onChange={(v) => set('units', v as 'metric' | 'imperial')} />
          </div>
          <p class="disclaimer" style="text-align:left">Not medical advice. If you have a health condition, check with a doctor first.</p>
        </div>
      )}

      {step === 1 && (
        <div class="card">
          <h2>About you</h2>
          <label class="f">Sex <small>(for the calorie equation only)</small></label>
          <Chips<Sex> options={[{ id: 'female', label: 'Female' }, { id: 'male', label: 'Male' }, { id: 'unspecified', label: 'Prefer not to say' }]} value={d.sex} onChange={(v) => set('sex', v)} />
          <label class="f" for="age">Age</label>
          <input id="age" type="number" inputMode="numeric" value={d.age} onInput={(e) => { const a = +(e.target as HTMLInputElement).value; setD((x) => ({ ...x, age: a, screening: { ...x.screening, under18: a < 18 } })); }} />
          <label class="f" for="ht">Height {imp ? '' : <small>(cm)</small>}</label>
          {imp ? (
            <div class="grid2">
              <input id="ht" type="number" inputMode="numeric" value={ft} aria-label="feet" onInput={(e) => { const v = +(e.target as HTMLInputElement).value; setFt(v); set('heightCm', Math.round((v * 12 + inch) * 2.54 * 10) / 10); setTouched((t) => ({ ...t, height: true })); }} />
              <input type="number" inputMode="numeric" value={inch} aria-label="inches" onInput={(e) => { const v = +(e.target as HTMLInputElement).value; setInch(v); set('heightCm', Math.round((ft * 12 + v) * 2.54 * 10) / 10); setTouched((t) => ({ ...t, height: true })); }} />
            </div>
          ) : (
            <input id="ht" type="number" inputMode="decimal" step="0.1" value={d.heightCm} onInput={(e) => { set('heightCm', +(e.target as HTMLInputElement).value); setTouched((t) => ({ ...t, height: true })); }} />
          )}
          <label class="f" for="wt">Current weight <small>({imp ? 'lb' : 'kg'})</small></label>
          <input id="wt" type="number" inputMode="decimal" step="0.1" value={wDisp(d.startWeightKg)} onInput={(e) => { const kg = wParse(+(e.target as HTMLInputElement).value); setD((x) => ({ ...x, startWeightKg: kg, goalWeightKg: touched.goal ? x.goalWeightKg : Math.round(kg * 0.9 * 10) / 10 })); setTouched((t) => ({ ...t, weight: true })); }} />
          <div class="banner info small">BMI {startBmi.toFixed(1)} · {bmiCategory(startBmi)}. BMI is a rough screening number, so it ignores muscle, age and body shape. Your trend matters more than any label.</div>
        </div>
      )}

      {step === 2 && (
        <div class="card">
          <h2>A quick safety check</h2>
          
          {([['under18', 'I am under 18'], ['pregnant', 'I am pregnant or breastfeeding'], ['eatingDisorder', 'I have a history of an eating disorder'], ['medical', 'I have diabetes, heart or kidney disease, or take medicine that affects weight or diet']] as const).map(([k, l]) => (
            <label key={k} class="row" style="padding:8px 0"><input type="checkbox" checked={d.screening[k]} onChange={(e) => setD((x) => ({ ...x, screening: { ...x.screening, [k]: (e.target as HTMLInputElement).checked } }))} /> <span>{l}</span></label>
          ))}
          {d.screening.under18 && <div class="banner warn">Calorie deficits are not appropriate while you are still growing. I'll plan maintenance-level eating and focus on movement and healthy habits. Please talk to a doctor if you are worried about your weight.</div>}
          {d.screening.pregnant && <div class="banner warn">Dieting is not recommended in pregnancy or while breastfeeding. I'll set maintenance-level targets. Follow your doctor's or midwife's advice.</div>}
          {d.screening.eatingDisorder && <div class="banner bad">Counting calories and chasing a goal weight can be harmful with an eating-disorder history. I'll plan maintenance only and keep the tone gentle. Please work with a professional (doctor, dietitian or therapist) on any weight changes.</div>}
          {d.screening.medical && <div class="banner warn">Please check this plan with your doctor before starting, especially the calorie level and exercise.</div>}
        </div>
      )}

      {step === 3 && (
        <div class="stack">
          <div class="card">
            <h2>Your day today</h2>
            <label class="f">How active is a normal day for you?</label>
            <div class="stack">
              {ACTIVITY.map((a) => (
                <button type="button" key={a.id} class={`chip ${d.activity === a.id ? 'on' : ''}`} style="width:100%;text-align:left" aria-pressed={d.activity === a.id} onClick={() => set('activity', a.id)}>
                  <b>{a.label}</b><br /><span class="muted small">{a.hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div class="card">
            <h2>Are you already doing any exercise?</h2>
            <Chips<StyleId> multi options={STYLES} value={d.currentActivities} onChange={(v) => set('currentActivities', toggle(d.currentActivities, v))} />
            <label class="f" for="mins">About how many minutes per week in total?</label>
            <input id="mins" type="number" inputMode="numeric" min="0" value={d.currentMinutesPerWeek} onInput={(e) => set('currentMinutesPerWeek', Math.max(0, +(e.target as HTMLInputElement).value))} />
            <label class="f" for="steps">Roughly how many steps do you walk on a typical day? <small>(a guess is fine)</small></label>
            <input id="steps" type="number" inputMode="numeric" step="500" min="500" value={d.baselineSteps} onInput={(e) => set('baselineSteps', Math.max(500, +(e.target as HTMLInputElement).value))} />
          </div>
        </div>
      )}

      {step === 4 && (
        <div class="stack">
          <div class="card">
            <h2>What kinds of exercise do you enjoy or feel comfortable with?</h2>
            
            <Chips<StyleId> multi options={STYLES} value={d.comfortable} onChange={(v) => set('comfortable', toggle(d.comfortable, v))} />
          </div>
          <div class="card">
            <h2>What can you do right now?</h2>
            <p class="muted small">Sets where each movement starts.</p>
            {ABILITIES.map((a) => (
              <label key={a.id} class="row" style="padding:7px 0"><input type="checkbox" checked={d.abilities.includes(a.id)} onChange={() => set('abilities', toggle(d.abilities, a.id))} /> <span>{a.label}</span></label>
            ))}
          </div>
          <div class="card">
            <h2>Anything to work around?</h2>
            <Chips<Limitation> multi options={[{ id: 'knees', label: 'Sore knees' }, { id: 'back', label: 'Lower back' }, { id: 'wrists', label: 'Wrists' }, { id: 'shoulders', label: 'Shoulders' }]} value={d.limitations} onChange={(v) => set('limitations', toggle(d.limitations, v))} />
            <label class="f">What equipment do you have?</label>
            <Chips<Equipment> options={[{ id: 'none', label: 'None (bodyweight only)' }, { id: 'home', label: 'Home: dumbbells/bands' }, { id: 'gym', label: 'Gym access' }]} value={d.equipment} onChange={(v) => set('equipment', v)} />
          </div>
        </div>
      )}

      {step === 5 && (
        <div class="stack">
          <div class="card">
            <h2>Your goal</h2>
            <div class="grid2">
              <div>
                <label class="f" for="gw">Goal weight <small>({imp ? 'lb' : 'kg'})</small></label>
                <input id="gw" type="number" inputMode="decimal" step="0.1" value={wDisp(d.goalWeightKg)} onInput={(e) => { set('goalWeightKg', wParse(+(e.target as HTMLInputElement).value)); setTouched((t) => ({ ...t, goal: true })); }} />
              </div>
              <div>
                <label class="f" for="gwk">In how many weeks?</label>
                <input id="gwk" type="number" inputMode="numeric" value={d.goalWeeks} onInput={(e) => set('goalWeeks', Math.round(+(e.target as HTMLInputElement).value))} />
              </div>
            </div>
            <div class="chips">{[4, 8, 12, 16, 24, 36].map((w) => <button type="button" key={w} class={`chip ${d.goalWeeks === w ? 'on' : ''}`} onClick={() => set('goalWeeks', w)}>{w} wk</button>)}</div>
            <p class="small muted">Healthy range for your height: {wDisp(referenceWeight(d.heightCm) * 18.5 / 25)}–{wDisp(referenceWeight(d.heightCm))} {imp ? 'lb' : 'kg'}. Goal BMI would be {goalBmi.toFixed(1)}.</p>
            {errors.map((e) => <div class="banner bad" key={e}>{e}</div>)}
          </div>

          {!errors.length && feas.maintenanceOnly && <div class="banner warn">Based on your safety answers I'm planning <b>maintenance</b> ({feas.realistic.intake} kcal/day), with no deficit. You can still track food, water and training.</div>}

          {!errors.length && !feas.maintenanceOnly && d.goalWeightKg < d.startWeightKg && (
            <div class="card">
              <h2>Reality check</h2>
              <div class="grid3">
                <div class="kpi"><b>{(feas.neededLossKg * (imp ? LB : 1)).toFixed(1)} {imp ? 'lb' : 'kg'}</b><span>to lose</span></div>
                <div class="kpi"><b>{(feas.requiredKgPerWeek * (imp ? LB : 1)).toFixed(2)} {imp ? 'lb' : 'kg'}/wk</b><span>needed</span></div>
                <div class="kpi"><b>{feas.requiredPctPerWeek.toFixed(1)}%</b><span>of body weight / wk</span></div>
              </div>
              {feas.verdict === 'safe' && <div class="banner ok">A realistic pace (0.5–1% of body weight a week).</div>}
              {feas.verdict === 'fast' && <div class="banner warn">Faster than the usual 1% a week. Possible only at a low intake. See both plans below.</div>}
              {feas.verdict === 'unsafe' && <div class="banner bad">{feas.neededLossKg.toFixed(0)} kg in {d.goalWeeks} weeks needs about <b>{feas.requiredDeficit} kcal/day</b> below maintenance. Yours is about {feas.tdee}. That is not safe, and out of reach even at the lowest intake.</div>}
            </div>
          )}

          {!errors.length && !feas.maintenanceOnly && d.goalWeightKg < d.startWeightKg && (
            <div class="plans" role="radiogroup" aria-label="Choose your plan">
              {planCard(feas.realistic, d.choice === 'realistic', () => set('choice', 'realistic' as PlanChoice), d.goalWeeks, d.goalWeightKg, d.startWeightKg, d.units)}
              {feas.plansDiffer && planCard(feas.goal, d.choice === 'goal', () => set('choice', 'goal' as PlanChoice), d.goalWeeks, d.goalWeightKg, d.startWeightKg, d.units)}
              {feas.plansDiffer && d.choice === 'goal' && feas.risks.length > 0 && (
                <div class="banner warn">
                  <b>Risks</b>
                  <ul class="bullets">{feas.risks.map((r) => <li key={r}>{r}</li>)}</ul>
                  <p class="small">Never below {feas.floor} kcal/day, so this cannot reach the full goal on time. You can switch plans later.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 6 && (
        <div class="card">
          <h2>Food, place and budget</h2>
          <label class="f" for="rg">Where are you?</label>
          <select id="rg" value={d.region} onChange={(e) => { const r = getRegion((e.target as HTMLSelectElement).value); setD((x) => ({ ...x, region: r.id, budgetPerDay: r.budgetDefault })); }}>
            {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <label class="f" for="bd">Food budget per day <small>({region.currency})</small></label>
          <input id="bd" type="number" inputMode="decimal" min="0" value={d.budgetPerDay} onInput={(e) => set('budgetPerDay', Math.max(0, +(e.target as HTMLInputElement).value))} />
          <label class="f">Diet</label>
          <div class="chips">
            <button type="button" class={`chip ${d.halal ? 'on' : ''}`} aria-pressed={d.halal} onClick={() => set('halal', !d.halal)}>Halal (no pork)</button>
            <button type="button" class={`chip ${d.vegetarian ? 'on' : ''}`} aria-pressed={d.vegetarian} onClick={() => set('vegetarian', !d.vegetarian)}>Vegetarian</button>
            <button type="button" class={`chip ${d.hotClimate ? 'on' : ''}`} aria-pressed={d.hotClimate} onClick={() => set('hotClimate', !d.hotClimate)}>Hot climate / sweat a lot</button>
          </div>
          <label class="f">Allergies or foods to avoid</label>
          <Chips multi options={ALLERGENS} value={d.allergens} onChange={(v) => set('allergens', toggle(d.allergens, v))} />
        </div>
      )}

      {step === 7 && (
        <div class="stack">
          <div class="splash"><div class="label">Ready</div><h1>All set{d.name ? `, ${d.name}` : ''}.</h1><p>Here is your starting point.</p></div>
          <div class="card">
            <div class="grid2">
              <div class="kpi"><b>{(d.choice === 'goal' ? feas.goal : feas.realistic).intake}</b><span>kcal / day</span></div>
              <div class="kpi"><b>{startBmi.toFixed(1)}</b><span>starting BMI</span></div>
            </div>
            <ul class="small">
              <li>Plan: <b>{feas.maintenanceOnly ? 'Maintenance' : d.choice === 'goal' ? 'Your goal plan' : 'Realistic plan'}</b></li>
              <li>3 strength days a week plus cardio you enjoy ({STYLES.filter((x) => d.comfortable.includes(x.id) && x.id !== 'strength').slice(0, 3).map((x) => x.label.replace(/^\S+\s/, '')).join(', ') || 'walking'}).</li>
              <li>Food ideas for {region.name} within {region.currency}{d.budgetPerDay}/day.</li>
            </ul>
            <p class="small muted">Start by logging food and weighing in a few times this week.</p>
          </div>
          <button class="block" onClick={finish}>Start my journey</button>
        </div>
      )}

      {errors.length > 0 && step !== 5 && errors.map((e) => <div class="banner bad" key={e}>{e}</div>)}
      <div class="row between wizard-nav">
        <button class="ghost" onClick={back} disabled={step === 0}>Back</button>
        {step < STEPS.length - 1 && <button onClick={next} disabled={errors.length > 0}>Next</button>}
      </div>
    </div>
  );
}
