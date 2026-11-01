const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

// HEIF files open with an ftyp box; these are the brands HEIC photos (iPhone, many Androids) carry.
const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']);
const isHeif = (b: Uint8Array) => ascii(b, 4, 8) === 'ftyp' && HEIF_BRANDS.has(ascii(b, 8, 12));
const isTiff = (b: Uint8Array) => ['II*\0', 'MM\0*'].includes(ascii(b, 0, 4));

/**
 * Opens anything the browser can (JPG, PNG, WebP, GIF, BMP, AVIF). HEIC photos and
 * TIFF scans only open natively in Safari, so for those a decoder is fetched, and only
 * once such a file is picked: the HEIC one is 3 MB.
 */
export async function openImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (err) {
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (isHeif(head)) {
      const { heicTo } = await import('heic-to');
      return heicTo({ blob: file, type: 'bitmap' });
    }
    if (isTiff(head)) {
      const UTIF = await import('utif2');
      const buffer = await file.arrayBuffer();
      const [page] = UTIF.decode(buffer);
      if (!page) throw err;
      UTIF.decodeImage(buffer, page);
      const rgba = UTIF.toRGBA8(page);
      return createImageBitmap(new ImageData(new Uint8ClampedArray(rgba), page.width, page.height));
    }
    throw err;
  }
}
