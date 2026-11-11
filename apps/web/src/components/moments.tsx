import Image from 'next/image';
import type { CSSProperties } from 'react';
import { frame } from '@/lib/afterglow';
import { Body } from './body-figure';
import { RestTimer } from './rest-timer';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DATES: (number | null)[] = [null, null, null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const LOGGED = new Set([1, 2, 4, 5]);

const WIDGET_VARS = frame(40).vars as CSSProperties;

function Medal() {
  return (
    <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden>
      <path d="M8.2 13.5 4.6 21.2l3-.6L9.4 23 12 16.6Z" fill="#f1b314" />
      <path d="m15.8 13.5 3.6 7.7-3-.6-1.8 2.4L12 16.6Z" fill="#f1b314" />
      <circle cx="12" cy="9.2" r="7.6" fill="#f6d000" />
      <circle cx="12" cy="9.2" r="7.6" fill="url(#hv-shine)" />
      <text x="12" y="11.6" fontSize="6.6" fontWeight="700" fill="#1a1a1a" textAnchor="middle">
        PR
      </text>
    </svg>
  );
}

export function Moments() {
  return (
    <section id="moments" data-section="moments" className="section moments" aria-labelledby="moments-title">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Widgets and notification</p>
          <h2 id="moments-title" className="h2">
            Works with the app closed.
          </h2>
          <p className="lead">
            Your rest timer lives in the notification shade. Your week lives on the home screen. Records show up the
            second you beat one.
          </p>
        </div>

        <div className="bento">
          <article className="panel glass p-notif" data-reveal>
            <div className="panel-copy">
              <h3 className="h3">A live workout notification.</h3>
              <p>
                It shows the next set and the rest countdown, with Complete Set, Skip, −15s and +15s buttons that work
                in the background.
              </p>
            </div>
            <div className="notif" role="img" aria-label="Workout notification: Leg Press, next set 2 of 4, rest countdown with Skip, minus 15 seconds and plus 15 seconds buttons">
              <div className="notif-top" aria-hidden>
                <Image src="/screens/app-icon.webp" alt="" width={40} height={40} />
                <div>
                  <span>Hevier · now</span>
                  <b>Leg Press (Machine)</b>
                  <span>Next: Set 2 of 4 (190 kg x 9 reps)</span>
                </div>
              </div>
              <div aria-hidden>
                <RestTimer />
              </div>
              <div className="notif-actions" aria-hidden>
                <span>Skip</span>
                <span>−15s</span>
                <span>+15s</span>
              </div>
            </div>
          </article>

          <article className="panel glass p-pr" data-reveal>
            <div className="panel-copy">
              <h3 className="h3">Live PR medals.</h3>
              <p>
                A medal pops in the set box the moment a set beats your best: heaviest weight, estimated 1RM, best set
                volume, most reps, longest time or distance.
              </p>
            </div>
            <div className="toast" role="img" aria-label="Example record toast: Bench Press, heaviest weight, with a gold PR medal">
              <Medal />
              <div aria-hidden>
                <b>Bench Press (Barbell)</b>
                <span>Heaviest weight - 82.5 kg</span>
                <span>Estimated 1RM - 96 kg</span>
              </div>
            </div>
            <p className="fine">Example numbers.</p>
          </article>
          <article className="panel glass p-widgets" data-reveal style={{ '--d': '80ms' } as CSSProperties}>
            <div className="panel-copy">
              <h3 className="h3">Four home-screen widgets.</h3>
              <p>This month’s calendar, weekly volume, next in your cycle, and the recovery map.</p>
            </div>
            <div className="wgrid" role="img" aria-label="Four home-screen widgets: calendar, weekly volume, next in cycle and the recovery map">
              <div className="w w-cal" aria-hidden>
                <p>November</p>
                <div className="cal">
                  {WEEKDAYS.map((d, i) => (
                    <span key={i} className="dh">
                      {d}
                    </span>
                  ))}
                  {DATES.map((d, i) => (
                    <span key={i} className={d !== null && LOGGED.has(d) ? 'on' : undefined}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="w w-vol" aria-hidden>
                <p>Volume</p>
                <small>This week</small>
                <b>12k kg</b>
                <small className="dim">Last week</small>
                <span className="dim big">34k kg</span>
              </div>
              <div className="w w-next" aria-hidden>
                <p>Next in Cycle</p>
                <small className="blue">4 of 4</small>
                <b>Lower B</b>
                <small className="dim">Warm Up, Leg Press (Machine), Hack Squat (Machine), Lying Leg Curl</small>
              </div>
              <div className="w w-rec fig-hero" style={WIDGET_VARS} aria-hidden>
                <p>Recovery</p>
                <div>
                  <Body view="front" />
                  <Body view="back" />
                </div>
              </div>
            </div>
          </article>

        </div>
        <p className="fine moments-note">
          Android today. The notification and widgets will be rebuilt for iOS, which is coming.
        </p>
      </div>
    </section>
  );
}
