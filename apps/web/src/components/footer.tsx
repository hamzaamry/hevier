import Image from 'next/image';
import { NAV_LINKS, SITE } from '@/lib/site';

export function Footer() {
  return (
    <footer className="footer" data-section="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <a href="#top" className="brand" aria-label="Hevier, back to top">
              <Image src="/screens/app-icon.webp" alt="" width={30} height={30} />
              Hevier
            </a>
            <p className="footer-tag">A free, open-source workout tracker. Train hard. Recover smart.</p>
          </div>
          <nav aria-label="Footer, site">
            <h2>Site</h2>
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
              <li>
                <a href="#run-recovery">Run Recovery</a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Footer, project">
            <h2>Project</h2>
            <ul>
              <li>
                <a href={SITE.repo}>GitHub</a>
              </li>
              <li>
                <a href={SITE.releases}>Releases</a>
              </li>
              <li>
                <a href={SITE.contributing}>Contributing</a>
              </li>
              <li>
                <a href={SITE.scienceDocs}>Science notes</a>
              </li>
              <li>
                <a href={SITE.license}>AGPL-3.0 licence</a>
              </li>
            </ul>
          </nav>
        </div>
        <p className="disclaimer" id="disclaimer">
          <b>Unofficial.</b> Hevier is a hobby project inspired by the Hevy app. It is not affiliated with, endorsed by or
          connected to Hevy or its makers. “Hevy” is their trademark. Hevier contains no Hevy code or assets.
        </p>
        <p className="credits">
          Body map from <a href="https://github.com/Jsplice/MuscleMap">MuscleMap</a> (MIT). Exercise catalogue from{' '}
          <a href="https://github.com/DuarteSantos8/openGym">openGym</a> (AGPL-3.0). Set in Geist, copyright 2023 Vercel,
          under the SIL Open Font License (<a href={`${SITE.repo}/blob/main/THIRD-PARTY-NOTICES.md`}>full text</a>). Android
          is a trademark of Google LLC. Hevier is free software under the AGPL-3.0. This site uses no cookies and no
          analytics. Recovery figures are estimates, not medical advice.
        </p>
      </div>
    </footer>
  );
}
