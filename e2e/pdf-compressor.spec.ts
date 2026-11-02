import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { PDFDocument, PDFHexString, StandardFonts } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const ARTIFACTS = 'test-results/artifacts';
mkdirSync(ARTIFACTS, { recursive: true });

const A4: [number, number] = [595.28, 841.89];
type Made = { name: string; mimeType: string; buffer: Buffer };

/** Noise defeats JPEG compression, so a page carrying it makes a PDF far bigger than any form allows. */
async function noisyJpeg(page: Page, width: number, height: number, type = 'image/jpeg'): Promise<Buffer> {
  const b64 = await page.evaluate(
    async ({ width, height, type }) => {
      const c = new OffscreenCanvas(width, height);
      const g = c.getContext('2d')!;
      const px = g.createImageData(width, height);
      for (let i = 0; i < px.data.length; i++) px.data[i] = (i + 1) % 4 === 0 ? 255 : Math.random() * 255;
      g.putImageData(px, 0, 0);
      const bytes = new Uint8Array(await (await c.convertToBlob({ type, quality: 0.95 })).arrayBuffer());
      let s = '';
      for (const b of bytes) s += String.fromCharCode(b);
      return btoa(s);
    },
    { width, height, type },
  );
  return Buffer.from(b64, 'base64');
}

/** An A4 PDF with one line of text per page and, optionally, a full-page photo under it. */
async function makePdf(name: string, texts: string[], photo?: Buffer): Promise<Made> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const text of texts) {
    const page = doc.addPage(A4);
    if (photo) page.drawImage(await doc.embedJpg(photo), { x: 0, y: 0, width: A4[0], height: A4[1] });
    page.drawText(text, { x: 72, y: 760, size: 28, font });
  }
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

/** Each page's text and size, read the way a form portal's PDF check would. */
async function read(bytes: Buffer) {
  const doc = await getDocument({ data: new Uint8Array(bytes), standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/' }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const { items } = await page.getTextContent();
    const { width, height } = page.getViewport({ scale: 1 });
    pages.push({ text: items.map((i) => ('str' in i ? i.str : '')).join('').trim(), width: Math.round(width), height: Math.round(height) });
  }
  return pages;
}

async function setLimit(page: Page, kb: string) {
  if (['100', '200', '300', '500', '1000', '2000'].includes(kb)) return page.locator('#limit').selectOption(kb);
  await page.locator('#limit').selectOption('custom');
  await page.locator('#kb').fill(kb);
}

async function download(page: Page, name: string) {
  const link = page.getByRole('link', { name: 'Download PDF' });
  await expect(link).toBeVisible({ timeout: 60_000 });
  const [file] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const path = `${ARTIFACTS}/${name}.pdf`;
  copyFileSync(await file.path(), path);
  // Scrolled, the sticky header would be pictured halfway down a full-page screenshot.
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `${ARTIFACTS}/${name}.png`, fullPage: true });
  return { bytes: readFileSync(path), fileName: file.suggestedFilename() };
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tools/pdf-compressor/');
  // The dev server's toolbar is not part of the page people see.
  await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important }' });
});

test('a big scanned PDF is squeezed under 200 KB and keeps its pages', async ({ page }) => {
  const big = await makePdf('scan.pdf', ['Page one', 'Page two', 'Page three'], await noisyJpeg(page, 1240, 1754));
  expect(big.buffer.length).toBeGreaterThan(2_000_000);
  await setLimit(page, '200');
  await page.locator('#file').setInputFiles(big);
  const { bytes, fileName } = await download(page, 'big-under-200kb');
  expect(fileName).toBe('scan-compressed.pdf');
  expect(bytes.length).toBeLessThanOrEqual(200 * 1000);
  const pages = await read(bytes);
  expect(pages.map(({ width, height }) => [width, height])).toEqual(Array(3).fill([595, 842]));
  // The text was flattened into the picture, and the tool must have said so.
  expect(pages.every((p) => p.text === '')).toBe(true);
  await expect(page.locator('#result')).toContainText('the text can no longer be selected');
});

test('two PDFs and a photo, reordered, come out in the new order with their text', async ({ page }) => {
  const alpha = await makePdf('alpha.pdf', ['Alpha one', 'Alpha two']);
  const bravo = await makePdf('bravo.pdf', ['Bravo one']);
  // Landscape and PNG, so it must be re-encoded and put on a landscape A4 page.
  const photo = { name: 'photo.png', mimeType: 'image/png', buffer: await noisyJpeg(page, 400, 300, 'image/png') };
  await setLimit(page, '2000');
  await page.locator('#file').setInputFiles([alpha, bravo, photo]);
  await expect(page.locator('#files li')).toHaveCount(3);
  // From alpha, bravo, photo to bravo, photo, alpha.
  await page.getByRole('button', { name: 'Move down "alpha.pdf"' }).click();
  await page.getByRole('button', { name: 'Move down "alpha.pdf"' }).click();
  await expect(page.locator('#files strong')).toHaveText(['bravo.pdf', 'photo.png', 'alpha.pdf']);
  const { bytes, fileName } = await download(page, 'merged-reordered');
  expect(fileName).toBe('merged.pdf');
  expect(await read(bytes)).toEqual([
    { text: 'Bravo one', width: 595, height: 842 },
    { text: '', width: 842, height: 595 },
    { text: 'Alpha one', width: 595, height: 842 },
    { text: 'Alpha two', width: 595, height: 842 },
  ]);
  await expect(page.locator('#result')).toContainText('text kept');
});

test('a removed file is left out of the merge', async ({ page }) => {
  await setLimit(page, '500');
  await page.locator('#file').setInputFiles([await makePdf('a.pdf', ['Keep me']), await makePdf('b.pdf', ['Drop me'])]);
  await page.getByRole('button', { name: 'Remove "b.pdf"' }).click();
  await expect(page.locator('#files li')).toHaveCount(1);
  const { bytes, fileName } = await download(page, 'after-remove');
  expect(fileName).toBe('a-compressed.pdf');
  expect((await read(bytes)).map((p) => p.text)).toEqual(['Keep me']);
});

test('a small PDF that already fits keeps its text', async ({ page }) => {
  const small = await makePdf('letter.pdf', ['Hello from a text PDF']);
  await setLimit(page, '100');
  await page.locator('#file').setInputFiles(small);
  const { bytes } = await download(page, 'small-kept');
  expect((await read(bytes)).map((p) => p.text)).toEqual(['Hello from a text PDF']);
  await expect(page.locator('#result')).toContainText('text kept');
});

test('a limit no PDF can meet says how small it could get and offers no file', async ({ page }) => {
  await setLimit(page, '5');
  await page.locator('#file').setInputFiles(await makePdf('scan.pdf', ['A', 'B', 'C', 'D'], await noisyJpeg(page, 1240, 1754)));
  await expect(page.locator('#result')).toContainText(/come to about [\d.]+ KB, over the 5 KB limit/, { timeout: 60_000 });
  await expect(page.getByRole('link', { name: 'Download PDF' })).toBeHidden();
  await page.screenshot({ path: `${ARTIFACTS}/impossible-limit.png`, fullPage: true });
});

test('a file that is neither a PDF nor an image gets a clear message', async ({ page }) => {
  await page.locator('#file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.locator('#file-error')).toContainText(`Couldn't open "notes.txt"`);
  await expect(page.locator('#files')).toBeHidden();
  await expect(page.locator('#out')).toBeHidden();
});

test('a password-protected PDF is named as such', async ({ page }) => {
  // An Encrypt entry whose check value no password matches, so pdf.js asks for one.
  const doc = await PDFDocument.create();
  doc.addPage(A4);
  const junk = PDFHexString.of('ab'.repeat(32));
  doc.context.trailerInfo.Encrypt = doc.context.register(doc.context.obj({ Filter: 'Standard', V: 1, R: 2, O: junk, U: junk, P: -4 }));
  doc.context.trailerInfo.ID = doc.context.obj([PDFHexString.of('00'.repeat(16)), PDFHexString.of('00'.repeat(16))]);
  const buffer = Buffer.from(await doc.save({ useObjectStreams: false }));
  await page.locator('#file').setInputFiles({ name: 'locked.pdf', mimeType: 'application/pdf', buffer });
  await expect(page.locator('#file-error')).toContainText('"locked.pdf" is password-protected');
  await expect(page.locator('#files')).toBeHidden();
});

test('more than 100 pages is refused with the reason', async ({ page }) => {
  await page.locator('#file').setInputFiles([
    await makePdf('first.pdf', Array.from({ length: 60 }, (_, i) => `First ${i}`)),
    await makePdf('second.pdf', Array.from({ length: 60 }, (_, i) => `Second ${i}`)),
  ]);
  await expect(page.locator('#file-error')).toContainText('"second.pdf" would take this to 120 pages. The limit is 100');
  await expect(page.locator('#files strong')).toHaveText(['first.pdf']);
});

for (const colorScheme of ['light', 'dark'] as const) {
  for (const [label, width, height] of [['phone', 390, 844], ['desktop', 1280, 900]] as const) {
    test(`the tool fits and reads well on a ${label} in ${colorScheme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ colorScheme });
      await setLimit(page, '1000');
      await page.locator('#file').setInputFiles([
        await makePdf('class-12-marksheet-with-a-really-long-file-name-from-the-board.pdf', ['Marksheet']),
        await makePdf('aadhaar.pdf', ['Aadhaar', 'Back']),
      ]);
      await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `${ARTIFACTS}/pdf-compressor-${label}-${colorScheme}.png`, fullPage: true });
    });
  }
}
