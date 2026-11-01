# manyxlabs.com

The Manyx Labs website, built with Astro as a static site with no client-side JavaScript.

```bash
npm install
npm run dev     # http://localhost:4321
npm run check   # type-check
npm run build   # static output in dist/
npm run test:e2e  # builds, serves and drives the tools in a real browser
```

Tools are listed in `src/data/tools.ts`.
A tool marked `live` must have an `href`, and the type rejects one without it.
Contact links live in `src/site.ts`.

E2E runs leave every generated file and a screenshot per case in `test-results/artifacts/`.
Where Playwright's own browser is unavailable, point it at a system one with `CHROMIUM=/usr/bin/chromium`.
