'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MUSCLE_KEYS, MUSCLE_LABELS, type MuscleKey, type RecoveryState } from '@/lib/recovery';
import { DAYS, DAYS_LONG, DEFAULT_PLAN, PLAN_CYCLE, PLAN_LABEL, morningStates, type DayPlan } from '@/lib/week';
import { Body } from './body-figure';

const FILL: Record<RecoveryState, string> = {
  heavy: 'rgb(var(--red))',
  partly: 'rgb(var(--orange))',
  ready: 'rgb(var(--green))',
  idle: 'var(--idle)',
};

function names(keys: MuscleKey[]): string {
  const list = keys.map((k) => MUSCLE_LABELS[k].toLowerCase());
  if (list.length > 4) return `${list.slice(0, 3).join(', ')} and ${list.length - 3} more`;
  if (list.length > 1) return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
  return list[0] ?? '';
}

function caption(day: number, plan: DayPlan[]): string {
  const states = morningStates(plan, day);
  const group = (state: RecoveryState) => MUSCLE_KEYS.filter((k) => states[k] === state);
  const parts: string[] = [];
  if (group('heavy').length) parts.push(`${names(group('heavy'))} still heavy`);
  if (group('partly').length) parts.push(`${names(group('partly'))} partly recovered`);
  if (group('ready').length) parts.push(`${names(group('ready'))} ready`);
  return parts.length
    ? `${DAYS_LONG[day]} morning: ${parts.join('; ')}.`
    : `${DAYS_LONG[day]} morning: nothing trained yet, so nothing to recover from.`;
}

const TODAY = 3;

export function WeekStrip() {
  const [plan, setPlan] = useState<DayPlan[]>(DEFAULT_PLAN);
  const [selected, setSelected] = useState(TODAY);
  const scroller = useRef<HTMLDivElement>(null);

  // On a phone the strip scrolls sideways: start with today in view.
  useEffect(() => {
    const el = scroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = (el.scrollWidth / DAYS.length) * (TODAY + 0.5) - el.clientWidth / 2;
  }, []);

  const cycle = (day: number) => {
    setPlan((list) => list.map((kind, i) => (i === day ? PLAN_CYCLE[(PLAN_CYCLE.indexOf(kind) + 1) % PLAN_CYCLE.length] : kind)));
    setSelected(day);
  };

  return (
    <div className="week" data-reveal>
      <div className="week-scroll glass" ref={scroller}>
        <ul className="week-grid">
          {DAYS.map((name, day) => {
            const states = morningStates(plan, day);
            const vars: Record<string, string> = {};
            for (const key of MUSCLE_KEYS) vars[`--f-${key}`] = FILL[states[key] ?? 'idle'];
            return (
              <li key={name} className="day" data-sel={day === selected ? '' : undefined}>
                <p className="dn">
                  {name}
                  {day === TODAY && <span> · today</span>}
                </p>
                <button
                  type="button"
                  className="daytag"
                  data-kind={plan[day]}
                  onClick={() => cycle(day)}
                  aria-label={`${DAYS_LONG[day]} workout: ${PLAN_LABEL[plan[day]]}. Tap to change.`}
                >
                  {PLAN_LABEL[plan[day]]}
                </button>
                <button
                  type="button"
                  className="dayfig"
                  style={vars as CSSProperties}
                  onClick={() => setSelected(day)}
                  aria-pressed={day === selected}
                  aria-label={`Show the recovery map for ${DAYS_LONG[day]} morning`}
                >
                  <Body view="front" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="week-cap" role="status">
        {caption(selected, plan)} <span>Estimates from the recovery windows in the science notes.</span>
      </p>
      <ul className="legend" aria-hidden>
        <li>
          <i style={{ background: FILL.heavy }} />
          Heavy recent load
        </li>
        <li>
          <i style={{ background: FILL.partly }} />
          Partly recovered
        </li>
        <li>
          <i style={{ background: FILL.ready }} />
          Likely ready
        </li>
        <li>
          <i style={{ background: FILL.idle }} />
          Not trained
        </li>
      </ul>
    </div>
  );
}
