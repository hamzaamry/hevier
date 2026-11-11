import { MUSCLE_KEYS, recoveryState, recoveryWindow, type MuscleKey, type RecoveryState, type Session } from './recovery';

export const MAX_HOURS = 96;

// One illustrative full-body workout. Effective sets already include the half credit for helpers.
export const HERO_SESSION: Session = {
  id: 'full',
  label: 'Full body',
  sets: {
    CHEST: 6,
    SHOULDERS_FRONT: 3.5,
    SHOULDERS_SIDE: 3,
    SHOULDERS_REAR: 2,
    TRICEPS: 5,
    BICEPS: 4.5,
    FOREARMS: 2,
    TRAPEZIUS: 2,
    RHOMBOIDS: 4,
    LATS: 7,
    BACK_LOWER: 1,
    CORE: 1,
    GLUTES: 5,
    QUADS: 8,
    HAMSTRINGS: 3,
    CALVES: 4,
    ADDUCTORS: 1,
  },
};

// Muscles with the same window share one colour, so a frame only needs three colours.
export type WindowClass = 1 | 2 | 3 | 0;

export function windowClass(sets: number): WindowClass {
  const w = recoveryWindow(sets);
  if (!w) return 0;
  if (w.partlyUntil === 30) return 1;
  return w.partlyUntil === 48 ? 2 : 3;
}

export function heroClasses(): Record<MuscleKey, WindowClass> {
  const out = {} as Record<MuscleKey, WindowClass>;
  for (const key of MUSCLE_KEYS) out[key] = windowClass(HERO_SESSION.sets[key] ?? 0);
  return out;
}

type Rgb = readonly [number, number, number];

const RED: Rgb = [255, 69, 58];
const ORANGE: Rgb = [255, 159, 10];
const GREEN: Rgb = [52, 199, 89];
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const triplet = (c: Rgb): string => `${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])}`;

// Smooth colour for the time-lapse. The label shown next to it always comes from recoveryState.
function blend(cls: 1 | 2 | 3, hours: number) {
  const w = recoveryWindow(cls === 1 ? 1 : cls === 2 ? 2 : 4);
  if (!w) throw new Error('window');
  const toOrange = smooth(w.heavyUntil - 3, w.heavyUntil + 3, hours);
  const toGreen = smooth(w.partlyUntil - 4, w.partlyUntil + 4, hours);
  return { color: mix(mix(RED, ORANGE, toOrange), GREEN, toGreen), toOrange, toGreen };
}

const TRAINED_BY_CLASS = (() => {
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const cls of Object.values(heroClasses())) if (cls) counts[cls] += 1;
  return counts;
})();
const TRAINED = TRAINED_BY_CLASS[1] + TRAINED_BY_CLASS[2] + TRAINED_BY_CLASS[3];

// Text colour for the headline and dots: walks the hue from red through amber to green, so the
// middle of the clock is a clear yellow-green and never a muddy brown.
function tone(progress: number): string {
  const t = Math.min(1, Math.max(0, progress));
  const hue = t < 0.5 ? 27 + (62 - 27) * (t / 0.5) : 62 + (148 - 62) * ((t - 0.5) / 0.5);
  const light = 0.52 + 0.1 * Math.sin(Math.PI * Math.min(1, t * 1.15));
  return `oklch(${light.toFixed(3)} 0.19 ${hue.toFixed(1)})`;
}

export interface Frame {
  vars: Record<string, string>;
  hours: number;
}

// Everything the scrub writes per frame: three colours, three halo weights and the headline ink.
export function frame(hours: number): Frame {
  const h = Math.min(MAX_HOURS, Math.max(0, hours));
  let red = 0;
  let orange = 0;
  let green = 0;
  const vars: Record<string, string> = {};
  for (const cls of [1, 2, 3] as const) {
    const fill = blend(cls, h);
    const n = TRAINED_BY_CLASS[cls] / TRAINED;
    vars[`--w${cls}`] = triplet(fill.color);
    red += n * (1 - fill.toOrange);
    orange += n * fill.toOrange * (1 - fill.toGreen);
    green += n * fill.toOrange * fill.toGreen;
  }
  vars['--halo-r'] = red.toFixed(3);
  vars['--halo-o'] = orange.toFixed(3);
  vars['--halo-g'] = green.toFixed(3);
  vars['--tone'] = tone(orange * 0.5 + green);
  return { vars, hours: h };
}

// Scroll progress (0 to 1 through the pinned track) to hours, with a short rest at each end
// and a slower stretch around each stage so the copy has time to be read.
const ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.05, 0],
  [0.24, 12],
  [0.42, 24],
  [0.6, 48],
  [0.78, 72],
  [0.93, 96],
  [1, 96],
];

export function hoursFromProgress(p: number): number {
  const x = Math.min(1, Math.max(0, p));
  for (let i = 1; i < ANCHORS.length; i += 1) {
    const [p0, h0] = ANCHORS[i - 1];
    const [p1, h1] = ANCHORS[i];
    if (x <= p1) return h0 + (h1 - h0) * ((x - p0) / (p1 - p0));
  }
  return MAX_HOURS;
}

export function progressFromHours(hours: number): number {
  const h = Math.min(MAX_HOURS, Math.max(0, hours));
  for (let i = 1; i < ANCHORS.length; i += 1) {
    const [p0, h0] = ANCHORS[i - 1];
    const [p1, h1] = ANCHORS[i];
    if (h1 > h0 && h <= h1) return p0 + (p1 - p0) * ((h - h0) / (h1 - h0));
  }
  return 0.93;
}

export interface Stage {
  from: number;
  kicker: string;
  line: string;
  note: string;
}

// Every claim here is checked against recoveryState in afterglow.test.ts.
export const STAGES: Stage[] = [
  {
    from: 0,
    kicker: 'Right after',
    line: 'Everything you trained is red.',
    note: 'Heavy recent load. The map counts the hard sets you logged, muscle by muscle.',
  },
  {
    from: 12,
    kicker: 'Half a day',
    line: 'Abs and lower back ease off first.',
    note: 'Muscles that got about one set have the shortest window, 12 hours.',
  },
  {
    from: 24,
    kicker: 'One day',
    line: 'Nothing is red anymore.',
    note: 'Partly recovered. Abs, lower back and adductors turn green at 30 hours.',
  },
  {
    from: 48,
    kicker: 'Two days',
    line: 'Shoulders and hamstrings are ready.',
    note: 'Chest, back, glutes and quads got more sets, so they need longer.',
  },
  {
    from: 72,
    kicker: 'Three days',
    line: 'All green. Train again.',
    note: 'The most worked muscles take up to 72 hours. It is an estimate, not a medical verdict.',
  },
];

export function stageIndex(hours: number): number {
  let index = 0;
  for (let i = 0; i < STAGES.length; i += 1) if (hours >= STAGES[i].from) index = i;
  return index;
}

export const STATE_WORD: Record<Exclude<RecoveryState, 'idle'>, string> = {
  heavy: 'Heavy recent load',
  partly: 'Partly recovered',
  ready: 'Likely ready',
};

export interface Counts {
  heavy: number;
  partly: number;
  ready: number;
}

export function counts(hours: number): Counts {
  const out: Counts = { heavy: 0, partly: 0, ready: 0 };
  for (const sets of Object.values(HERO_SESSION.sets)) {
    const state = recoveryState(sets, hours);
    if (state !== 'idle') out[state] += 1;
  }
  return out;
}

export function dominant(c: Counts): Exclude<RecoveryState, 'idle'> {
  if (c.heavy >= c.partly && c.heavy >= c.ready) return 'heavy';
  return c.partly >= c.ready ? 'partly' : 'ready';
}

export function agoLabel(hours: number): string {
  const h = Math.round(hours);
  if (h < 1) return 'just now';
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

// CSS for the 19 per-muscle fill variables, so every figure resolves --w1..3 against its own wrapper.
export function figureCss(): string {
  const classes = heroClasses();
  const rules = MUSCLE_KEYS.map((key) => `--f-${key}:${classes[key] ? `rgb(var(--w${classes[key]}))` : 'var(--idle)'}`);
  return `.fig-hero{${rules.join(';')}}`;
}
