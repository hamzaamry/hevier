import { SITE } from '@/lib/site';
import { SetCounter } from './set-counter';

export function Sets() {
  return (
    <section id="sets" data-section="sets" className="section sets" aria-labelledby="sets-title">
      <div className="wrap sets-grid">
        <div className="section-head">
          <p className="eyebrow">How sets count</p>
          <h2 id="sets-title" className="h2">
            Tap a set. See what it is worth.
          </h2>
          <p className="lead">
            A hard set ends within about 3 reps of failure and counts as one. Easier sets count less. A muscle that only
            helps gets half a set.
          </p>
          <p>
            <a className="text-link" href={SITE.scienceSets}>
              Read the set notes
            </a>
          </p>
        </div>
        <SetCounter />
      </div>
    </section>
  );
}
