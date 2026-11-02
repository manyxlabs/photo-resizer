import type { Box } from './vision';

export type Ink = 'as-written' | 'black' | 'blue';

const BLUE = [24, 52, 148];
// Phone photos of paper are 12+ MP; the outputs are a few hundred pixels, so this loses nothing.
const WORK = 1600;
const BLOCK = 24;

/**
 * Turns a photo or scan of ink on paper into ink on pure white. Each block's paper brightness
 * is estimated separately, so a shadow or a lamp's falloff across the page is evened out
 * instead of turning grey. Also returns where the ink is, in the image's own pixels.
 */
export function cleanScan(image: ImageBitmap, ink: Ink): { bitmap: ImageBitmap; inkBox: Box | null } {
  const k = Math.min(1, WORK / Math.max(image.width, image.height));
  const w = Math.max(1, Math.round(image.width * k));
  const h = Math.max(1, Math.round(image.height * k));
  const canvas = new OffscreenCanvas(w, h);
  const g = canvas.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);
  g.drawImage(image, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h);
  const d = px.data;

  const light = new Float32Array(w * h);
  for (let i = 0; i < light.length; i++) light[i] = 0.299 * d[i * 4]! + 0.587 * d[i * 4 + 1]! + 0.114 * d[i * 4 + 2]!;

  // Paper is the bright majority of a block, so a high percentile ignores the ink on it.
  const gw = Math.ceil(w / BLOCK);
  const gh = Math.ceil(h / BLOCK);
  const paper = new Float32Array(gw * gh);
  for (let by = 0; by < gh; by++) {
    for (let bx = 0; bx < gw; bx++) {
      const values: number[] = [];
      for (let y = by * BLOCK; y < Math.min(h, (by + 1) * BLOCK); y++)
        for (let x = bx * BLOCK; x < Math.min(w, (bx + 1) * BLOCK); x++) values.push(light[y * w + x]!);
      values.sort((a, b) => a - b);
      paper[by * gw + bx] = Math.max(60, values[Math.floor(values.length * 0.9)]!);
    }
  }
  // Bilinear between block centres, so no block edges show.
  const paperAt = (x: number, y: number) => {
    const fx = Math.min(gw - 1, Math.max(0, x / BLOCK - 0.5));
    const fy = Math.min(gh - 1, Math.max(0, y / BLOCK - 0.5));
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(gw - 1, x0 + 1);
    const y1 = Math.min(gh - 1, y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const top = paper[y0 * gw + x0]! * (1 - tx) + paper[y0 * gw + x1]! * tx;
    const bottom = paper[y1 * gw + x0]! * (1 - tx) + paper[y1 * gw + x1]! * tx;
    return top * (1 - ty) + bottom * ty;
  };

  const rows = new Uint32Array(h);
  const cols = new Uint32Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const ratio = light[i]! / paperAt(x, y);
      // Ink is anything clearly darker than the paper around it; the ramp keeps strokes smooth.
      const a = Math.min(1, Math.max(0, (0.88 - ratio) / 0.3));
      if (a > 0.5) {
        rows[y]!++;
        cols[x]!++;
      }
      const o = i * 4;
      const [r, gr, b] = ink === 'black' ? [0, 0, 0] : ink === 'blue' ? BLUE : [d[o]!, d[o + 1]!, d[o + 2]!];
      d[o] = 255 + (r! - 255) * a;
      d[o + 1] = 255 + (gr! - 255) * a;
      d[o + 2] = 255 + (b! - 255) * a;
    }
  }
  g.putImageData(px, 0, 0);

  // Specks of dust or paper grain do not count as ink when finding its extent.
  const span = (counts: Uint32Array, min: number) => {
    const first = counts.findIndex((c) => c >= min);
    if (first < 0) return null;
    let last = counts.length - 1;
    while (counts[last]! < min) last--;
    return [first, last + 1] as const;
  };
  const ys = span(rows, Math.max(2, w * 0.003));
  const xs = span(cols, Math.max(2, h * 0.003));
  const inkBox = ys && xs ? { x: xs[0] / k, y: ys[0] / k, width: (xs[1] - xs[0]) / k, height: (ys[1] - ys[0]) / k } : null;
  return { bitmap: canvas.transferToImageBitmap(), inkBox };
}
