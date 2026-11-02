# Form Photo & Signature Resizer

Gets a photo or signature to the exact pixel size and file size that Indian exam, bank and PAN forms ask for, at [www.manyxlabs.com/tools/photo-resizer/](https://www.manyxlabs.com/tools/photo-resizer/).
It runs entirely in the browser: nothing is uploaded.
It opens JPEG, PNG, WebP, AVIF, iPhone HEIC and scanner TIFF files and always hands back a JPG.

The per-exam size guides at [/photo-size/](https://www.manyxlabs.com/photo-size/) come from the same data as the presets, `src/data/formSpecs.ts`, with each exam's official source.

```bash
npm install
npm run dev       # http://localhost:4321
npm run check     # type-check
npm run build     # static output in dist/
npm run test:e2e  # builds, serves and drives the tool in a real browser
```

E2E runs leave every generated file and a screenshot per case in `test-results/artifacts/`.
Where Playwright's own browser is unavailable, point it at a system one with `CHROMIUM=/usr/bin/chromium`.

## How it is served

This is its own Cloudflare Worker, `photo-resizer`, with no route or domain of its own.
The website Worker ([manyxlabs/website](https://github.com/manyxlabs/website)) forwards `/tools/photo-resizer*`, `/photo-size*`, `/_resizer/*` and `/sitemap-resizer-*` to it through a service binding, so the tool keeps its URLs on www.manyxlabs.com.
Its bundles live under `/_resizer/` and its sitemap is `sitemap-resizer-index.xml`, so nothing collides with the website's own files.
The header, footer and layout are copies of the website's; change both together.

Each push to `main` is built and deployed by Cloudflare Workers Builds.
Once `/_resizer/build.txt` shows the pushed commit, `.github/workflows/indexnow.yml` submits this sitemap to IndexNow.

## License

MIT, see [LICENSE](LICENSE).
The HEIC decoder, [heic-to](https://github.com/hoppergee/heic-to), wraps libheif and is LGPL-3.0; it is bundled unmodified as its own file.
