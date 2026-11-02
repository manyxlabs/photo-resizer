import type { PDFDocumentProxy } from 'pdfjs-dist';

// pdf.js is about 1.6 MB with its worker, so it is fetched only once a PDF is picked.
async function pdfjs() {
  const lib = await import('pdfjs-dist');
  if (!lib.GlobalWorkerOptions.workerSrc) {
    lib.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  }
  return lib;
}

export const isPdf = async (file: File) => (await file.slice(0, 5).text()) === '%PDF-';

export class PdfPasswordError extends Error {}

export async function openPdf(file: File): Promise<PDFDocumentProxy> {
  const { getDocument, PasswordException } = await pdfjs();
  try {
    return await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (err) {
    if (err instanceof PasswordException) throw new PdfPasswordError(file.name);
    throw err;
  }
}

/** A page drawn on a white canvas at `dpi`, with its size in PDF points so it can be placed back at the same size. */
export async function renderPage(doc: PDFDocumentProxy, number: number, dpi: number) {
  const page = await doc.getPage(number);
  const viewport = page.getViewport({ scale: dpi / 72 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  const { width, height } = page.getViewport({ scale: 1 });
  page.cleanup();
  return { canvas, width, height };
}
