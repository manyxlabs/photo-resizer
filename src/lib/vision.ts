import type { FaceDetector, ImageSegmenter } from '@mediapipe/tasks-vision';
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';

// MediaPipe's runtime is 13 MB, so it is fetched only when a face or a background is asked for.
// The models are served from this site: nothing about the photo leaves the browser.
const fileset = { wasmLoaderPath, wasmBinaryPath };
const MODELS = '/_resizer/models';

let segmenter: Promise<ImageSegmenter> | undefined;
let detector: Promise<FaceDetector> | undefined;

async function once<T>(make: () => Promise<T>, reset: () => void): Promise<T> {
  try {
    return await make();
  } catch (err) {
    // A failed fetch must not stay cached, or a dropped connection would break this until a reload.
    reset();
    throw err;
  }
}

const getSegmenter = () =>
  (segmenter ??= once(
    async () =>
      (await import('@mediapipe/tasks-vision')).ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: `${MODELS}/selfie_segmenter.tflite` },
        runningMode: 'IMAGE',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      }),
    () => (segmenter = undefined),
  ));

const getDetector = () =>
  (detector ??= once(
    async () =>
      (await import('@mediapipe/tasks-vision')).FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: `${MODELS}/blaze_face_short_range.tflite` },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.6,
      }),
    () => (detector = undefined),
  ));

export type Box = { x: number; y: number; width: number; height: number };

/** The most confident face, in image pixels, or null when there is none. */
export async function findFace(image: ImageBitmap): Promise<Box | null> {
  const [best] = (await getDetector()).detect(image).detections.sort((a, b) => (b.categories[0]?.score ?? 0) - (a.categories[0]?.score ?? 0));
  const box = best?.boundingBox;
  return box ? { x: box.originX, y: box.originY, width: box.width, height: box.height } : null;
}

/** The photo with everything but the person painted white. */
export async function onWhite(image: ImageBitmap): Promise<ImageBitmap> {
  const result = (await getSegmenter()).segment(image);
  const mask = result.confidenceMasks?.at(-1);
  if (!mask) throw new Error('No mask');
  const confidence = mask.getAsFloat32Array();
  const alpha = new ImageData(mask.width, mask.height);
  // A soft ramp instead of a hard cut keeps hair edges from looking cut out with scissors.
  for (let i = 0; i < confidence.length; i++) {
    const t = Math.min(1, Math.max(0, (confidence[i]! - 0.25) / 0.5));
    alpha.data[i * 4 + 3] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  result.close();

  const maskCanvas = new OffscreenCanvas(mask.width, mask.height);
  maskCanvas.getContext('2d')!.putImageData(alpha, 0, 0);
  const out = new OffscreenCanvas(image.width, image.height);
  const g = out.getContext('2d')!;
  g.drawImage(image, 0, 0);
  g.globalCompositeOperation = 'destination-in';
  g.imageSmoothingQuality = 'high';
  g.drawImage(maskCanvas, 0, 0, image.width, image.height);
  g.globalCompositeOperation = 'destination-over';
  g.fillStyle = '#fff';
  g.fillRect(0, 0, image.width, image.height);
  return out.transferToImageBitmap();
}
