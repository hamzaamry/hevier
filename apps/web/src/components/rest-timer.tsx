'use client';

import { useEffect, useState } from 'react';

const START = 105;
const TOTAL = 120;

const clock = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// The rest countdown from the workout notification. It ticks once a second, unless the visitor
// prefers reduced motion, and loops so the panel never sits at zero.
export function RestTimer() {
  const [left, setLeft] = useState(START);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setLeft((s) => (s <= 1 ? START : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rest">
      <b>Rest {clock(left)}</b>
      <span className="rest-bar" aria-hidden>
        <i style={{ width: `${(left / TOTAL) * 100}%` }} />
      </span>
    </div>
  );
}
