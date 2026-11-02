# Manyx Labs free tools

Free tools for Indian forms and paperwork, at [www.manyxlabs.com/tools/](https://www.manyxlabs.com/tools/).
Each runs entirely in the browser: no file or detail is ever uploaded.

| Tool | Path | What it does |
| --- | --- | --- |
| Photo & signature resizer | `/tools/photo-resizer/` | Exact pixels and KB for exam, bank and PAN forms, from JPEG, PNG, WebP, AVIF, HEIC or TIFF. |
| Signature cleaner | `/tools/signature-resizer/` | Evens out the paper, trims to the ink and sets the ink colour. |
| Passport photo maker | `/tools/passport-photo/` | Frames the face, can replace the background with white, and makes a 6 x 4 inch print sheet. |
| PDF compressor & merger | `/tools/pdf-compressor/` | Merges PDFs and photos and fits them under a KB limit. |
| Aadhaar masker | `/tools/aadhaar-masker/` | Finds the Aadhaar number by OCR, hides its first 8 digits and flattens PDFs. |
| Rent receipt generator | `/tools/rent-receipt/` | Monthly receipts for HRA, printed or saved as PDF. |
| GST invoice generator | `/tools/gst-invoice/` | A Rule 46 tax invoice with CGST, SGST, UTGST or IGST. |

`src/data/tools.ts` lists them, and the hub page, "More free tools" links and breadcrumbs come from it.
The per-exam size guides at [/photo-size/](https://www.manyxlabs.com/photo-size/) come from the same data as the presets, `src/data/formSpecs.ts`, with each exam's official source.

The face finder and background remover (MediaPipe) and the OCR (Tesseract) run in the browser too.
Their models are served from `public/_resizer/models/`, and their runtimes are fetched only when a tool needs them.

```bash
npm install
npm run dev       # http://localhost:4321
npm run check     # type-check
npm run build     # static output in dist/
npm run test:e2e  # builds, serves and drives every tool in a real browser
```

E2E runs leave every generated file and a screenshot per case in `test-results/artifacts/`.
Where Playwright's own browser is unavailable, point it at a system one with `CHROMIUM=/usr/bin/chromium`.

## How it is served

This is its own Cloudflare Worker, `photo-resizer`, with no route or domain of its own.
The website Worker ([manyxlabs/website](https://github.com/manyxlabs/website)) forwards `/tools*`, `/photo-size*`, `/_resizer/*` and `/sitemap-resizer-*` to it through a service binding, so the tools live on www.manyxlabs.com.
Its bundles live under `/_resizer/` and its sitemap is `sitemap-resizer-index.xml`, so nothing collides with the website's own files.
The header, footer and layout are copies of the website's; change both together.

Each push to `main` is built and deployed by Cloudflare Workers Builds.
Once `/_resizer/build.txt` shows the pushed commit, `.github/workflows/indexnow.yml` submits this sitemap to IndexNow.

## License

MIT, see [LICENSE](LICENSE).
The HEIC decoder, [heic-to](https://github.com/hoppergee/heic-to), wraps libheif and is LGPL-3.0; it is bundled unmodified as its own file.
pdf.js, pdf-lib, MediaPipe Tasks (with its selfie segmenter and BlazeFace models) and Tesseract.js (with its English data) are Apache-2.0 or MIT.
The portrait in `e2e/fixtures/face.jpg` is a NASA photo in the public domain.
