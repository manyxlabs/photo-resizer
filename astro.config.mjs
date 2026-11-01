import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.manyxlabs.com',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') })],
  vite: {
    // The HEIC decoder (libheif, 3 MB) is its own chunk, fetched only when someone picks
    // a HEIC file; every other chunk is far under the default limit.
    build: { chunkSizeWarningLimit: 3200 },
  },
});
