import type { CSSProperties } from 'react';
import { HAS_APK_RELEASE } from '@/lib/site';
import { CheckIcon } from './icons';

const INCLUDED = [
  'Unlimited routines, folders and a training cycle',
  'Every chart, from 15 days to all time',
  'Sets per muscle, weekly zones and the recovery map',
  'Muscle distribution and push/pull balance',
  '5,500+ exercises with muscles and instructions',
  'Rest timer, live PR medals, widgets and the workout notification',
  'Import a Hevy CSV export and back up to your own PC',
  'No account, no ads, no subscription',
];

const LACKS = [
  'iOS app. It is in progress, with no release date',
  'An APK release yet. For now you build it from source',
  'Exercise pictures. The catalogue’s pictures are licensed to its author only',
  'A watch app',
  'A social feed or friends',
  'Health Connect or Strava sync',
  'Built-in training programs',
  'Cloud sync. Backups go to your own PC',
];

export function Free() {
  return (
    <section id="free" data-section="free" className="section free" aria-labelledby="free-title">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Free, for real</p>
          <h2 id="free-title" className="h2">
            The bill is zero. Here is the whole list.
          </h2>
          <p className="lead">
            Hevier is a small hobby project. What it does, and what it does not do yet, side by side.
          </p>
        </div>
        <div className="free-grid">
          <article className="list glass" data-reveal>
            <h3 className="h3">Included</h3>
            <ul>
              {INCLUDED.map((item) => (
                <li key={item}>
                  <span className="check-ico">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <article className="list list-lacks glass" data-reveal style={{ '--d': '80ms' } as CSSProperties}>
            <h3 className="h3">Not here yet</h3>
            <ul>
              {LACKS.filter((item) => HAS_APK_RELEASE ? !item.startsWith('An APK') : true).map((item) => (
                <li key={item}>
                  <span className="dash" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="fine">If you need one of these today, another app is the better pick.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
