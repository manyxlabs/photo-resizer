import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Every output file and a screenshot per case land here, so a run can be re-inspected by hand.
const ARTIFACTS = 'test-results/artifacts';
mkdirSync(ARTIFACTS, { recursive: true });

type Made = { name: string; mimeType: string; buffer: Buffer };

/** Draws a test image in the browser; noise defeats JPEG compression, flat ink compresses to almost nothing. */
async function makeImage(page: Page, kind: 'noisy' | 'flat', width: number, height: number): Promise<Made> {
  const b64 = await page.evaluate(
    async ({ kind, width, height }) => {
      const c = new OffscreenCanvas(width, height);
      const g = c.getContext('2d')!;
      if (kind === 'noisy') {
        const px = g.createImageData(width, height);
        for (let i = 0; i < px.data.length; i++) px.data[i] = (i + 1) % 4 === 0 ? 255 : Math.random() * 255;
        g.putImageData(px, 0, 0);
      } else {
        g.fillStyle = '#f4f1ea';
        g.fillRect(0, 0, width, height);
        g.fillStyle = '#111';
        g.font = `${Math.round(height / 3)}px serif`;
        g.fillText('Manish', width * 0.1, height * 0.6);
      }
      const blob = await c.convertToBlob({ type: 'image/png' });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (const b of bytes) s += String.fromCharCode(b);
      return btoa(s);
    },
    { kind, width, height },
  );
  return { name: `${kind}.png`, mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}

async function download(page: Page, name: string): Promise<Buffer> {
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Download JPG' }).click()]);
  const path = `${ARTIFACTS}/${name}.jpg`;
  copyFileSync(await file.path(), path);
  const bytes = readFileSync(path);
  await page.screenshot({ path: `${ARTIFACTS}/${name}.png`, fullPage: true });
  return bytes;
}

/** Decodes the file the user would upload, in the browser, to prove it is a valid JPEG of the right size. */
async function decode(page: Page, bytes: Buffer) {
  return page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const img = await createImageBitmap(new Blob([bin], { type: 'image/jpeg' }));
    return { width: img.width, height: img.height };
  }, bytes.toString('base64'));
}

const jfifDpi = (b: Buffer) => (b.toString('latin1', 6, 10) === 'JFIF' && b[13] === 1 ? b.readUInt16BE(14) : null);

test.beforeEach(async ({ page }) => {
  await page.goto('/tools/photo-resizer/');
});

test('a large camera-style photo is squeezed under the bank-exam limit', async ({ page }) => {
  await page.locator('#file').setInputFiles(await makeImage(page, 'noisy', 3000, 4000));
  await page.locator('#preset').selectOption('ibps-photo');
  const out = await download(page, 'ibps-photo');
  expect(await decode(page, out)).toEqual({ width: 200, height: 230 });
  expect(out.length).toBeGreaterThanOrEqual(20 * 1024);
  expect(out.length).toBeLessThanOrEqual(50 * 1000);
});

test('a plain signature is padded up to the minimum and still opens', async ({ page }) => {
  await page.locator('#file').setInputFiles(await makeImage(page, 'flat', 900, 300));
  await page.locator('#preset').selectOption('ibps-sign');
  await expect(page.locator('#clean')).toBeChecked();
  await expect(page.locator('#result')).toContainText('padded');
  const out = await download(page, 'ibps-signature');
  expect(await decode(page, out)).toEqual({ width: 140, height: 60 });
  expect(out.length).toBeGreaterThanOrEqual(10 * 1024);
  expect(out.length).toBeLessThanOrEqual(20 * 1000);
});

test('a custom size in cm comes out at the right pixels and states its DPI', async ({ page }) => {
  await page.locator('#file').setInputFiles(await makeImage(page, 'noisy', 1200, 1600));
  await page.locator('#preset').selectOption('custom');
  for (const [id, v] of [['w', '3.5'], ['h', '4.5'], ['dpi', '300'], ['min', '20'], ['max', '100']])
    await page.locator(`#${id}`).fill(v);
  await page.locator('#unit').selectOption('cm');
  const out = await download(page, 'custom-3.5x4.5cm-300dpi');
  expect(await decode(page, out)).toEqual({ width: 413, height: 531 });
  expect(jfifDpi(out)).toBe(300);
  expect(out.length).toBeLessThanOrEqual(100 * 1000);
});

test('a limit no JPEG can meet says so instead of offering a file', async ({ page }) => {
  await page.locator('#file').setInputFiles(await makeImage(page, 'noisy', 2000, 2000));
  await page.locator('#preset').selectOption('custom');
  await page.locator('#unit').selectOption('px');
  for (const [id, v] of [['w', '2000'], ['h', '2000'], ['min', '0'], ['max', '5']]) await page.locator(`#${id}`).fill(v);
  await expect(page.locator('#result')).toContainText('over the limit');
  await expect(page.getByRole('link', { name: 'Download JPG' })).toBeHidden();
});

test('impossible custom limits are rejected', async ({ page }) => {
  await page.locator('#file').setInputFiles(await makeImage(page, 'flat', 600, 400));
  await page.locator('#preset').selectOption('custom');
  await page.locator('#min').fill('60');
  await page.locator('#max').fill('50');
  await expect(page.locator('#spec-error')).toHaveText('Min KB must be smaller than max KB.');
  await expect(page.getByRole('link', { name: 'Download JPG' })).toBeHidden();
});

test('a file that is not an image gets a clear message', async ({ page }) => {
  await page.locator('#file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.locator('#file-error')).toContainText(`Couldn't open "notes.txt"`);
  await expect(page.locator('#adjust')).toBeHidden();
});
