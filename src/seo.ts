import { EMAIL, GITHUB } from './site';

const SITE = 'https://www.manyxlabs.com';

export const organization = {
  '@type': 'Organization',
  '@id': `${SITE}/#org`,
  name: 'Manyx Labs',
  url: `${SITE}/`,
  logo: `${SITE}/apple-touch-icon.png`,
  email: EMAIL,
  sameAs: [GITHUB],
};

export const breadcrumbs = (trail: [name: string, path: string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
});

// Made by `npm run og` from src/pages/og/[slug].astro; the E2E suite checks each one a page names exists.
export const ogImage = (slug: string) => `${SITE}/_resizer/og/${slug}.png`;
