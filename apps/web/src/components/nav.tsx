import Image from 'next/image';
import { CTA, HAS_APK_RELEASE, NAV_LINKS } from '@/lib/site';
import { DownloadIcon, TerminalIcon } from './icons';

export function Nav() {
  return (
    <header className="nav">
      <div className="nav-bar glass">
        <a href="#top" className="brand" aria-label="Hevier, back to top">
          <Image src="/screens/app-icon.webp" alt="" width={30} height={30} priority />
          Hevier
        </a>
        <nav aria-label="Sections" className="nav-links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a href={CTA.href} className="btn btn-primary btn-sm">
          {HAS_APK_RELEASE ? <DownloadIcon size={16} /> : <TerminalIcon size={16} />}
          {CTA.navLabel}
        </a>
      </div>
    </header>
  );
}
