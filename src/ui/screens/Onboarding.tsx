import { useState } from 'preact/hooks';
import { bmi, bmiCategory, referenceWeight } from '../../core/calc';
import { today } from '../../core/dates';
import { buildFeasibility, type PlanDetail } from '../../core/plan';
import { recommend } from '../../core/training';
import type { AbilityId, Activity, Equipment, Limitation, PlanChoice, Profile, Sex } from '../../core/types';
import { activityName, weeklyExerciseKcal } from '../../data/activities';
import { COUNTRIES, countryName, packFor } from '../../data/countries';
import { getDiet } from '../../data/diets';
import { startingStates } from '../../data/exercises';
import { getRegion } from '../../data/regions';
import { update } from '../../store/store';
import { Chips, Options } from '../common';
import { ActivityPicker, AllergyPicker, CurrentExercise, DietPicker, SafetyList, toggle } from '../pickers';

const LB = 2.20462;
const STEPS = ['Welcome', 'About you', 'Safety', 'Your day', 'Exercise now', 'Preferences', 'Your body', 'Goal', 'Food', 'Ready'];
const S = { goal: 7, food: 8, ready: 9 };

const ACTIVITY: { id: Activity; label: string; hint: string }[] = [
  { id: 'sedentary', label: 'Mostly sitting', hint: 'Desk, school, or at home most of the day' },
  { id: 'light', label: 'Lightly active', hint: 'Some walking, chores, standing work' },
  { id: 'moderate', label: 'Active', hint: 'On your feet much of the day' },
  { id: 'active', label: 'Very active', hint: 'Physical job, on the move all day' },
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

function detectCountry(): string {
  try {
    const region = (navigator.language || '').split('-')[1]?.toUpperCase();
    return COUNTRIES.some((c) => c.code === region) ? region : '';
  } catch {
    return '';
  }
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
  const [exercises, setExercises] = useState(false);
  const [d, setD] = useState<Profile>({
    name: '', units: 'metric', sex: 'unspecified', age: 28, heightCm: 160, startWeightKg: 75, goalWeightKg: 68, goalWeeks: 12,
    activity: 'sedentary', baselineSteps: 3000, currentExercise: [], currentMinutesPerWeek: 0, exerciseKcalPerDay: 0, comfortable: ['walk-brisk'], abilities: [],
    equipment: 'none', limitations: [], country: detectCountry(), region: 'global', diets: ['none'], hasAllergies: false, allergens: [], avoidFoods: [], hotClimate: true,
    startDate: today(), choice: 'realistic', screening: { under18: false, pregnant: false, eatingDisorder: false, medical: false, other: [] },
  });
  const [ft, setFt] = useState(5);
  const [inch, setInch] = useState(3);
  const [touched, setTouched] = useState({ height: false, weight: false, goal: false });
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setD((x) => ({ ...x, [k]: v }));
  const imp = d.units === 'imperial';
  const wDisp = (kg: number) => (imp ? Math.round(kg * LB * 10) / 10 : Math.round(kg * 10) / 10);
  const wParse = (v: number) => (imp ? v / LB : v);

  // Derived exercise numbers feed the plan maths everywhere below.
  const dd: Profile = {
    ...d,
    region: packFor(d.country),
    currentMinutesPerWeek: d.currentExercise.reduce((a, e) => a + e.minutes, 0),
    exerciseKcalPerDay: weeklyExerciseKcal(d.currentExercise, d.startWeightKg) / 7,
  };
  const region = getRegion(dd.region);
  const goalBmi = bmi(d.goalWeightKg, d.heightCm);
  const startBmi = bmi(d.startWeightKg, d.heightCm);
  const feas = buildFeasibility(dd);
  const blocked = d.screening.under18 || d.screening.pregnant || d.screening.eatingDisorder;

  const errors: string[] = [];
  if (step === 1) {
    if (d.age < 10 || d.age > 100) errors.push('Enter an age between 10 and 100.');
    if (d.heightCm < 120 || d.heightCm > 220) errors.push('Height should be between 120 and 220 cm.');
    if (d.startWeightKg < 30 || d.startWeightKg > 300) errors.push('Weight looks out of range.');
  }
  if (step === S.goal) {
    if (!blocked && goalBmi < 18.5) errors.push(`That goal weight is below the healthy range for your height (BMI ${goalBmi.toFixed(1)}). The app will not plan toward it. Pick a goal of at least ${wDisp(referenceWeight(d.heightCm) * 18.5 / 25)} ${imp ? 'lb' : 'kg'}.`);
    if (d.goalWeeks < 2 || d.goalWeeks > 156) errors.push('Choose a time frame between 2 and 156 weeks.');
  }
  if (step === S.food && !d.country) errors.push('Choose your country so I can pick the right foods.');

  function finish() {
    const profile: Profile = { ...dd, name: d.name.trim() || 'Friend', age: Math.round(d.age), startDate: today() };
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
  const dietNames = d.diets.filter((x) => x !== 'none').map((x) => getDiet(x)?.name).filter(Boolean).join(', ') || 'No specific diet';

  return (
    <div class="wizard">
      <div class="steps" aria-label={`Step ${step + 1} of ${STEPS.length}`}>{STEPS.map((_, i) => <i key={i} class={i <= step ? 'on' : ''} />)}</div>

      {step === 0 && (
        <div class="stack">
          <div class="splash"><div class="label">LeanQuest</div><h1>Let's build your plan.</h1><p>A few quick questions so it fits your body, diet and day. About 4 minutes. Everything stays on your device.</p></div>
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
          <Chips<Sex> fit={3} options={[{ id: 'female', label: 'Female' }, { id: 'male', label: 'Male' }, { id: 'unspecified', label: 'Prefer not to say' }]} value={d.sex} onChange={(v) => set('sex', v)} />
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
          <SafetyList value={d.screening} onChange={(s) => set('screening', s)} />
        </div>
      )}

      {step === 3 && (
        <div class="stack">
          <div class="card">
            <h2>Your day today</h2>
            <label class="f">Not counting exercise, how active is a normal day?</label>
            <Options<Activity> label="Daily activity" options={ACTIVITY} value={d.activity} onChange={(v) => set('activity', v)} />
          </div>
          <div class="card">
            <label class="f" for="steps">Roughly how many steps do you walk on a typical day? <small>(a guess is fine)</small></label>
            <input id="steps" type="number" inputMode="numeric" step="500" min="500" value={d.baselineSteps} onInput={(e) => set('baselineSteps', Math.max(500, +(e.target as HTMLInputElement).value))} />
          </div>
        </div>
      )}

      {step === 4 && (
        <div class="card">
          <h2>Are you already doing any exercise?</h2>
          <CurrentExercise
            entries={d.currentExercise}
            onChange={(e) => set('currentExercise', e)}
            weightKg={d.startWeightKg}
            active={exercises}
            onActive={setExercises}
          />
        </div>
      )}

      {step === 5 && (
        <div class="card">
          <h2>What exercise do you enjoy or feel comfortable with?</h2>
          <p class="muted small">Pick as many as you like. I build your cardio from these.</p>
          <ActivityPicker
            selected={d.comfortable}
            onToggle={(id) => set('comfortable', toggle(d.comfortable, id))}
            onAddCustom={(name) => { const id = `custom:${name}`; if (!d.comfortable.includes(id)) set('comfortable', [...d.comfortable, id]); }}
          />
          {d.comfortable.length > 0 && <p class="small muted">Selected: {d.comfortable.map(activityName).join(', ')}</p>}
        </div>
      )}

      {step === 6 && (
        <div class="stack">
          <div class="card">
            <h2>What can you do right now?</h2>
            <p class="muted small">Sets where each movement starts.</p>
            {ABILITIES.map((a) => (
              <label key={a.id} class="row"><input type="checkbox" checked={d.abilities.includes(a.id)} onChange={() => set('abilities', toggle(d.abilities, a.id))} /> <span>{a.label}</span></label>
            ))}
          </div>
          <div class="card">
            <h2>Anything to work around?</h2>
            <Chips<Limitation> multi options={[{ id: 'knees', label: 'Sore knees' }, { id: 'back', label: 'Lower back' }, { id: 'wrists', label: 'Wrists' }, { id: 'shoulders', label: 'Shoulders' }]} value={d.limitations} onChange={(v) => set('limitations', toggle(d.limitations, v))} />
            <label class="f">What equipment do you have?</label>
            <Options<Equipment> label="Equipment" options={[{ id: 'none', label: 'None', hint: 'Bodyweight only' }, { id: 'home', label: 'Home equipment', hint: 'Dumbbells or resistance bands' }, { id: 'gym', label: 'Gym access', hint: 'Machines and barbells' }]} value={d.equipment} onChange={(v) => set('equipment', v)} />
          </div>
        </div>
      )}

      {step === S.goal && (
        <div class="stack">
          <div class="card">
            <h2>Your goal</h2>
            <div class="grid2">
              <div>
                <label class="f" for="gw">Goal weight <small>({imp ? 'lb' : 'kg'})</small></label>
                <input id="gw" type="number" inputMode="decimal" step="0.1" value={wDisp(d.goalWeightKg)} onInput={(e) => { set('goalWeightKg', wParse(+(e.target as HTMLInputElement).value)); setTouched((t) => ({ ...t, goal: true })); }} />
              </div>
              <div>
                <label class="f" for="gwk">Weeks to goal</label>
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
                <div class="kpi"><b>{(feas.neededLossKg * (imp ? LB : 1)).toFixed(1)}</b><span>{imp ? 'lb' : 'kg'} to lose</span></div>
                <div class="kpi"><b>{(feas.requiredKgPerWeek * (imp ? LB : 1)).toFixed(2)}</b><span>{imp ? 'lb' : 'kg'} per week</span></div>
                <div class="kpi"><b>{feas.requiredPctPerWeek.toFixed(1)}%</b><span>of body weight per week</span></div>
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

      {step === S.food && (
        <div class="stack">
          <div class="card">
            <h2>Where are you?</h2>
            <label class="f" for="country">Country</label>
            <select id="country" value={d.country} onChange={(e) => set('country', (e.target as HTMLSelectElement).value)}>
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {d.country && <p class="small muted">Food list: {region.name}. {region.note}</p>}
            <label class="row"><input type="checkbox" checked={d.hotClimate} onChange={(e) => set('hotClimate', (e.target as HTMLInputElement).checked)} /> <span>I live in a hot climate or sweat a lot (more water)</span></label>
          </div>
          <div class="card">
            <h2>Do you follow a diet?</h2>
            <p class="muted small">Pick all that apply. Your meal ideas follow them.</p>
            <DietPicker value={d.diets} onChange={(v) => set('diets', v)} />
          </div>
          <div class="card">
            <h2>Allergies or foods to avoid</h2>
            <AllergyPicker hasAllergies={d.hasAllergies} allergens={d.allergens} avoidFoods={d.avoidFoods} onChange={(v) => setD((x) => ({ ...x, ...v }))} />
          </div>
        </div>
      )}

      {step === S.ready && (
        <div class="stack">
          <div class="splash"><div class="label">Ready</div><h1>All set{d.name ? `, ${d.name}` : ''}.</h1><p>Here is your starting point.</p></div>
          <div class="card">
            <div class="grid2">
              <div class="kpi"><b>{(d.choice === 'goal' ? feas.goal : feas.realistic).intake}</b><span>kcal / day</span></div>
              <div class="kpi"><b>{startBmi.toFixed(1)}</b><span>starting BMI</span></div>
            </div>
            <div class="list">
              <div class="item"><span class="muted">Plan</span><b>{feas.maintenanceOnly ? 'Maintenance' : d.choice === 'goal' ? 'Your goal plan' : 'Realistic plan'}</b></div>
              <div class="item"><span class="muted">Training</span><b class="right">{(() => { const r = recommend(dd, 1, 'Beginner'); return `${r.strengthDays} strength · ${r.cardioSessions} cardio`; })()}</b></div>
              <div class="item"><span class="muted">Steps</span><b class="right">{recommend(dd, 1, 'Beginner').steps.toLocaleString()} a day</b></div>
              <div class="item"><span class="muted">Food</span><b class="right">{countryName(d.country) || region.name}</b></div>
              <div class="item"><span class="muted">Diet</span><b class="right">{dietNames}</b></div>
            </div>
            <p class="small muted">Start by logging food and weighing in a few times this week.</p>
          </div>
          <button class="block" onClick={finish}>Start my journey</button>
        </div>
      )}

      {errors.length > 0 && step !== S.goal && errors.map((e) => <div class="banner bad" key={e}>{e}</div>)}
      <div class="row between wizard-nav">
        <button class="ghost" onClick={back} disabled={step === 0}>Back</button>
        {step < STEPS.length - 1 && <button onClick={next} disabled={errors.length > 0}>Next</button>}
      </div>
    </div>
  );
}
