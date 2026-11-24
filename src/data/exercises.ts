import type { AbilityId, Equipment, Limitation, PatternState, Profile, StyleId } from '../core/types';

export type Pattern = 'push' | 'squat' | 'hinge' | 'lunge' | 'pull' | 'core';
export type Kind = 'reps' | 'hold';

export interface Exercise {
  id: string;
  name: string;
  pattern: Pattern;
  kind: Kind;
  equip: Equipment; // minimum equipment needed
  cue: string;
  avoid?: Limitation[]; // limitations for which this exercise is skipped
  emoji: string;
}

const E = (
  id: string, name: string, pattern: Pattern, kind: Kind, equip: Equipment, cue: string, emoji: string, avoid?: Limitation[],
): Exercise => ({ id, name, pattern, kind, equip, cue, emoji, avoid });

/** Each ladder runs easiest -> hardest. Progression moves up when the current step feels easy at the top of its range. */
export const LADDERS: Record<Pattern, Exercise[]> = {
  push: [
    E('wall-pushup', 'Wall push-up', 'push', 'reps', 'none', 'Hands on a wall at chest height, body in a straight line, bend elbows to bring chest to the wall.', '🧱'),
    E('incline-pushup', 'Incline push-up (table/counter)', 'push', 'reps', 'none', 'Hands on a sturdy table or counter. Lower chest to the edge, keep your body straight.', '🪑', ['wrists']),
    E('knee-pushup', 'Knee push-up', 'push', 'reps', 'none', 'On hands and knees, hips in line with shoulders. Lower chest toward the floor.', '🧎', ['wrists']),
    E('pushup', 'Full push-up', 'push', 'reps', 'none', 'Hands under shoulders, body like a plank. Lower until chest is a fist from the floor.', '💪', ['wrists']),
    E('feet-pushup', 'Feet-elevated push-up', 'push', 'reps', 'none', 'Feet on a chair or step. Same form as a push-up, harder angle.', '🔥', ['wrists', 'shoulders']),
    E('archer-pushup', 'Archer push-up', 'push', 'reps', 'none', 'Wide hands. Lower toward one hand while the other arm stays straight, then alternate.', '🏹', ['wrists', 'shoulders']),
    E('db-press', 'Dumbbell bench/floor press', 'push', 'reps', 'home', 'Lie down, press two dumbbells (or water jugs) up over your chest.', '🏋️', ['shoulders']),
    E('bb-bench', 'Barbell bench press', 'push', 'reps', 'gym', 'Control the bar to mid-chest and press up. Use a spotter or safety arms.', '🏋️', ['shoulders']),
  ],
  squat: [
    E('sit-stand', 'Sit-to-stand (chair)', 'squat', 'reps', 'none', 'Sit on a chair, lean forward, stand up tall, sit back slowly. Hands on thighs if needed.', '🪑', ['knees']),
    E('box-squat', 'Squat to chair', 'squat', 'reps', 'none', 'Hips back, lightly touch the chair and stand. Knees track over toes.', '🪑', ['knees']),
    E('squat', 'Bodyweight squat', 'squat', 'reps', 'none', 'Feet shoulder-width, chest up, sit down and back, stand through your heels.', '🏋️', ['knees']),
    E('tempo-squat', 'Slow squat (3 s down)', 'squat', 'reps', 'none', 'Lower for 3 seconds, pause, stand. Time under tension makes it much harder.', '⏱️', ['knees']),
    E('bulgarian', 'Rear-foot-elevated split squat', 'squat', 'reps', 'none', 'Back foot on a chair. Lower straight down on the front leg.', '🦵', ['knees']),
    E('pistol-assisted', 'Assisted pistol squat', 'squat', 'reps', 'none', 'One-leg squat holding a door frame for balance. Each side counts as one rep.', '🎯', ['knees']),
    E('goblet', 'Goblet squat', 'squat', 'reps', 'home', 'Hold a dumbbell or loaded backpack at your chest and squat.', '🏋️', ['knees']),
    E('bb-squat', 'Barbell back squat', 'squat', 'reps', 'gym', 'Bar on upper back, brace your core, squat to a comfortable depth.', '🏋️', ['knees', 'back']),
  ],
  hinge: [
    E('glute-bridge', 'Glute bridge', 'hinge', 'reps', 'none', 'Lie on your back, knees bent. Push hips up, squeeze glutes, lower slowly.', '🌉'),
    E('bridge-hold', 'Glute bridge hold', 'hinge', 'hold', 'none', 'Hips up, hold the top position, squeeze glutes. Breathe.', '🌉'),
    E('sl-bridge', 'Single-leg glute bridge', 'hinge', 'reps', 'none', 'One foot on the floor, other leg straight. Push hips up. Count reps per side.', '🌉'),
    E('good-morning', 'Hip hinge (good morning)', 'hinge', 'reps', 'none', 'Hands behind head, soft knees, push hips back with a flat back, stand.', '🙇', ['back']),
    E('sl-rdl', 'Single-leg hip hinge', 'hinge', 'reps', 'none', 'Balance on one leg and hinge, reaching toward the floor. Hold a wall if needed.', '🦩', ['back']),
    E('db-rdl', 'Dumbbell Romanian deadlift', 'hinge', 'reps', 'home', 'Dumbbells slide down your thighs as hips go back; stand by driving hips forward.', '🏋️', ['back']),
    E('deadlift', 'Barbell deadlift', 'hinge', 'reps', 'gym', 'Bar close to shins, brace, push the floor away. Neutral spine.', '🏋️', ['back']),
  ],
  lunge: [
    E('step-up-low', 'Low step-up', 'lunge', 'reps', 'none', 'Step onto a low, stable step and stand tall; step down slowly. Reps per side.', '🪜', ['knees']),
    E('static-lunge', 'Supported split squat', 'lunge', 'reps', 'none', 'Staggered stance holding a chair or wall. Drop the back knee straight down.', '🦵', ['knees']),
    E('reverse-lunge', 'Reverse lunge', 'lunge', 'reps', 'none', 'Step back, lower the back knee, drive through the front heel to stand.', '🦵', ['knees']),
    E('high-step-up', 'High step-up', 'lunge', 'reps', 'none', 'Use a sturdy chair. Drive up with the front leg only, no push from the back foot.', '🪜', ['knees']),
    E('walking-lunge', 'Walking lunge', 'lunge', 'reps', 'none', 'Long steps forward, upright torso. Count each step as one rep.', '🚶', ['knees']),
    E('db-lunge', 'Dumbbell lunge', 'lunge', 'reps', 'home', 'Hold weights at your sides and do reverse lunges.', '🏋️', ['knees']),
  ],
  pull: [
    E('towel-row', 'Doorframe towel row', 'pull', 'reps', 'none', 'Hold a towel looped around a sturdy door handle, lean back and row yourself up. Make sure the door is shut.', '🚪', ['shoulders']),
    E('table-row', 'Table row (inverted, bent knees)', 'pull', 'reps', 'none', 'Lie under a very sturdy table, grab the edge, pull chest up with knees bent.', '🛏️', ['shoulders']),
    E('table-row-straight', 'Table row (legs straight)', 'pull', 'reps', 'none', 'Same, with straight legs for more load.', '🛏️', ['shoulders']),
    E('superman', 'Superman raise', 'pull', 'reps', 'none', 'Face down, lift arms and legs slightly, squeeze your back, lower slowly.', '🦸', ['back']),
    E('backpack-row', 'Backpack bent-over row', 'pull', 'reps', 'home', 'Hinge forward and row a loaded backpack to your ribs.', '🎒', ['back']),
    E('db-row', 'Dumbbell row', 'pull', 'reps', 'home', 'One hand on a chair, row the dumbbell to your hip.', '🏋️'),
    E('pulldown', 'Lat pulldown / pull-up', 'pull', 'reps', 'gym', 'Pull the bar to the upper chest, shoulders down and back.', '🏋️', ['shoulders']),
  ],
  core: [
    E('dead-bug', 'Dead bug', 'core', 'reps', 'none', 'On your back, arms up, knees at 90°. Lower opposite arm and leg, keep the back flat.', '🪲'),
    E('plank-knees', 'Knee plank', 'core', 'hold', 'none', 'Forearms down, knees down, body straight from head to knees. Squeeze glutes.', '🧘', ['wrists']),
    E('plank', 'Forearm plank', 'core', 'hold', 'none', 'Forearms and toes, straight line. Do not let hips sag.', '🧘'),
    E('bird-dog', 'Bird dog', 'core', 'reps', 'none', 'On hands and knees, extend opposite arm and leg, pause, switch. Keep hips level.', '🐦', ['wrists']),
    E('side-plank', 'Side plank', 'core', 'hold', 'none', 'On one forearm, lift hips. Hold, then switch sides. Seconds per side.', '🧘', ['shoulders']),
    E('hollow', 'Hollow hold', 'core', 'hold', 'none', 'On your back, lower back pressed down, lift shoulders and legs. Hold.', '🌙', ['back']),
    E('cable-crunch', 'Weighted crunch / hanging knee raise', 'core', 'reps', 'gym', 'Controlled reps with a weight or hanging from a bar.', '🏋️'),
  ],
};

export const RANGES: Record<Kind, { min: number; max: number; step: number; unit: string }> = {
  reps: { min: 6, max: 15, step: 2, unit: 'reps' },
  hold: { min: 15, max: 60, step: 5, unit: 'sec' },
};

/** Which movements run on which day (3 full-body days a week). */
export const DAY_PLANS: Pattern[][] = [
  ['squat', 'push', 'pull', 'core'],
  ['hinge', 'lunge', 'push', 'core'],
  ['squat', 'hinge', 'pull', 'push', 'core'],
];

const EQUIP_RANK: Record<Equipment, number> = { none: 0, home: 1, gym: 2 };

export function ladderFor(pattern: Pattern, equipment: Equipment, limitations: Limitation[]): Exercise[] {
  return LADDERS[pattern].filter(
    (e) => EQUIP_RANK[e.equip] <= EQUIP_RANK[equipment] && !(e.avoid ?? []).some((l) => limitations.includes(l)),
  );
}

/** Safe starting step per movement, derived from what the user said they can do. */
export function startingStates(abilities: AbilityId[], equipment: Equipment, limitations: Limitation[]): Record<string, PatternState> {
  const has = (a: AbilityId) => abilities.includes(a);
  const want: Record<Pattern, string> = {
    push: has('kneePushup') ? 'knee-pushup' : has('wallPushup') ? 'incline-pushup' : 'wall-pushup',
    squat: has('sitStand') ? 'box-squat' : 'sit-stand',
    hinge: has('floorGetUp') ? 'glute-bridge' : 'glute-bridge',
    lunge: has('stairs') ? 'static-lunge' : 'step-up-low',
    pull: 'towel-row',
    core: has('plank') ? 'plank-knees' : 'dead-bug',
  };
  const out: Record<string, PatternState> = {};
  (Object.keys(want) as Pattern[]).forEach((p) => {
    const ladder = ladderFor(p, equipment, limitations);
    let idx = ladder.findIndex((e) => e.id === want[p]);
    if (idx < 0) idx = 0;
    const kind = ladder[idx]?.kind ?? 'reps';
    out[p] = { step: idx, target: RANGES[kind].min };
  });
  return out;
}

export function setsFor(week: number, avgStep: number): number {
  const base = week <= 2 ? 2 : 3;
  return avgStep >= 4.5 ? base + 1 : base;
}

export interface PlannedItem {
  exercise: Exercise;
  pattern: Pattern;
  sets: number;
  target: number;
  unit: string;
}

export function buildWorkout(
  dayIndex: number,
  profile: Pick<Profile, 'equipment' | 'limitations'>,
  states: Record<string, PatternState>,
  week: number,
): PlannedItem[] {
  const patterns = DAY_PLANS[dayIndex % DAY_PLANS.length];
  const steps = Object.values(states).map((s) => s.step);
  const avg = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : 0;
  const items: PlannedItem[] = [];
  for (const pat of patterns) {
    const ladder = ladderFor(pat, profile.equipment, profile.limitations);
    if (!ladder.length) continue;
    const st = states[pat] ?? { step: 0, target: RANGES.reps.min };
    const ex = ladder[Math.min(st.step, ladder.length - 1)];
    items.push({ exercise: ex, pattern: pat, sets: setsFor(week, avg), target: Math.max(st.target, RANGES[ex.kind].min), unit: RANGES[ex.kind].unit });
  }
  return items;
}

/** Double progression: easy -> more reps, then a harder variation; hard -> fewer reps, then an easier variation. */
export function progress(
  state: PatternState,
  feedback: 'easy' | 'right' | 'hard',
  ladder: Exercise[],
): PatternState {
  const ex = ladder[Math.min(state.step, ladder.length - 1)];
  const r = RANGES[ex?.kind ?? 'reps'];
  if (feedback === 'right') return { ...state, step: Math.min(state.step, ladder.length - 1) };
  if (feedback === 'easy') {
    const t = state.target + r.step;
    if (t > r.max) {
      if (state.step < ladder.length - 1) {
        const next = ladder[state.step + 1];
        return { step: state.step + 1, target: RANGES[next.kind].min };
      }
      return { step: state.step, target: r.max };
    }
    return { step: state.step, target: t };
  }
  const t = state.target - r.step;
  if (t < r.min) {
    if (state.step > 0) {
      const prev = ladder[state.step - 1];
      return { step: state.step - 1, target: RANGES[prev.kind].max - 2 * RANGES[prev.kind].step };
    }
    return { step: 0, target: r.min };
  }
  return { step: state.step, target: t };
}

export function levelFromStates(states: Record<string, PatternState>): { label: 'Beginner' | 'Intermediate' | 'Expert'; avg: number } {
  const steps = Object.values(states).map((s) => s.step);
  const avg = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : 0;
  return { label: avg < 2 ? 'Beginner' : avg < 4 ? 'Intermediate' : 'Expert', avg };
}

// ---- Cardio / movement finishers matched to what the user enjoys ----

export interface CardioOption {
  id: StyleId;
  name: string;
  emoji: string;
  how: string;
  highImpact?: boolean;
}

export const CARDIO: CardioOption[] = [
  { id: 'walking', name: 'Brisk walk', emoji: '🚶', how: 'Walk fast enough that you can talk but not sing. Add 2-3 min each week.' },
  { id: 'dance', name: 'Dance session', emoji: '💃', how: 'Put on 3-4 songs you love and move. Low-impact steps are fine: side steps, arm sweeps, gentle bounces.' },
  { id: 'intervals', name: 'Low-impact intervals', emoji: '⏱️', how: '30 s fast marching/high knees (no jumping), 60 s easy. Repeat 6-10 times.' },
  { id: 'swim', name: 'Swim / water walking', emoji: '🏊', how: 'Easy, steady laps or walk in chest-deep water, 20-30 min. Kind to joints.' },
  { id: 'sports', name: 'Play a sport', emoji: '🏸', how: 'Badminton, basketball, volleyball or any game for 30+ min counts.' },
  { id: 'stretch', name: 'Stretch / yoga flow', emoji: '🧘', how: '10-15 min of gentle stretching. Great for recovery days and sleep.' },
];

export function pickCardio(comfortable: StyleId[], dayIndex: number): CardioOption {
  const pref = CARDIO.filter((c) => comfortable.includes(c.id) && c.id !== 'stretch' && c.id !== 'strength' as StyleId);
  const pool = pref.length ? pref : CARDIO.filter((c) => c.id === 'walking');
  return pool[dayIndex % pool.length];
}

export function stepGoal(baseline: number, week: number): number {
  const start = Math.max(2500, Math.round(baseline / 500) * 500);
  return Math.min(10000, start + 500 * Math.max(0, week - 1));
}
