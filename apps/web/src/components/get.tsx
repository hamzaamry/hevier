import type { CSSProperties } from 'react';
import { CTA, HAS_APK_RELEASE, SITE } from '@/lib/site';
import { ArrowRightIcon, DownloadIcon, GithubIcon, TerminalIcon } from './icons';

export function Get() {
  return (
    <section id="get" data-section="get" className="section get" aria-labelledby="get-title">
      <div className="wrap">
        <h2 id="get-title" className="stack stack-lg" data-reveal>
          <span>{HAS_APK_RELEASE ? 'Free to download.' : 'Free to run.'}</span>
          <span>Open to read.</span>
        </h2>
        <div className="get-grid">
          <article className="card glass" data-reveal>
            <p className="eyebrow">Android</p>
            <h3 className="h3">{HAS_APK_RELEASE ? 'Download the APK.' : 'Build it from source.'}</h3>
            <p className="lead">
              {HAS_APK_RELEASE
                ? 'Grab the latest build from the GitHub releases page. No account, no store sign-in.'
                : 'There is no APK release yet. The README shows how to build and install it on your phone. Releases will appear on GitHub.'}
            </p>
            <div className="cta-row">
              <a href={CTA.href} className="btn btn-primary">
                {HAS_APK_RELEASE ? <DownloadIcon size={18} /> : <TerminalIcon size={18} />}
                {CTA.label}
              </a>
            </div>
            <div className="ios">
              <p className="eyebrow">iOS</p>
              <p>Coming to iOS. It is in progress, with no release date yet.</p>
            </div>
          </article>
          <article className="card glass" data-reveal style={{ '--d': '100ms' } as CSSProperties}>
            <p className="eyebrow">Open source</p>
            <h3 className="h3">Read it. Fix it. Make it yours.</h3>
            <p className="lead">
              AGPL-3.0. Pull requests are welcome, and the exercise catalogue takes one file per exercise.
            </p>
            <pre className="code" tabIndex={0} aria-label="Commands to run Hevier from source">
              <code>
                <span>$ </span>git clone {SITE.repo}
                {'\n'}
                <span>$ </span>pnpm install{'\n'}
                <span>$ </span>pnpm android
              </code>
            </pre>
            <div className="cta-row">
              <a href={SITE.repo} className="btn btn-glass btn-sm">
                <GithubIcon size={18} />
                View the code
              </a>
              <a href={SITE.contributing} className="btn btn-glass btn-sm">
                Contribute
                <ArrowRightIcon size={16} />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
