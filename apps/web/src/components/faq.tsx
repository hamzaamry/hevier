import type { ReactNode } from 'react';
import { HAS_APK_RELEASE, SITE } from '@/lib/site';
import { PlusIcon } from './icons';

interface Item {
  q: string;
  a: ReactNode;
}

export const FAQ_ITEMS: Item[] = [
  {
    q: 'Is Hevier really free?',
    a: (
      <p>
        Yes. Every feature is free: the charts, the set counts, the recovery map and the full history. There is no
        subscription, no ads and no account. It is open source under the AGPL-3.0.
      </p>
    ),
  },
  {
    q: 'Is this the Hevy app?',
    a: (
      <p>
        No. Hevier is an unofficial hobby project inspired by Hevy. It is not affiliated with, endorsed by or connected to
        Hevy or its makers, and it contains no Hevy code or assets. Hevy is their trademark.
      </p>
    ),
  },
  {
    q: 'Is there an iOS version?',
    a: (
      <p>
        Not yet. Hevier runs on Android today. An iOS version is in progress, with no release date. The widgets and the
        workout notification will need to be rebuilt for iOS, so it takes time.
      </p>
    ),
  },
  {
    q: 'How do I install it?',
    a: (
      <p>
        {HAS_APK_RELEASE ? (
          <>
            Download the APK from the <a href={SITE.releases}>GitHub releases page</a>, open it, and allow installs from
            your browser or file manager when Android asks. You can also build it yourself from the source.
          </>
        ) : (
          <>
            There is no APK release yet. Build it from source with the steps in the{' '}
            <a href={SITE.getStarted}>README</a>, then install it on your phone. Releases will show up on{' '}
            <a href={SITE.releases}>GitHub</a>.
          </>
        )}
      </p>
    ),
  },
  {
    q: 'What if I lose my phone?',
    a: (
      <p>
        Your data lives on the phone, so back it up. Hevier Sync is a small program for your PC that keeps a backup over
        Wi-Fi or a USB cable and can restore it. Backups go to a folder you own.
      </p>
    ),
  },
  {
    q: 'Can I bring my history from Hevy?',
    a: (
      <p>
        Yes, from a Hevy CSV export. Today it loads through a script on your computer with the phone connected by USB, and
        the steps are in the <a href={SITE.readme}>README</a>. It replaces the app’s data on the device, so do it before
        you start logging. Hevy’s export has workouts only, so make your routines again in the app.
      </p>
    ),
  },
  {
    q: 'Is the science real?',
    a: (
      <>
        <p>
          Each rule links to the study it comes from, and the notes say where the research is thin. The recovery windows
          come from small studies and are estimates. One study found no difference between sets to failure and sets
          stopped short.
        </p>
        <p>
          Read <a href={SITE.scienceRecovery}>the recovery notes</a> and{' '}
          <a href={SITE.scienceSets}>the set notes</a>.
        </p>
      </>
    ),
  },
  {
    q: 'Why are there no exercise pictures?',
    a: (
      <p>
        The stills and clips that come with the open exercise catalogue are licensed to its author only, so they cannot be
        shared with Hevier. The app shows a placeholder. The 5,500+ names, muscles and instructions are all there.
      </p>
    ),
  },
  {
    q: 'Does this website track me?',
    a: <p>No. No analytics, no cookies and no third-party scripts. The page only loads files from its own server.</p>,
  },
  {
    q: 'Who makes it?',
    a: (
      <p>
        It is a hobby project, built in the open. Bug reports and pull requests are welcome on{' '}
        <a href={SITE.repo}>GitHub</a>. Read the <a href={SITE.contributing}>contributing guide</a> to start.
      </p>
    ),
  },
];

export function Faq() {
  return (
    <section id="faq" data-section="faq" className="section faq-section" aria-labelledby="faq-title">
      <div className="wrap faq-grid">
        <div className="section-head">
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title" className="h2">
            Questions, answered straight.
          </h2>
        </div>
        <div className="faq" data-reveal>
          {FAQ_ITEMS.map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <span className="plus" aria-hidden>
                  <PlusIcon />
                </span>
              </summary>
              <div className="answer">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
