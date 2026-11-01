import { writeFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// Published as /build.txt so the IndexNow workflow can tell when a push is actually
// live. Vercel and Cloudflare Pages each name the commit in their own variable.
const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.CF_PAGES_COMMIT_SHA ?? '';

export default defineConfig({
  site: 'https://www.manyxlabs.com',
  integrations: [
    sitemap({ filter: (page) => !page.endsWith('/404/') }),
    { name: 'build-id', hooks: { 'astro:build:done': ({ dir }) => writeFileSync(new URL('build.txt', dir), commit) } },
  ],
  vite: {
    // The HEIC decoder (libheif, 3 MB) is its own chunk, fetched only when someone picks
    // a HEIC file; every other chunk is far under the default limit.
    build: { chunkSizeWarningLimit: 3200 },
  },
});
