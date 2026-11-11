import { HAS_APK_RELEASE, SITE } from '@/lib/site';

export function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Hevier',
    description: SITE.description,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Android',
    isAccessibleForFree: true,
    license: 'https://www.gnu.org/licenses/agpl-3.0.html',
    ...(HAS_APK_RELEASE ? { downloadUrl: SITE.releases } : {}),
    url: SITE.url,
    sameAs: [SITE.repo],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
