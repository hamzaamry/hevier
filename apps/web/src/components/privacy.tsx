import { CheckIcon } from './icons';

const POINTS = [
  { b: 'No account.', t: 'Open the app and start logging.' },
  { b: 'No ads and no trackers.', t: 'This website has none either: no analytics, no cookies, no third-party requests.' },
  { b: 'Backups on your terms.', t: 'Hevier Sync copies the database to your own PC over Wi-Fi or USB, and can restore it.' },
  { b: 'Open code.', t: 'Read exactly what it does. It is AGPL-3.0.' },
];

export function Privacy() {
  return (
    <section id="privacy" data-section="privacy" className="section privacy" aria-labelledby="privacy-title">
      <div className="wrap">
        <p className="eyebrow">Privacy and local-first</p>
        <h2 id="privacy-title" className="stack" data-reveal>
          <span>No account.</span>
          <span>No ads.</span>
          <span>No cloud.</span>
        </h2>
        <div className="privacy-grid">
          <div data-reveal>
            <p className="lead">
              Hevier keeps everything in a database on the device. There is nothing to sign up for and nothing to sell.
            </p>
            <ul className="checks">
              {POINTS.map((point) => (
                <li key={point.b}>
                  <span className="check-ico">
                    <CheckIcon />
                  </span>
                  <span>
                    <b>{point.b}</b> {point.t}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="link-diagram glass" data-reveal role="img" aria-label="Diagram: your phone keeps the database and backs up straight to your own PC over Wi-Fi or USB. No server sits in between.">
            <div className="node" aria-hidden>
              <div className="node-phone">
                <i />
                <span>Your phone</span>
                <small>Database on the device</small>
                <ul>
                  <li>Workouts</li>
                  <li>Recovery</li>
                  <li>History</li>
                </ul>
              </div>
            </div>
            <div className="wire" aria-hidden>
              <span>Wi-Fi or USB</span>
              <svg viewBox="0 0 120 12" preserveAspectRatio="none">
                <path d="M2 6h116" />
              </svg>
              <small>Backup and restore. No server in between.</small>
            </div>
            <div className="node" aria-hidden>
              <div className="node-pc">
                <span>Your PC</span>
                <small>Hevier Sync</small>
                <code>~/HevierBackup</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
