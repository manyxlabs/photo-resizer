import { mkdirSync, writeFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// These pages are served at www.manyxlabs.com alongside the website (manyxlabs/website),
// whose Worker forwards /tools*, /photo-size*, /_resizer/* and /sitemap-resizer-* here. Every other path on that host is the website's, so this build
// keeps its bundles, sitemap and build id under names the website never uses.
const commit = process.env.WORKERS_CI_COMMIT_SHA ?? '';

export default defineConfig({
  site: 'https://www.manyxlabs.com',
  build: { assets: '_resizer' },
  integrations: [
    sitemap({ filenameBase: 'sitemap-resizer', filter: (page) => !page.endsWith('/404/') }),
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
  ],
  vite: {
    // The HEIC decoder (libheif, 3 MB) is its own chunk, fetched only when someone picks
    // a HEIC file; every other chunk is far under the default limit.
    build: { chunkSizeWarningLimit: 3200 },
  },
});
