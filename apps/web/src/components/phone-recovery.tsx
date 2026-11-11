import { counts } from '@/lib/afterglow';
import { Body } from './body-figure';

const DAYS = [
  { d: 'S', n: 31, on: true },
  { d: 'S', n: 1, on: true },
  { d: 'M', n: 2, on: true },
  { d: 'T', n: 3, on: false },
  { d: 'W', n: 4, on: true },
  { d: 'T', n: 5, on: true },
  { d: 'F', n: 6, on: true },
];

// An HTML recreation of the app's Statistics screen, Recovery tab. Its colours and counts follow
// the same clock as the hero (data-live nodes are written by afterglow-driver).
export function PhoneRecovery() {
  const c = counts(0);
  return (
    <div
      className="phone"
      role="img"
      aria-label="The Recovery tab in Hevier: the same body map, coloured red, orange and green, with counts of muscles in each state."
    >
      <div className="phone-screen" aria-hidden>
        <div className="ps-status">
          <span>9:41</span>
          <span className="ps-pill" />
          <span className="ps-bat" />
        </div>
        <div className="ps-head">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m6-6-6 6 6 6" />
          </svg>
          Statistics
        </div>
        <p className="ps-title">Last 7 days body graph</p>
        <div className="ps-days">
          {DAYS.map((day, i) => (
            <div key={i} className="ps-day">
              {day.d}
              <b className={day.on ? 'on' : undefined}>{day.n}</b>
            </div>
          ))}
        </div>
        <div className="ps-tabs">
          <span>Sets</span>
          <span className="act">Recovery</span>
        </div>
        <p className="ps-cap">
          Full body workout · <span data-live="ago">just now</span>
        </p>
        <div className="ps-bodies">
          <Body view="front" />
          <Body view="back" />
        </div>
        <ul className="ps-legend">
          <li>
            <i style={{ background: 'rgb(var(--green))' }} />
            Likely ready <span data-live="ready">{c.ready}</span>
          </li>
          <li>
            <i style={{ background: 'rgb(var(--orange))' }} />
            Partly recovered <span data-live="partly">{c.partly}</span>
          </li>
          <li>
            <i style={{ background: 'rgb(var(--red))' }} />
            Heavy recent load <span data-live="heavy">{c.heavy}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
