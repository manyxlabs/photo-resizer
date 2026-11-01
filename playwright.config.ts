import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results/playwright',
  use: {
    baseURL: 'http://localhost:4330',
    // Set CHROMIUM to a system browser where Playwright's own download is unavailable.
    launchOptions: { executablePath: process.env.CHROMIUM || undefined },
  },
  webServer: { command: 'npm run build && npx astro preview --port 4330 --ignore-lock', port: 4330, reuseExistingServer: false },
});
