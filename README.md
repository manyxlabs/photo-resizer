# manyxlabs.com

The Manyx Labs website, built with Astro as a static site.
Only the tool pages ship JavaScript.

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
Form presets and the `/photo-size/` guides both come from `src/data/formSpecs.ts`, with each exam's official source.
Search metadata (sitemap, `robots.txt`, schema.org data) is built from `src/seo.ts` and `astro.config.mjs`.

E2E runs leave every generated file and a screenshot per case in `test-results/artifacts/`.
Where Playwright's own browser is unavailable, point it at a system one with `CHROMIUM=/usr/bin/chromium`.

## License

MIT, see [LICENSE](LICENSE).
The HEIC decoder, [heic-to](https://github.com/hoppergee/heic-to), wraps libheif and is LGPL-3.0; it is bundled unmodified as its own file.
