import type { Worker } from 'tesseract.js';

export type Box = { x: number; y: number; w: number; h: number };

// 4+4+4 digits, not part of a longer run such as a 16-digit VID.
const AADHAAR = /(?<!\d\s?)\d{4}\s?\d{4}\s?\d{4}(?!\s?\d)/g;

let worker: Promise<Worker> | null = null;

// Everything is served from this site; tesseract.js would otherwise fetch its worker, core and language data from a CDN.
function ocr() {
  worker ??= (async () => {
    const [{ createWorker, OEM }, workerUrl, coreUrl] = await Promise.all([
      import('tesseract.js'),
      import('tesseract.js/dist/worker.min.js?url'),
      import('tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url'),
    ]);
    // The worker is started from a blob URL, which cannot resolve root-relative paths.
    const abs = (path: string) => new URL(path, location.href).href;
    return createWorker('eng', OEM.LSTM_ONLY, {
      workerPath: abs(workerUrl.default),
      corePath: abs(coreUrl.default),
      langPath: abs('/_resizer/models'),
    });
  })();
  // A failed load (offline, no SIMD) must not stick, so the next file tries again.
  worker.catch(() => (worker = null));
  return worker;
}

/** Boxes over the first 8 digits of every Aadhaar number tesseract reads on the canvas, in its pixels. */
export async function findAadhaar(canvas: HTMLCanvasElement): Promise<Box[]> {
  const { data } = await (await ocr()).recognize(canvas, {}, { blocks: true });
  const boxes: Box[] = [];
  for (const line of (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines))) {
    // The groups are usually separate OCR words, so match on the whole line, one character per symbol.
    const symbols = line.words.flatMap((w, i) => [...(i ? [null] : []), ...w.symbols]);
    const text = symbols.map((s) => (s ? s.text.slice(0, 1) || '?' : ' ')).join('');
    for (const m of text.matchAll(AADHAAR)) {
      const digits = symbols.slice(m.index, m.index + m[0].length).filter((s) => s !== null).slice(0, 8);
      const x0 = Math.min(...digits.map((s) => s.bbox.x0));
      const y0 = Math.min(...digits.map((s) => s.bbox.y0));
      const x1 = Math.max(...digits.map((s) => s.bbox.x1));
      const y1 = Math.max(...digits.map((s) => s.bbox.y1));
      // OCR boxes hug the ink; pad so antialiased edges are covered too.
      const pad = Math.ceil((y1 - y0) * 0.25);
      boxes.push({ x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad });
    }
  }
  return boxes;
}
