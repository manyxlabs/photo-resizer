import { defineConfig } from '@playwright/test';

// PORT lets several checkouts run their suites side by side.
const port = Number(process.env.PORT ?? 4330);

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results/playwright',
  use: {
    baseURL: process.env.BASE_URL ?? `http://localhost:${port}`,
    // Set CHROMIUM to a system browser where Playwright's own download is unavailable.
    launchOptions: { executablePath: process.env.CHROMIUM || undefined },
  },
  // BASE_URL runs the suite against a deployed site instead, e.g. a new host before DNS moves.
  webServer: process.env.BASE_URL ? undefined : { command: `npm run build && npx astro preview --port ${port} --ignore-lock`, port, reuseExistingServer: false },
});
