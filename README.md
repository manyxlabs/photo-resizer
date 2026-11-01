# manyxlabs.com

The Manyx Labs website, built with Astro as a static site with no client-side JavaScript.

```bash
npm install
npm run dev     # http://localhost:4321
npm run check   # type-check
npm run build   # static output in dist/
```

Tools are listed in `src/data/tools.ts`.
A tool marked `live` must have an `href`, and the type rejects one without it.
Contact links live in `src/site.ts`.
