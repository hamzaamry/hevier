import { SITE } from '@/lib/site';
import { WeekStrip } from './week-strip';

export function Week() {
  return (
    <section id="week" data-section="week" className="section week-section" aria-labelledby="week-title">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Plan a week</p>
          <h2 id="week-title" className="h2">
            Every morning, a different map.
          </h2>
          <p className="lead">
            Tap a day to set the workout. Tap a figure to read that morning. If a muscle was trained twice, the worse
            state shows.
          </p>
          <p>
            <a className="text-link" href={SITE.scienceRecovery}>
              Read the recovery notes
            </a>
          </p>
        </div>
        <WeekStrip />
      </div>
    </section>
  );
}
