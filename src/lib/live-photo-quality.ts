/** Maximum width used when analysing capture quality (keeps checks fast). */
const ANALYSIS_MAX_WIDTH = 480;

/** Minimum captured dimensions before we accept a verification photo. */
const MIN_CAPTURE_WIDTH = 480;
const MIN_CAPTURE_HEIGHT = 360;

/** Laplacian variance — higher means sharper. Tuned for typical front cameras. */
const MIN_SHARPNESS = 110;
const MIN_CENTER_SHARPNESS = 85;

/** Mean luminance (0–255). */
const MIN_BRIGHTNESS = 42;
const MAX_BRIGHTNESS = 235;

/** Std-dev of luminance — very flat images lack detail. */
const MIN_CONTRAST = 22;

export type LivePhotoQualityIssue =
  | "resolution"
  | "blur"
  | "dark"
  | "bright"
  | "low_contrast";

export type LivePhotoQualityResult =
  | { ok: true }
  | { ok: false; issue: LivePhotoQualityIssue; message: string };

const ISSUE_MESSAGES: Record<LivePhotoQualityIssue, string> = {
  resolution:
    "The camera image is too small. Move closer, use a device with a better front camera, or allow HD in browser camera settings.",
  blur:
    "Your photo is not clear enough. Hold the phone steady, make sure your face is in focus, and capture again in good light.",
  dark:
    "The photo is too dark. Turn toward a window or lamp so your face is well lit, then try again.",
  bright:
    "The photo is overexposed. Avoid strong backlight or direct glare on your face, then try again.",
  low_contrast:
    "We could not see enough detail in the photo. Improve lighting and make sure your full face is visible, then try again.",
};

function fail(issue: LivePhotoQualityIssue): LivePhotoQualityResult {
  return { ok: false, issue, message: ISSUE_MESSAGES[issue] };
}

function toGrayscale(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o]! + 0.587 * data[o + 1]! + 0.114 * data[o + 2]!;
  }
  return gray;
}

/** Variance of the Laplacian — standard blur / sharpness heuristic. */
function laplacianVariance(gray: Float32Array, width: number, height: number): number {
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        -4 * gray[i]! +
        gray[i - 1]! +
        gray[i + 1]! +
        gray[i - width]! +
        gray[i + width]!;
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

function luminanceStats(gray: Float32Array): { mean: number; stdDev: number } {
  let sum = 0;
  let sumSq = 0;
  const n = gray.length;
  for (let i = 0; i < n; i++) {
    const v = gray[i]!;
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  return { mean, stdDev: Math.sqrt(Math.max(0, variance)) };
}

function cropCenterGray(
  gray: Float32Array,
  width: number,
  height: number,
  fraction = 0.55
): { gray: Float32Array; width: number; height: number } {
  const cropW = Math.max(32, Math.floor(width * fraction));
  const cropH = Math.max(32, Math.floor(height * fraction));
  const x0 = Math.floor((width - cropW) / 2);
  const y0 = Math.floor((height - cropH) / 2);
  const cropped = new Float32Array(cropW * cropH);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      cropped[y * cropW + x] = gray[(y0 + y) * width + (x0 + x)]!;
    }
  }

  return { gray: cropped, width: cropW, height: cropH };
}

function prepareAnalysisCanvas(source: HTMLCanvasElement): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const scale = Math.min(1, ANALYSIS_MAX_WIDTH / source.width);
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not analyse photo");
  }
  ctx.drawImage(source, 0, 0, w, h);
  return { canvas, ctx };
}

/**
 * Validates that a captured frame is clear and usable for identity verification.
 * Runs entirely in the browser before upload.
 */
export function assessLivePhotoQuality(
  captureCanvas: HTMLCanvasElement
): LivePhotoQualityResult {
  if (
    captureCanvas.width < MIN_CAPTURE_WIDTH ||
    captureCanvas.height < MIN_CAPTURE_HEIGHT
  ) {
    return fail("resolution");
  }

  const { canvas, ctx } = prepareAnalysisCanvas(captureCanvas);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = toGrayscale(imageData.data, canvas.width, canvas.height);

  const { mean, stdDev } = luminanceStats(gray);
  if (mean < MIN_BRIGHTNESS) return fail("dark");
  if (mean > MAX_BRIGHTNESS) return fail("bright");
  if (stdDev < MIN_CONTRAST) return fail("low_contrast");

  const sharpness = laplacianVariance(gray, canvas.width, canvas.height);
  if (sharpness < MIN_SHARPNESS) return fail("blur");

  const center = cropCenterGray(gray, canvas.width, canvas.height);
  const centerSharpness = laplacianVariance(
    center.gray,
    center.width,
    center.height
  );
  if (centerSharpness < MIN_CENTER_SHARPNESS) {
    return fail("blur");
  }

  return { ok: true };
}

export const LIVE_PHOTO_CAPTURE_TIPS = [
  "Face the camera directly with your full face visible",
  "Use even lighting — avoid standing with a bright window behind you",
  "Hold the device steady until you capture",
] as const;
