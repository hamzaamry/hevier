const REPO = 'https://github.com/hamzaamry/hevier';

function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL) {
    throw new Error('Set NEXT_PUBLIC_SITE_URL: a Vercel build needs the real site URL for canonical links and the share image.');
  }
  return 'http://localhost:4310';
}

// Flip with NEXT_PUBLIC_HAS_APK_RELEASE=true once the releases page has an APK to download.
export const HAS_APK_RELEASE = process.env.NEXT_PUBLIC_HAS_APK_RELEASE === 'true';

export const SITE = {
  name: 'Hevier',
  url: siteUrl(),
  title: 'Hevier: a free workout tracker that shows what has recovered',
  description:
    'Free, open-source workout tracker for Android. A recovery map, set counts backed by studies, no account, no ads, no subscription. Your data stays on your phone.',
  repo: REPO,
  releases: `${REPO}/releases`,
  issues: `${REPO}/issues`,
  contributing: `${REPO}/blob/main/CONTRIBUTING.md`,
  license: `${REPO}/blob/main/LICENSE`,
  scienceDocs: `${REPO}/tree/main/docs/science`,
  scienceRecovery: `${REPO}/blob/main/docs/science/recovery.md`,
  scienceSets: `${REPO}/blob/main/docs/science/sets.md`,
  readme: `${REPO}#readme`,
  getStarted: `${REPO}#getting-started`,
} as const;

export const CTA = HAS_APK_RELEASE
  ? { label: 'Download for Android', navLabel: 'Get the APK', href: SITE.releases }
  : { label: 'Build from source', navLabel: 'Get Hevier', href: SITE.getStarted };

export const NAV_LINKS = [
  { href: '#sets', label: 'Sets' },
  { href: '#week', label: 'Your week' },
  { href: '#science', label: 'Science' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#faq', label: 'FAQ' },
] as const;
