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
The "under N KB" pages for photos, signatures and PDFs come from the limits in `src/data/tools.ts`.

## Languages

Every page is published in English, Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada and Malayalam.
English keeps its URLs (`/tools/...`, `/photo-size/...`); each other language mirrors them under its code, such as `/hi/tools/` or `/ml/photo-size/ibps/`.
The pages live in `src/pages/[...lang]/`, whose `lang` param is empty for English, and `src/i18n/locales.ts` lists the languages.
Each page names its language in `<html lang>`, links every language's version with `hreflang` (plus `x-default`, the English one), and the sitemap carries the same alternates.
The header's language menu links the same page in every language, keeping a tool's `?preset=`.

All copy lives in one catalogue per language in `src/i18n/`: `en.ts` is the source and its type, and every other file must match it key for key.
The build also fails when a translation drops or renames a `{placeholder}` or changes a list's length.
Client scripts get their strings as JSON on the tool's form, so no catalogue is bundled into them.
Dates and lists use `Intl` with the page's locale and Western digits (`hi-IN-u-nu-latn`).
Each language loads only its own script's Noto Sans font, self-hosted from `@fontsource-variable`.

Some text stays in English on purpose.
Rent receipts and GST invoices are documents for employers and the tax system, so they and their amounts in words are in English, and the form says so.
GST state names follow the GST registry, the IBPS declaration must be written in English, and a "Spec wrong?" email goes to the maintainer in English.
Every language shares the English share images.

Adding a language takes its code in `src/i18n/locales.ts` (and in the website's copy, whose Worker must forward its paths), a catalogue, and a font in `src/i18n/fonts.ts`.

Every page names a 1200 x 630 share image in `public/_resizer/og/`.
They are screenshots of `src/pages/og/[slug].astro`, which exists only in dev; after changing a title, a tool or a spec, run `npm run og` and commit the images.
The E2E suite fails on a page whose image is missing, a page left out of the sitemap or not linked, and a repeated title or description.

The face finder and background remover (MediaPipe) and the OCR (Tesseract) run in the browser too.
Their models are served from `public/_resizer/models/`, and their runtimes are fetched only when a tool needs them.

```bash
npm install
npm run dev       # http://localhost:4321
npm run check     # type-check
npm run build     # static output in dist/
npm run test:e2e  # builds, serves and drives every tool in a real browser
npm run og        # rebuilds the share images (set CHROMIUM as below if needed)
```

E2E runs leave every generated file and a screenshot per case in `test-results/artifacts/`.
Where Playwright's own browser is unavailable, point it at a system one with `CHROMIUM=/usr/bin/chromium`.

## Design

The look follows the founder's portfolio at [www.manishonai.in](https://www.manishonai.in/) (`src/index.css` in its repo): its colour tokens, glass, buttons, chips and motion are copied as plain CSS into `src/layouts/Base.astro`.
That block is identical in this repo and the website (manyxlabs/website), and so is `src/components/Header.astro`, because both are served on www.manyxlabs.com; change them in both.
Colour stays neutral: the emerald accent marks only eyebrows, links, status dots, focus rings and the scroll bar, and light-theme accent text uses a deeper emerald so it meets WCAG AA.
The `dark` class on `<html>` picks the theme, saved in `localStorage` under `theme` and otherwise taken from the system, and a head script applies it before first paint.
Text is Geist and Geist Mono, self-hosted from `@fontsource-variable`, with each language's Noto Sans after them.
Tool forms stay calm: glass panels and opaque inputs, with no reveal or spotlight; the hubs and guides get both.

## How it is served

This is its own Cloudflare Worker, `photo-resizer`, with no route or domain of its own.
The website Worker ([manyxlabs/website](https://github.com/manyxlabs/website)) forwards `/tools*`, `/photo-size*`, the same paths under each language prefix (such as `/hi/tools*`), `/_resizer/*` and `/sitemap-resizer-*` to it through a service binding, so the tools live on www.manyxlabs.com.
Each language's 404 page is built at `/<code>/404.html`, where Cloudflare's nearest-404 lookup finds it.
Its bundles live under `/_resizer/` and its sitemap is `sitemap-resizer-index.xml`, so nothing collides with the website's own files.
The header, footer and layout are copies of the website's; change both together.

Each push to `main` is built and deployed by Cloudflare Workers Builds.
Once `/_resizer/build.txt` shows the pushed commit, `.github/workflows/indexnow.yml` submits this sitemap to IndexNow.

## License

MIT, see [LICENSE](LICENSE).
The HEIC decoder, [heic-to](https://github.com/hoppergee/heic-to), wraps libheif and is LGPL-3.0; it is bundled unmodified as its own file.
pdf.js, pdf-lib, MediaPipe Tasks (with its selfie segmenter and BlazeFace models) and Tesseract.js (with its English data) are Apache-2.0 or MIT.
The portrait in `e2e/fixtures/face.jpg` is a NASA photo in the public domain.
