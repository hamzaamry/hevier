'use client';

import { useState } from 'react';
import { MUSCLE_LABELS } from '@/lib/recovery';
import {
  EXERCISES,
  SECONDARY_SHARE,
  entryLabel,
  nextEntry,
  setCredit,
  totalCredit,
  zoneOf,
  type SetEntry,
  type ZoneId,
} from '@/lib/sets';

const START: SetEntry[] = ['W', 2, 2, 'F', 6];
const MAX_SETS = 8;
const METER_MAX = 8;

const ZONE_COPY: Record<ZoneId, { title: string; text: string }> = {
  growth: {
    title: 'Growth zone.',
    text: 'At 4 hard sets a week or more. A model of 67 studies found 4 a week is the smallest dose that grew muscle.',
  },
  maintenance: {
    title: 'Maintenance.',
    text: 'About 3 hard sets a week kept muscle size for 32 weeks in one study of young adults. One more gets you to 4.',
  },
  below: {
    title: 'Below maintenance.',
    text: 'Under 3 a week. Nothing lower has been tested for keeping muscle, so Hevier does not call it a zone.',
  },
};

const fmt = (x: number): string => String(Math.round(x * 100) / 100);

export function SetCounter() {
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [entries, setEntries] = useState<SetEntry[]>(START);
  const exercise = EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0];
  const total = totalCredit(entries);
  const zone = ZONE_COPY[zoneOf(total)];

  const cycle = (index: number) => setEntries((list) => list.map((entry, i) => (i === index ? nextEntry(entry) : entry)));

  return (
    <div className="counter glass" data-reveal>
      <div className="seg" role="group" aria-label="Exercise">
        {EXERCISES.map((e) => (
          <button key={e.id} type="button" aria-pressed={e.id === exerciseId} onClick={() => setExerciseId(e.id)}>
            {e.label}
          </button>
        ))}
      </div>

      <ul className="setrow" aria-label="Your sets. Tap a set to change how it ended.">
        {entries.map((entry, i) => {
          const label = entryLabel(entry);
          const credit = setCredit(entry);
          return (
            <li key={i}>
              <button
                type="button"
                className="setbtn"
                data-full={credit === 1 ? '' : undefined}
                onClick={() => cycle(i)}
                aria-label={`${label.big} ${label.small}, set ${i + 1}, counts ${fmt(credit)}. Tap to change.`}
              >
                <b>{label.big}</b> <small>{label.small}</small>
              </button>
              <span className="credit" aria-hidden>
                {fmt(credit)}
              </span>
            </li>
          );
        })}
        {entries.length < MAX_SETS && (
          <li>
            <button type="button" className="setbtn add" aria-label="Add a set" onClick={() => setEntries((l) => [...l, 2])}>
              <b>+</b>
            </button>
          </li>
        )}
        {entries.length > 1 && (
          <li>
            <button type="button" className="setbtn add" aria-label="Remove the last set" onClick={() => setEntries((l) => l.slice(0, -1))}>
              <b>&minus;</b>
            </button>
          </li>
        )}
      </ul>

      <div className="total" role="status">
        <b>{fmt(total)}</b>
        <span>effective sets for {MUSCLE_LABELS[exercise.main].toLowerCase()}</span>
      </div>

      <div className="meter" aria-hidden>
        <i style={{ width: `${Math.min(100, (total / METER_MAX) * 100)}%` }} />
        <u style={{ left: `${(3 / METER_MAX) * 100}%` }}>3</u>
        <u style={{ left: `${(4 / METER_MAX) * 100}%` }}>4</u>
      </div>
      <p className="zone-copy">
        <b>{zone.title}</b> {zone.text}
      </p>

      <ul className="helpers">
        <li>
          <span>{MUSCLE_LABELS[exercise.main]}</span>
          <i style={{ width: `${Math.min(100, (total / METER_MAX) * 100)}%` }} />
          <b>{fmt(total)}</b>
        </li>
        {exercise.helpers.map((key) => (
          <li key={key} className="help">
            <span>
              {MUSCLE_LABELS[key]} <small>helper</small>
            </span>
            <i style={{ width: `${Math.min(100, ((total * SECONDARY_SHARE) / METER_MAX) * 100)}%` }} />
            <b>{fmt(total * SECONDARY_SHARE)}</b>
          </li>
        ))}
      </ul>
      <p className="fine">
        Zones are weekly. This treats the workout as the only one that muscle gets this week. Warm-up credit and the
        reps-left slope are Hevier’s own choices, built on Robinson et al. 2024.
      </p>
    </div>
  );
}
