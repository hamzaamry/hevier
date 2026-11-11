import type { CSSProperties } from 'react';
import { CTA, HAS_APK_RELEASE, SITE } from '@/lib/site';
import { MAX_HOURS, STAGES, frame } from '@/lib/afterglow';
import { Body, Halo } from './body-figure';
import { DownloadIcon, GithubIcon, TerminalIcon } from './icons';
import { PhoneRecovery } from './phone-recovery';

const FIRST = frame(0);

function Ctas() {
  return (
    <div className="cta-row">
      <a href={CTA.href} className="btn btn-primary">
        {HAS_APK_RELEASE ? <DownloadIcon size={18} /> : <TerminalIcon size={18} />}
        {CTA.label}
      </a>
      <a href={SITE.repo} className="btn btn-glass">
        <GithubIcon size={18} />
        View on GitHub
      </a>
    </div>
  );
}

function Figure({ view, label }: { view: 'front' | 'back'; label: string }) {
  return (
    <div className="ag-fig">
      <Halo view={view} className="h-shadow" />
      <Halo view={view} className="h-r" />
      <Halo view={view} className="h-o" />
      <Halo view={view} className="h-g" />
      <Body view={view} />
      <span className="ag-fig-label">{label}</span>
    </div>
  );
}

// The pinned hero. It renders at 0 h, so it is complete without script; afterglow-driver moves the
// clock with scroll or with the slider by writing CSS custom properties, never by re-rendering.
export function Afterglow() {
  return (
    <section id="hero" data-section="hero" className="ag" aria-labelledby="hero-title">
      <div className="ag-scope fig-hero" data-ag style={FIRST.vars as CSSProperties}>
        <div className="ag-track" data-ag-track>
          <div className="ag-pin" data-ag-pin>
            <div className="ag-aura" aria-hidden>
              <i className="a-r" />
              <i className="a-o" />
              <i className="a-g" />
            </div>
            <div className="ag-grid wrap">
              <div className="ag-copy">
                <div className="ag-intro">
                  <p className="eyebrow">Free · open source · Android</p>
                  <h1 id="hero-title" className="ag-h1">
                    <span>Train hard.</span>
                    <span className="ag-grad">Recover smart.</span>
                  </h1>
                  <p className="ag-sub">
                    The workout tracker that shows which muscles are ready again. Nothing leaves your phone.
                  </p>
                  <div className="ag-cta">
                    <Ctas />
                  </div>
                  <p className="fine ag-fine">Android today, coming to iOS. AGPL-3.0.</p>
                </div>
                <div className="ag-stage glass" data-ag-stages>
                  {STAGES.map((stage, i) => (
                    <article key={stage.from} data-stage={i} data-on={i === 0 ? '' : undefined} aria-hidden={i === 0 ? undefined : true}>
                      <p className="stage-kicker">{stage.kicker}</p>
                      <p className="stage-line">{stage.line}</p>
                      <p className="stage-note">{stage.note}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="ag-bodies">
                <Figure view="front" label="Front" />
                <Figure view="back" label="Back" />
                <div className="ag-hint" data-ag-hint aria-hidden>
                  <span>Scroll to recover</span>
                </div>
              </div>

              <div className="ag-phone-slot">
                <PhoneRecovery />
              </div>
            </div>

            <div className="ag-dock glass" role="group" aria-label="Recovery time-lapse">
              <div className="dock-top">
                <p className="dock-hours">
                  <b data-live="hours">0</b>
                  hours<span className="long"> after your workout</span>
                </p>
                <p className="dock-state" data-live="state">
                  Heavy recent load
                </p>
              </div>
              <input
                id="ag-time"
                className="ag-time"
                type="range"
                min={0}
                max={MAX_HOURS}
                step={0.1}
                defaultValue={0}
                aria-label="Hours since your workout"
                aria-valuetext="0 hours after the workout. Heavy recent load."
                data-ag-slider
              />
              <div className="dock-ticks" aria-hidden>
                {[0, 24, 48, 72, 96].map((h, i) => (
                  <span key={h} style={{ '--i': i } as CSSProperties}>
                    {h} h
                  </span>
                ))}
              </div>
              <p className="sr-only" role="status" data-live="announce" />
            </div>
          </div>
        </div>

        <div className="ag-after wrap">
          <Ctas />
          <PhoneRecovery />
          <p className="fine">Android today, coming to iOS. AGPL-3.0.</p>
        </div>
      </div>

      <div className="ag-still wrap">
        <h2 className="sr-only">The same workout, right after and four days later</h2>
        <div className="still-row">
          <figure className="still glass fig-hero still-0">
            <div className="still-body">
              <Body view="front" />
            </div>
            <figcaption>
              <b>0 hours</b>
              <br />
              <span>Everything you trained is red.</span>
            </figcaption>
          </figure>
          <figure className="still glass fig-hero still-96">
            <div className="still-body">
              <Body view="front" />
            </div>
            <figcaption>
              <b>96 hours</b>
              <br />
              <span>All green. Train again.</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
