import { mkdirSync, renameSync, rmdirSync, writeFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { LOCALES } from './src/i18n/locales';

// These pages are served at www.manyxlabs.com alongside the website (manyxlabs/website),
// whose Worker forwards /tools*, /photo-size*, /_resizer/* and /sitemap-resizer-* here.
// Every other path on that host is the website's, so this build keeps its bundles,
// sitemap and build id under names the website never uses.
const commit = process.env.WORKERS_CI_COMMIT_SHA ?? '';

export default defineConfig({
  site: 'https://www.manyxlabs.com',
  build: { assets: '_resizer' },
  integrations: [
    sitemap({
      filenameBase: 'sitemap-resizer',
      filter: (page) => !page.endsWith('/404/'),
      i18n: { defaultLocale: 'en', locales: Object.fromEntries(LOCALES.map((l) => [l, l])) },
    }),
    {
      // The IndexNow workflow waits on this to tell when a push is live.
      name: 'build-id',
      hooks: {
        'astro:build:done': ({ dir }) => {
          mkdirSync(new URL('_resizer/', dir), { recursive: true });
          writeFileSync(new URL('_resizer/build.txt', dir), commit);
        },
      },
    },
    {
      // Cloudflare answers a missing page with the nearest 404.html up the path, so each language's
      // 404 goes where /<l>/no-such-page/ finds it; Astro builds only English's at /404.html.
      name: 'localized-404',
      hooks: {
        'astro:build:done': ({ dir }) => {
          for (const l of LOCALES.filter((l) => l !== 'en')) {
            renameSync(new URL(`${l}/404/index.html`, dir), new URL(`${l}/404.html`, dir));
            rmdirSync(new URL(`${l}/404/`, dir));
          }
        },
      },
    },
  ],
  vite: {
    // The HEIC decoder (libheif, 3 MB) is its own chunk, fetched only when someone picks
    // a HEIC file; every other chunk is far under the default limit.
    build: { chunkSizeWarningLimit: 3200 },
  },
});
