/** Longest side of an invoice photo after capture. Enough for OCR, small enough to upload fast. */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.85;

/** True on phones and tablets, where the native camera is reached through a file input. */
export const prefersNativeCamera = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/** True when the browser can stream a camera into the page (needs HTTPS or localhost). */
export const canStreamCamera = (): boolean =>
  typeof navigator !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  typeof window !== "undefined" &&
  window.isSecureContext;

const scaleFor = (w: number, h: number) => Math.min(1, MAX_SIDE / Math.max(w, h));

function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(new File([blob], name, { type: "image/jpeg" }))
          : reject(new Error("No se pudo procesar la foto")),
      "image/jpeg",
      JPEG_QUALITY,
    ),
  );
}

function drawScaled(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const scale = scaleFor(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const photoName = () => `factura-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`;

/** Grabs the current video frame as a downscaled JPEG. */
export function frameToFile(video: HTMLVideoElement): Promise<File> {
  return canvasToFile(drawScaled(video, video.videoWidth, video.videoHeight), photoName());
}

/** Phone photos can be 10+ MB; re-encode images to a downscaled JPEG. PDFs pass through. */
export async function normalizePhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const out = await canvasToFile(drawScaled(bitmap, bitmap.width, bitmap.height), photoName());
    bitmap.close();
    return out;
  } catch {
    return file;
  }
}
