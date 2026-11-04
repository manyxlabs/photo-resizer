import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const ARTIFACTS = 'test-results/artifacts';
mkdirSync(ARTIFACTS, { recursive: true });
const pdfjsBuild = (f: string) => readFileSync(createRequire(import.meta.url).resolve(`pdfjs-dist/build/${f}`), 'utf8');

// Recognition loads a 4 MB core and the language data on first use.
test.setTimeout(120_000);
const OCR = { timeout: 90_000 };
// Chromium encodes a canvas to JPEG in idle time, which a busy machine may not have for seconds.
const ENCODE = { timeout: 30_000 };

type Rect = { x: number; y: number; w: number; h: number };

/** An Aadhaar-like card drawn in the browser, with where its first 8 and last 4 digits landed. */
async function makeCard(page: Page, number: string | null) {
  const { b64, hidden, kept } = await page.evaluate(async (number) => {
    const c = new OffscreenCanvas(1200, 760);
    const g = c.getContext('2d')!;
    g.fillStyle = '#f7f3e8';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#111';
    g.font = '600 40px sans-serif';
    g.fillText('Government of India', 80, 110);
    g.font = '34px sans-serif';
    g.fillText('Asha Kumari', 80, 260);
    g.fillText('DOB: 14/08/1991', 80, 320);
    g.fillText('Female', 80, 380);
    let hidden = null;
    let kept = null;
    if (number) {
      g.font = '700 64px sans-serif';
      const [x, y] = [300, 600];
      g.fillText(number, x, y);
      const m = g.measureText(number);
      const top = y - m.actualBoundingBoxAscent;
      const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const first = g.measureText(number.slice(0, 9)).width;
      const lastStart = g.measureText(number.slice(0, 10)).width;
      hidden = { x, y: top, w: first, h };
      kept = { x: x + lastStart, y: top, w: m.width - lastStart, h };
    }
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer());
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return { b64: btoa(s), hidden, kept };
  }, number);
  return { file: { name: 'aadhaar.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') }, hidden, kept };
}

async function save(page: Page, name: string) {
  const link = page.locator('#download');
  await expect(link).toBeVisible(ENCODE);
  const [file] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const path = `${ARTIFACTS}/${name}`;
  copyFileSync(await file.path(), path);
  await page.screenshot({ path: `${path}.png`, fullPage: true });
  return { bytes: readFileSync(path), fileName: file.suggestedFilename() };
}

/** Shares of dark (near black) and light pixels inside each rect of a JPEG. */
async function shades(page: Page, jpeg: Buffer, rects: Rect[]) {
  return page.evaluate(
    async ({ b64, rects }) => {
      const img = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))]));
      const g = new OffscreenCanvas(img.width, img.height).getContext('2d')!;
      g.drawImage(img, 0, 0);
      return {
        size: [img.width, img.height],
        rects: rects.map((r) => {
          const d = g.getImageData(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h)).data;
          let dark = 0;
          let light = 0;
          for (let i = 0; i < d.length; i += 4) {
            const sum = d[i]! + d[i + 1]! + d[i + 2]!;
            if (sum < 90) dark++;
            if (sum > 600) light++;
          }
          return { dark: dark / (d.length / 4), light: light / (d.length / 4) };
        }),
      };
    },
    { b64: jpeg.toString('base64'), rects },
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tools/aadhaar-masker/');
});

test('a card photo has the first 8 digits found and blacked out, and the last 4 left readable', async ({ page }) => {
  const { file, hidden, kept } = await makeCard(page, '2345 6789 0123');
  await page.locator('#file').setInputFiles(file);
  await expect(page.locator('#detect')).toContainText('Found the Aadhaar number in one place', OCR);
  await page.screenshot({ path: `${ARTIFACTS}/aadhaar-card-detected.png`, fullPage: true });
  const { bytes, fileName } = await save(page, 'aadhaar-card-masked.jpg');
  expect(fileName).toBe('aadhaar-masked.jpg');
  const { size, rects } = await shades(page, bytes, [hidden!, kept!]);
  expect(size).toEqual([1200, 760]);
  expect(rects[0]!.dark).toBeGreaterThan(0.98);
  // Paper with the digits' ink on it: mostly light, some dark.
  expect(rects[1]!.light).toBeGreaterThan(0.4);
  expect(rects[1]!.dark).toBeGreaterThan(0.05);
});

test('an e-Aadhaar style PDF is masked everywhere and comes back with no text in it', async ({ page }) => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p = doc.addPage([595, 842]);
  const lines: Rect[] = [];
  for (const [label, y, size] of [['Your Aadhaar No. : ', 600, 14], ['Aadhaar no. ', 200, 20]] as const) {
    p.drawText(label + '2345 6789 0123', { x: 60, y, size, font });
    // Helvetica's figures stand 0.7 em above the baseline.
    const [x, h] = [60 + font.widthOfTextAtSize(label, size), size * 0.7];
    const top = 842 - y - h;
    lines.push({ x, y: top, w: font.widthOfTextAtSize('2345 6789', size), h });
    lines.push({ x: x + font.widthOfTextAtSize('2345 6789 ', size), y: top, w: font.widthOfTextAtSize('0123', size), h });
  }
  p.drawText('Government of India', { x: 60, y: 760, size: 18, font });
  p.drawText('VID : 9123 4567 8901 2345', { x: 60, y: 560, size: 12, font });
  doc.addPage([400, 300]).drawText('Second page, nothing to hide', { x: 30, y: 150, size: 14, font });

  await page.locator('#file').setInputFiles({ name: 'eaadhaar.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) });
  await expect(page.locator('#detect')).toContainText('Found the Aadhaar number in 2 places', OCR);
  await expect(page.locator('#pdf-hint')).toBeVisible();
  const { bytes, fileName } = await save(page, 'eaadhaar-masked.pdf');
  expect(fileName).toBe('eaadhaar-masked.pdf');

  // Read back with pdf.js the way any viewer would, rendering page 1 at 2x.
  const out = await page.evaluate(
    async ({ b64, lib, worker }) => {
      const url = (src: string) => URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      const pdfjs = await import(url(lib));
      pdfjs.GlobalWorkerOptions.workerSrc = url(worker);
      const doc = await pdfjs.getDocument({ data: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) }).promise;
      const pages = [];
      let text = '';
      for (let n = 1; n <= doc.numPages; n++) {
        const pg = await doc.getPage(n);
        const { width, height } = pg.getViewport({ scale: 1 });
        pages.push([Math.round(width), Math.round(height)]);
        text += (await pg.getTextContent()).items.map((i: { str?: string }) => i.str ?? '').join('');
      }
      const pg = await doc.getPage(1);
      const viewport = pg.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await pg.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
      const jpeg = canvas.toDataURL('image/jpeg', 0.95).split(',')[1]!;
      return { pages, text, jpeg };
    },
    { b64: bytes.toString('base64'), lib: pdfjsBuild('pdf.min.mjs'), worker: pdfjsBuild('pdf.worker.min.mjs') },
  );
  expect(out.pages).toEqual([
    [595, 842],
    [400, 300],
  ]);
  expect(out.text).toBe('');
  const { rects } = await shades(
    page,
    Buffer.from(out.jpeg, 'base64'),
    // pdf.js substitutes its own Helvetica, whose glyphs sit up to 2 pt off pdf-lib's metrics; stay inside them.
    lines.map((r) => ({ x: (r.x + 2) * 2, y: r.y * 2, w: (r.w - 4) * 2, h: r.h * 2 })),
  );
  for (const [i, r] of rects.entries()) {
    if (i % 2 === 0) expect(r.dark, `first 8 digits, number ${i / 2 + 1}`).toBeGreaterThan(0.98);
    else expect(r.light, `last 4 digits, number ${(i + 1) / 2}`).toBeGreaterThan(0.3);
  }
});

test('a dragged box hides an area, a tap removes it, and Undo brings it back', async ({ page }) => {
  const { file } = await makeCard(page, null);
  await page.locator('#file').setInputFiles(file);
  await expect(page.locator('#detect')).toContainText("Couldn't find an Aadhaar number", OCR);
  const view = page.locator('#pages canvas');
  await view.scrollIntoViewIfNeeded();
  const box = (await view.boundingBox())!;
  // The name line, at 80..280 × 225..270 in the card's pixels.
  const k = box.width / 1200;
  await page.mouse.move(box.x + 70 * k, box.y + 220 * k);
  await page.mouse.down();
  await page.mouse.move(box.x + 200 * k, box.y + 250 * k, { steps: 4 });
  await page.mouse.move(box.x + 300 * k, box.y + 275 * k, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator('#result')).toContainText('1 area hidden', ENCODE);
  const name = { x: 90, y: 232, w: 180, h: 34 };
  expect((await shades(page, (await save(page, 'manual-box.jpg')).bytes, [name])).rects[0]!.dark).toBeGreaterThan(0.98);

  // Downloading scrolls the page, so find the canvas again.
  await view.scrollIntoViewIfNeeded();
  const now = (await view.boundingBox())!;
  await page.mouse.click(now.x + 150 * k, now.y + 245 * k);
  await expect(page.locator('#result')).toContainText('0 areas hidden', ENCODE);
  expect((await shades(page, (await save(page, 'manual-box-removed.jpg')).bytes, [name])).rects[0]!.light).toBeGreaterThan(0.5);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('#result')).toContainText('1 area hidden', ENCODE);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('#result')).toContainText('0 areas hidden', ENCODE);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
});

test('the note is written across the copy', async ({ page }) => {
  const { file } = await makeCard(page, null);
  await page.locator('#file').setInputFiles(file);
  await expect(page.locator('#result')).toContainText('0 areas hidden', ENCODE);
  const before = await save(page, 'note-before.jpg');
  await page.locator('#note').fill('For KYC with ABC Bank only, 2 Nov 2026');
  await expect(page.locator('#download')).toBeHidden();
  const after = await save(page, 'note-after.jpg');
  // The middle of the card is blank paper until the note crosses it in red.
  const middle = { x: 560, y: 360, w: 80, h: 40 };
  const red = async (b: Buffer) =>
    page.evaluate(
      async ({ b64, r }) => {
        const img = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))]));
        const g = new OffscreenCanvas(img.width, img.height).getContext('2d')!;
        g.drawImage(img, 0, 0);
        const d = g.getImageData(r.x, r.y, r.w, r.h).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i]! - d[i + 2]! > 60) n++;
        return n;
      },
      { b64: b.toString('base64'), r: middle },
    );
  expect(await red(before.bytes)).toBe(0);
  expect(await red(after.bytes)).toBeGreaterThan(50);
});

test('a password-locked PDF says how to unlock it', async ({ page }) => {
  await page.locator('#file').setInputFiles('e2e/fixtures/locked.pdf');
  await expect(page.locator('#file-error')).toContainText('is locked with a password');
  await expect(page.locator('#edit')).toBeHidden();
});

test('a file that is not an image or PDF gets a clear message', async ({ page }) => {
  await page.locator('#file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.locator('#file-error')).toContainText(`Couldn't open "notes.txt"`);
  await expect(page.locator('#edit')).toBeHidden();
});

for (const [width, label] of [
  [390, 'phone'],
  [1280, 'desktop'],
] as const) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`it fits a ${label} in ${scheme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: scheme });
      await page.reload();
      const { file } = await makeCard(page, '2345 6789 0123');
      await page.locator('#file').setInputFiles(file);
      await expect(page.locator('#detect')).toContainText('Found', OCR);
      await page.locator('#note').fill('For KYC with ABC Bank only, 2 Nov 2026');
      await expect(page.locator('#download')).toBeVisible();
      await page.locator('#note').blur();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `${ARTIFACTS}/aadhaar-${label}-${scheme}.png`, fullPage: true });
    });
  }
}
