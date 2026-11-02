import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const ARTIFACTS = 'test-results/artifacts';
mkdirSync(ARTIFACTS, { recursive: true });

async function save(page: Page, name: string, link: string, ext = 'jpg') {
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: link }).or(page.getByRole('link', { name: link })).click()]);
  const path = `${ARTIFACTS}/${name}.${ext}`;
  copyFileSync(await file.path(), path);
  await page.screenshot({ path: `${ARTIFACTS}/${name}-page.png`, fullPage: true });
  return { bytes: readFileSync(path), fileName: file.suggestedFilename() };
}

/** Decodes a JPEG in the browser and measures it: size, and the average colour of a region given in fractions. */
async function measure(page: Page, bytes: Buffer, region?: [x: number, y: number, w: number, h: number]) {
  return page.evaluate(
    async ({ b64, region }) => {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const img = await createImageBitmap(new Blob([bin], { type: 'image/jpeg' }));
      const g = new OffscreenCanvas(img.width, img.height).getContext('2d')!;
      g.drawImage(img, 0, 0);
      const [fx, fy, fw, fh] = region ?? [0, 0, 1, 1];
      const d = g.getImageData(fx * img.width, fy * img.height, Math.max(1, fw * img.width), Math.max(1, fh * img.height)).data;
      const mean = [0, 0, 0];
      let dark = 0;
      for (let i = 0; i < d.length; i += 4) {
        for (let c = 0; c < 3; c++) mean[c]! += d[i + c]! / (d.length / 4);
        if (d[i]! + d[i + 1]! + d[i + 2]! < 200) dark++;
      }
      return { width: img.width, height: img.height, mean: mean.map(Math.round), dark };
    },
    { b64: bytes.toString('base64'), region },
  );
}

/** A signature photographed on paper under a lamp: grey, unevenly lit paper with dark ink in its middle. */
async function signaturePhoto(page: Page) {
  const b64 = await page.evaluate(async () => {
    const c = new OffscreenCanvas(2400, 1600);
    const g = c.getContext('2d')!;
    const light = g.createLinearGradient(0, 0, 2400, 1600);
    light.addColorStop(0, '#d9d4c8');
    light.addColorStop(1, '#8e8a80');
    g.fillStyle = light;
    g.fillRect(0, 0, 2400, 1600);
    g.strokeStyle = '#1b1b2a';
    g.lineWidth = 14;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(900, 900);
    for (let x = 900; x <= 1500; x += 20) g.lineTo(x, 800 + Math.sin(x / 35) * 90);
    g.stroke();
    const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/jpeg', quality: 0.9 })).arrayBuffer());
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s);
  });
  return { name: 'signature-photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(b64, 'base64') };
}

test('a phone photo of a signature comes out as clean ink on white, trimmed to the ink', async ({ page }) => {
  await page.goto('/tools/signature-resizer/');
  await expect(page.locator('#preset option[value="ibps-photo"]')).toHaveCount(0);
  await page.locator('#preset').selectOption('ssc-sign');
  await page.locator('#file').setInputFiles(await signaturePhoto(page));
  await expect(page.locator('#clean')).toBeChecked();
  await page.locator('#ink').selectOption('black');
  const { bytes } = await save(page, 'signature-cleaned', 'Download JPG');
  const whole = await measure(page, bytes);
  expect(whole).toMatchObject({ width: 472, height: 157 });
  expect(bytes.length).toBeLessThanOrEqual(20 * 1000);
  // The shadowed corner was mid-grey paper; now it is white.
  const corner = await measure(page, bytes, [0.95, 0.9, 0.05, 0.1]);
  for (const c of corner.mean) expect(c).toBeGreaterThan(245);
  // Trimmed to the ink: the stroke spans most of the width, not the middle quarter of the photo.
  const left = await measure(page, bytes, [0.02, 0, 0.12, 1]);
  const right = await measure(page, bytes, [0.86, 0, 0.12, 1]);
  expect(left.dark).toBeGreaterThan(0);
  expect(right.dark).toBeGreaterThan(0);
});

test('a portrait is framed on the face, can go on white, and prints as a sheet', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/tools/passport-photo/');
  await expect(page.locator('#preset option[value="ssc-sign"]')).toHaveCount(0);
  await page.locator('#preset').selectOption('passport-photo');
  // A slow connection: no file may be offered before the photo is framed.
  await page.route('**/_resizer/models/**', async (route) => (await new Promise((r) => setTimeout(r, 2000)), route.continue()));
  await page.locator('#file').setInputFiles('e2e/fixtures/face.jpg');
  await expect(page.locator('#work')).toBeVisible();
  await page.waitForTimeout(500);
  // Checked once, not retried: a retrying check would pass on any moment the link happened to be hidden.
  expect(await page.locator('#work').isVisible()).toBe(true);
  expect(await page.getByRole('link', { name: 'Download JPG' }).isVisible()).toBe(false);
  await expect(page.locator('#work')).toBeHidden({ timeout: 60_000 });
  const framed = await save(page, 'passport-framed', 'Download JPG');
  expect(await measure(page, framed.bytes)).toMatchObject({ width: 630, height: 810 });
  expect(framed.bytes.length).toBeLessThanOrEqual(250 * 1000);
  // The face is off to the right in the original; framed, skin fills the centre of the photo.
  const [r, g, b] = (await measure(page, framed.bytes, [0.4, 0.4, 0.2, 0.15])).mean as [number, number, number];
  expect(r).toBeGreaterThan(b + 30);
  expect(r).toBeGreaterThan(g);

  await page.locator('#white').check();
  await expect(page.locator('#work')).toBeHidden({ timeout: 60_000 });
  await expect(page.locator('#white')).toBeChecked();
  const onWhite = await save(page, 'passport-white', 'Download JPG');
  // The dark backdrop above the head is white now, and the face is untouched.
  for (const c of (await measure(page, onWhite.bytes, [0.3, 0, 0.4, 0.04])).mean) expect(c).toBeGreaterThan(235);
  expect((await measure(page, onWhite.bytes, [0.4, 0.4, 0.2, 0.15])).mean).toEqual((await measure(page, framed.bytes, [0.4, 0.4, 0.2, 0.15])).mean);

  const sheet = await save(page, 'passport-sheet', 'Download 6 × 4 in print sheet');
  expect(await measure(page, sheet.bytes)).toMatchObject({ width: 1800, height: 1200 });
  expect(sheet.fileName).toBe('passport-photo-print-sheet-6x4in.jpg');
});

test('every tool is listed on the tools page and fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/');
  const links = page.locator('main .list a');
  const paths = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(paths.length).toBeGreaterThanOrEqual(7);
  for (const path of paths) {
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${path} scrolls sideways`).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `${ARTIFACTS}/phone-${scheme}-${path.split('/')[2]}.png`, fullPage: true });
    }
  }
});
