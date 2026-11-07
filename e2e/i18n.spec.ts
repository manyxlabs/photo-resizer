import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { catalogues } from '../src/i18n';
import en from '../src/i18n/en';
import { LOCALES, NAMES, type Locale } from '../src/i18n/locales';

const ARTIFACTS = 'test-results/artifacts';
mkdirSync(ARTIFACTS, { recursive: true });

const SITE = 'https://www.manyxlabs.com';
const OTHERS = LOCALES.filter((l) => l !== 'en');
// One of every kind of page: hub, guides, a guide, each tool, and size variants.
const PAGES = [
  '/tools/',
  '/photo-size/',
  '/photo-size/ibps/',
  '/tools/photo-resizer/',
  '/tools/photo-resizer/50-kb/',
  '/tools/signature-resizer/10-kb/',
  '/tools/passport-photo/',
  '/tools/pdf-compressor/200-kb/',
  '/tools/aadhaar-masker/',
  '/tools/rent-receipt/',
  '/tools/gst-invoice/',
];
const prefixed = (l: Locale, path: string) => (l === 'en' ? path : `/${l}${path}`);

const strings = (o: unknown): string[] =>
  typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(strings) : Object.values(o as object).flatMap(strings);

/**
 * English text that should be gone from a page in `l`: each catalogue string translated there, cut at its
 * {placeholders}. Single words are left out, since one can stand in a translation on purpose (PAN, Form 124).
 */
function english(l: Locale) {
  const theirs = strings(catalogues[l]);
  const found = new Set<string>();
  strings(en).forEach((s, i) => {
    if (s === theirs[i]) return;
    for (const piece of s.split(/\{\w+\}/)) {
      const words = piece.trim().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
      if (words.split(/\s+/).length >= 2) found.add(words);
    }
  });
  return [...found];
}

/** The page's own-language text: visible and hidden text, titles and labels, outside anything marked English. */
const pageText = (page: Page) =>
  page.evaluate(() => {
    const english = (el: Element | null) => el?.closest('[lang]')?.getAttribute('lang') === 'en';
    const out = [document.title, document.querySelector('meta[name=description]')!.getAttribute('content')!];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const parent = n.parentElement!;
      if (!parent.closest('script, style') && !english(parent)) out.push(n.textContent!);
    }
    for (const el of document.body.querySelectorAll('[aria-label], [title], [placeholder], [alt], optgroup[label]'))
      if (!english(el)) for (const a of ['aria-label', 'title', 'placeholder', 'alt', 'label']) out.push(el.getAttribute(a) ?? '');
    return out.join('\n').replace(/\s+/g, ' ');
  });

/** Elements whose text spills out of their own box, or past the screen's edge. */
const overflowing = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('header .bar, header nav > *, h1, h2, h3, button, .btn, summary, legend, label, .lang a')]
      .filter((el) => el.checkVisibility() && getComputedStyle(el).display !== 'inline')
      .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > innerWidth + 0.5)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}: ${el.textContent!.trim().slice(0, 40)}`),
  );

for (const l of OTHERS) {
  test.describe(`${NAMES[l]} (${l})`, () => {
    test('every page names its language, its alternates and its canonical URL', async ({ request }) => {
      const sitemap = new Set([...(await (await request.get('/sitemap-resizer-0.xml')).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
      for (const path of PAGES) {
        const html = await (await request.get(prefixed(l, path))).text();
        expect(/<html lang="([^"]+)"/.exec(html)?.[1], path).toBe(l);
        expect(/<link rel="canonical" href="([^"]+)"/.exec(html)?.[1], path).toBe(SITE + prefixed(l, path));
        const alternates = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
        expect(alternates, path).toEqual({
          ...Object.fromEntries(LOCALES.map((other) => [other, SITE + prefixed(other, path)])),
          'x-default': SITE + path,
        });
        // The sitemap is what the suite's crawl proves is served, so an alternate in it is reachable.
        for (const url of Object.values(alternates)) expect(sitemap.has(url), `${path} points at ${url}`).toBe(true);
        expect(/<meta property="og:locale" content="([^"]+)"/.exec(html)?.[1], path).toBe(`${l}_IN`);
      }
    });

    test('pages fit a phone and leave no English behind', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      const leaks = english(l);
      for (const path of PAGES) {
        await page.goto(prefixed(l, path));
        const text = await pageText(page);
        expect(leaks.filter((s) => text.includes(s)), `${path} still has English`).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${path} scrolls sideways`).toBeLessThanOrEqual(0);
        expect(await overflowing(page), `${path} overflows`).toEqual([]);
        // The menu lists the most text the header ever shows.
        await page.locator('.lang summary').click();
        expect(await overflowing(page), `${path} menu overflows`).toEqual([]);
        await page.keyboard.press('Escape');
      }
    });

    test("only this language's script font is fetched", async ({ page }) => {
      const fonts: string[] = [];
      page.on('request', (r) => r.resourceType() === 'font' && fonts.push(new URL(r.url()).pathname));
      await page.goto(prefixed(l, '/tools/photo-resizer/'));
      await page.evaluate(() => document.fonts.ready);
      const family = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--script'));
      const script = /Noto Sans (\w+)/.exec(family)![1]!.toLowerCase();
      expect(fonts.length).toBeGreaterThan(0);
      for (const f of fonts) expect(f, 'an unexpected font').toMatch(new RegExp(`/(geist-[\\w-]+|noto-sans-${script}-${script}-wght-normal)\\.[\\w-]+\\.woff2$`));
      expect(fonts.some((f) => f.includes(`noto-sans-${script}`))).toBe(true);
    });

    test('the tools speak the language while they work', async ({ page }) => {
      const t = catalogues[l];
      await page.goto(prefixed(l, '/tools/photo-resizer/'));
      await page.locator('#file').setInputFiles('e2e/fixtures/face.jpg');
      await expect(page.getByRole('link', { name: t.resizer.download })).toBeVisible({ timeout: 30_000 });
      // The quality or padding note is the script's own wording, added once the file is made.
      const filled = (template: string) => new RegExp(template.split(/\{\w+\}/).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\d+'));
      await expect(page.locator('#result')).toHaveText(new RegExp(`${filled(t.resizer.js.quality).source}|${filled(t.resizer.js.padded).source}`));

      await page.goto(prefixed(l, '/tools/gst-invoice/'));
      await page.locator('#s-gstin').fill('27AAPFU0939F1ZW');
      await expect(page.locator('#s-gstin-error')).toHaveText(t.gst.js.gstinCheck);
      await page.locator('#s-gstin').fill('00AAPFU0939F1ZW');
      await expect(page.locator('#s-gstin-error')).toHaveText(t.gst.js.gstinState.replace('{code}', '00'));
    });

    test('the language menu keeps you on the same page, and a missing page is a 404', async ({ page }) => {
      // From a guide's button, which opens the tool on a preset, to English and back.
      await page.goto(prefixed(l, '/photo-size/passport/'));
      await page.locator('main a.btn').first().click();
      await expect(page).toHaveURL(prefixed(l, '/tools/passport-photo/?preset=passport-photo'));
      await page.locator('.lang summary').click();
      await page.getByRole('link', { name: 'English', exact: true }).click();
      await expect(page).toHaveURL('/tools/passport-photo/?preset=passport-photo');
      await expect(page.locator('#preset')).toHaveValue('passport-photo');
      await page.locator('.lang summary').click();
      await page.getByRole('link', { name: NAMES[l], exact: true }).click();
      await expect(page).toHaveURL(prefixed(l, '/tools/passport-photo/?preset=passport-photo'));
      await expect(page.locator('html')).toHaveAttribute('lang', l);

      // `astro preview` answers with English's 404.html; Cloudflare serves the nearest one, /<l>/404.html,
      // which the website's suite checks through both Workers.
      expect((await page.goto(prefixed(l, '/tools/no-such-tool/')))!.status()).toBe(404);
    });

    test('a representative page looks right on a phone and a desktop, light and dark', async ({ page }) => {
      for (const [device, size] of [
        ['phone', { width: 360, height: 780 }],
        ['desktop', { width: 1280, height: 800 }],
      ] as const)
        for (const scheme of ['light', 'dark'] as const) {
          await page.setViewportSize(size);
          await page.emulateMedia({ colorScheme: scheme });
          await page.goto(prefixed(l, '/photo-size/ibps/'));
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({ path: `${ARTIFACTS}/i18n-${l}-${device}-${scheme}.png`, fullPage: true });
          await page.goto(prefixed(l, '/tools/photo-resizer/'));
          await page.locator('#file').setInputFiles('e2e/fixtures/face.jpg');
          await expect(page.getByRole('link', { name: catalogues[l].resizer.download })).toBeVisible({ timeout: 30_000 });
          await page.locator('.lang summary').click();
          await page.screenshot({ path: `${ARTIFACTS}/i18n-${l}-tool-${device}-${scheme}.png`, fullPage: true });
        }
    });
  });
}

test('the language menu works from the keyboard', async ({ page }) => {
  await page.goto('/hi/tools/');
  const summary = page.locator('.lang summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.lang')).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'English', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.lang')).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  for (let i = 0; i < LOCALES.indexOf('ml') + 1; i++) await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: NAMES.ml, exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/ml/tools/');
});
