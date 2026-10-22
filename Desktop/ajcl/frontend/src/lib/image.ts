/**
 * Turn a camera photo into a small JPEG data URL for upload. Phone photos are
 * 3-8 MB; proof photos only need to be clear, so we scale them down (and honour the
 * camera's rotation) until they are comfortably under the server's size cap.
 */
const STEPS: Array<{ edge: number; quality: number }> = [
  { edge: 1280, quality: 0.72 },
  { edge: 1024, quality: 0.6 },
  { edge: 800, quality: 0.5 },
];
const TARGET_BYTES = 350_000;

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
  } catch {
    // Older browsers: an <img> is auto-oriented by modern engines.
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode"));
      img.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  }
}

/** A larger, sharper setting for posters and flyers that carry small print. */
export const POSTER_STEPS: Array<{ edge: number; quality: number }> = [
  { edge: 1800, quality: 0.86 },
  { edge: 1600, quality: 0.78 },
  { edge: 1280, quality: 0.7 },
];

export async function photoToJpegDataUrl(file: File, opts: { steps?: Array<{ edge: number; quality: number }>; targetBytes?: number } = {}): Promise<string> {
  const steps = opts.steps ?? STEPS;
  const target = opts.targetBytes ?? TARGET_BYTES;
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo.");
  const img = await decode(file);
  try {
    let out = "";
    for (const step of steps) {
      const scale = Math.min(1, step.edge / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Your browser can't process photos.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img.source, 0, 0, canvas.width, canvas.height);
      out = canvas.toDataURL("image/jpeg", step.quality);
      // base64 is ~4/3 the size of the bytes
      if ((out.length * 3) / 4 <= target) break;
    }
    return out;
  } finally {
    img.close();
  }
}
