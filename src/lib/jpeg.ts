// Portals disagree on whether a KB is 1000 or 1024 bytes, so the upper limit is
// read as decimal and the lower as binary: a file inside both passes either way.
export const maxBytes = (kb: number) => kb * 1000;
export const minBytes = (kb: number) => kb * 1024;

const SOI_LEN = 2;
const COM_MAX = 0xffff - 2;

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function hasJfif(jpeg: Uint8Array): boolean {
  return jpeg[2] === 0xff && jpeg[3] === 0xe0 && String.fromCharCode(...jpeg.subarray(6, 11)) === 'JFIF\0';
}

/** Some portals reject a scan whose metadata does not state the DPI they asked for. */
export function withDpi(jpeg: Uint8Array, dpi: number): Uint8Array {
  const hi = dpi >> 8;
  const lo = dpi & 0xff;
  if (hasJfif(jpeg)) {
    const out = jpeg.slice();
    out.set([1, hi, lo, hi, lo], 13);
    return out;
  }
  const app0 = new Uint8Array([0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 1, hi, lo, hi, lo, 0, 0]);
  return concat(jpeg.subarray(0, SOI_LEN), app0, jpeg.subarray(SOI_LEN));
}

/**
 * Grows a file to `bytes` with comment segments, for forms with a minimum size
 * that a small, simple image cannot reach even at full quality. Decoders skip
 * comments, so the picture is unchanged.
 */
export function padTo(jpeg: Uint8Array, bytes: number): Uint8Array {
  let missing = bytes - jpeg.length;
  if (missing <= 0) return jpeg;
  // JFIF requires its APP0 segment to come straight after SOI.
  const at = hasJfif(jpeg) ? SOI_LEN + 2 + ((jpeg[4] << 8) | jpeg[5]) : SOI_LEN;
  const segments: Uint8Array[] = [];
  while (missing > 0) {
    const data = Math.min(COM_MAX, Math.max(0, missing - 4));
    const seg = new Uint8Array(4 + data).fill(0x20);
    seg.set([0xff, 0xfe, (data + 2) >> 8, (data + 2) & 0xff]);
    segments.push(seg);
    missing -= seg.length;
  }
  return concat(jpeg.subarray(0, at), ...segments, jpeg.subarray(at));
}

export type Fit =
  | { ok: true; jpeg: Uint8Array; quality: number; padded: boolean }
  | { ok: false; smallest: number };

/** Highest JPEG quality that fits under the limit, padded up to the minimum if needed. */
export async function fitJpeg(
  encode: (quality: number) => Promise<Uint8Array>,
  limits: { min: number; max: number },
): Promise<Fit> {
  let best = await encode(1);
  let quality = 1;
  if (best.length > limits.max) {
    const smallest = await encode(0.05);
    if (smallest.length > limits.max) return { ok: false, smallest: smallest.length };
    best = smallest;
    quality = 0.05;
    let lo = 0.05;
    let hi = 1;
    for (let i = 0; i < 7; i++) {
      const mid = (lo + hi) / 2;
      const out = await encode(mid);
      if (out.length <= limits.max) {
        best = out;
        quality = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }
  }
  const padded = best.length < limits.min;
  return { ok: true, jpeg: padTo(best, limits.min), quality, padded };
}
