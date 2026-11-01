import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Every output file and a screenshot per case land here, so a run can be re-inspected by hand.
const ARTIFACTS = 'test-results/artifacts';
mkdirSync(ARTIFACTS, { recursive: true });

type Made = { name: string; mimeType: string; buffer: Buffer };

/** Draws a test image in the browser; noise defeats JPEG compression, flat ink compresses to almost nothing. */
async function makeImage(page: Page, kind: 'noisy' | 'flat' | 'portrait', width: number, height: number): Promise<Made> {
  const b64 = await page.evaluate(
    async ({ kind, width, height }) => {
      const c = new OffscreenCanvas(width, height);
      const g = c.getContext('2d')!;
      if (kind === 'noisy') {
        const px = g.createImageData(width, height);
        for (let i = 0; i < px.data.length; i++) px.data[i] = (i + 1) % 4 === 0 ? 255 : Math.random() * 255;
        g.putImageData(px, 0, 0);
      } else if (kind === 'portrait') {
        // Smooth like a real photo, which compresses far better than noise.
        const bg = g.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, '#dfe7ef');
        bg.addColorStop(1, '#9fb3c8');
        g.fillStyle = bg;
        g.fillRect(0, 0, width, height);
        g.fillStyle = '#c68e6a';
        g.beginPath();
        g.ellipse(width / 2, height * 0.4, width * 0.22, height * 0.2, 0, 0, Math.PI * 2);
        g.fill();
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

async function download(page: Page, name: string): Promise<{ bytes: Buffer; fileName: string }> {
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Download JPG' }).click()]);
  const path = `${ARTIFACTS}/${name}.jpg`;
  copyFileSync(await file.path(), path);
  await page.screenshot({ path: `${ARTIFACTS}/${name}.png`, fullPage: true });
  return { bytes: readFileSync(path), fileName: file.suggestedFilename() };
}

/** Decodes the file the user would upload, in the browser, to prove it is a valid JPEG of the right size. */
async function decode(page: Page, bytes: Buffer) {
  return page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const img = await createImageBitmap(new Blob([bin], { type: 'image/jpeg' }));
    return { width: img.width, height: img.height };
  }, bytes.toString('base64'));
}

/** The output's centre pixel and how many of its pixels are dark, to prove the picture survived the trip. */
async function inspect(page: Page, bytes: Buffer) {
  return page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const img = await createImageBitmap(new Blob([bin], { type: 'image/jpeg' }));
    const g = new OffscreenCanvas(img.width, img.height).getContext('2d')!;
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    const at = (Math.floor(img.height / 2) * img.width + Math.floor(img.width / 2)) * 4;
    let dark = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i]! + d[i + 1]! + d[i + 2]! < 150) dark++;
    return { centre: [d[at], d[at + 1], d[at + 2]], dark };
  }, bytes.toString('base64'));
}

const jfifDpi = (b: Buffer) => (b.toString('latin1', 6, 10) === 'JFIF' && b[13] === 1 ? b.readUInt16BE(14) : null);

test.describe('the tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/photo-resizer/');
  });

  test('a large camera-style photo is squeezed under the bank-exam limit', async ({ page }) => {
    await page.locator('#file').setInputFiles(await makeImage(page, 'noisy', 3000, 4000));
    await page.locator('#preset').selectOption('ibps-photo');
    const { bytes: out } = await download(page, 'ibps-photo');
    expect(await decode(page, out)).toEqual({ width: 200, height: 230 });
    expect(out.length).toBeGreaterThanOrEqual(20 * 1024);
    expect(out.length).toBeLessThanOrEqual(50 * 1000);
  });

  test('a plain signature is padded up to the minimum and still opens', async ({ page }) => {
    await page.locator('#file').setInputFiles(await makeImage(page, 'flat', 900, 300));
    await page.locator('#preset').selectOption('ibps-sign');
    await expect(page.locator('#clean')).toBeChecked();
    await expect(page.locator('#result')).toContainText('padded');
    const { bytes: out } = await download(page, 'ibps-signature');
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
    const { bytes: out } = await download(page, 'custom-3.5x4.5cm-300dpi');
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

  // Fixtures made with ImageMagick: a skin-toned oval on a blue gradient, and black ink on paper.
  for (const [file, presetId] of [
    ['portrait.heic', 'ibps-photo'],
    ['portrait.webp', 'ibps-photo'],
    ['portrait.avif', 'ibps-photo'],
    ['scan.tif', 'ibps-sign'],
  ] as const) {
    test(`a ${file.split('.')[1]!.toUpperCase()} file comes out as a JPG of the same picture`, async ({ page }) => {
      await page.locator('#preset').selectOption(presetId);
      await page.locator('#file').setInputFiles(`e2e/fixtures/${file}`);
      const { bytes } = await download(page, `from-${file.replace('.', '-')}`);
      expect(bytes.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
      const { centre, dark } = await inspect(page, bytes);
      if (presetId === 'ibps-photo') {
        // #c68e6a, give or take JPEG and the two lossy source encodings.
        for (const [got, want] of centre.map((v, i) => [v!, [0xc6, 0x8e, 0x6a][i]!])) expect(Math.abs(got - want)).toBeLessThan(24);
      } else {
        // Ink, but not a black frame: at 140 × 60 the word covers a few dozen pixels.
        expect(dark).toBeGreaterThan(20);
        expect(dark).toBeLessThan(140 * 60 * 0.3);
      }
    });
  }

  test('a file that is not an image gets a clear message', async ({ page }) => {
    await page.locator('#file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    await expect(page.locator('#file-error')).toContainText(`Couldn't open "notes.txt"`);
    await expect(page.locator('#adjust')).toBeHidden();
  });

  test('the spec-wrong link names the preset being used', async ({ page }) => {
    await page.locator('#preset').selectOption('ssc-sign');
    const href = await page.getByRole('link', { name: 'Spec wrong or changed?' }).getAttribute('href');
    expect(decodeURIComponent(href!)).toContain('subject=Spec wrong: SSC signature');
    await expect(page.locator('#source-link')).toHaveAttribute('href', /ssc\.gov\.in/);
  });
});

const GUIDES = ['ibps', 'ssc', 'upsc', 'pan', 'pan-utiitsl'];

for (const exam of GUIDES) {
  test(`every ${exam} guide button gives a file that matches the guide`, async ({ page }) => {
    await page.goto(`/photo-size/${exam}/`);
    const specs = page.locator('section.spec');
    const count = await specs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await page.goto(`/photo-size/${exam}/`);
      const spec = page.locator('section.spec').nth(i);
      const label = await spec.getByRole('heading').innerText();
      const dd = spec.locator('dd');
      const size = /(\d+) × (\d+) pixels(?: \(.* at (\d+) DPI\))?/.exec(await dd.nth(0).innerText())!;
      const kb = /(?:(\d+) to )?(\d+) KB/.exec(await dd.nth(1).innerText())!;
      const named = /named (\S+\.jpg)/.exec(await dd.nth(2).innerText());

      await spec.getByRole('link', { name: 'Open in the resizer' }).click();
      await expect(page).toHaveURL(/\/tools\/photo-resizer\/\?preset=/);
      const scan = !/photo/i.test(label);
      await page.locator('#file').setInputFiles(await makeImage(page, scan ? 'flat' : 'portrait', 1500, 1500));
      const { bytes, fileName } = await download(page, `${exam}-${i}`);

      expect(await decode(page, bytes), label).toEqual({ width: Number(size[1]), height: Number(size[2]) });
      expect(jfifDpi(bytes), label).toBe(size[3] ? Number(size[3]) : null);
      expect(bytes.length, label).toBeGreaterThanOrEqual(Number(kb[1] ?? 0) * 1024);
      expect(bytes.length, label).toBeLessThanOrEqual(Number(kb[2]) * 1000);
      if (named) expect(fileName).toBe(named[1]);
    }
  });
}

test('the guides fit a phone and link to one another', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const exam of GUIDES) {
    await page.goto(`/photo-size/${exam}/`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/photo and signature size \d{4}/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    for (const other of GUIDES.filter((g) => g !== exam))
      await expect(page.locator(`a[href="/photo-size/${other}/"]`).first()).toBeVisible();
    await page.screenshot({ path: `${ARTIFACTS}/guide-${exam}-phone.png`, fullPage: true });
  }
});
