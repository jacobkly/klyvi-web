/**
 * Shrinks a picked photo to a small square JPEG before it is uploaded, so a
 * 12 MB phone photo leaves the device at a few hundred KB. The server crops
 * and re-encodes again to its stored 512 px, so this only has to be small
 * and sharp enough to downscale well.
 *
 * Re-encoding through a canvas also drops EXIF (including location) before
 * the file leaves the device, and the browser applies the EXIF rotation
 * while decoding, so sideways phone photos come out upright.
 */

/** Uploads aim to fit in this many bytes. */
export const AVATAR_TARGET_BYTES = 400 * 1024;

/** The first attempt is at most this many px on a side. */
const START_EDGE = 1024;

/** Each round of qualities runs before the edge shrinks. */
const QUALITIES = [0.85, 0.75, 0.65, 0.55];

/** Shrinking stops before the edge would drop below this. */
const MIN_EDGE = 256;

/** Thrown when the browser cannot decode the file (HEIC on desktop Chrome). */
export class AvatarDecodeError extends Error {
  constructor() {
    super("could not decode image");
    this.name = "AvatarDecodeError";
  }
}

/** Encodes the square crop at `edge` px and the given JPEG quality. */
export type EncodeSquare = (edge: number, quality: number) => Promise<Blob>;

/**
 * The round logic, kept apart from the canvas so it can be tested. Quality
 * steps down first, then the edge shrinks by a quarter, until an attempt
 * fits `target`. A source smaller than the start edge is never scaled up.
 */
export async function shrinkToTarget(
  encode: EncodeSquare,
  sourceEdge: number,
  target = AVATAR_TARGET_BYTES
): Promise<Blob> {
  let edge = Math.min(sourceEdge, START_EDGE);
  let last: Blob | null = null;
  for (;;) {
    for (const quality of QUALITIES) {
      last = await encode(edge, quality);
      if (last.size <= target) return last;
    }
    const next = Math.round(edge * 0.75);
    if (next < MIN_EDGE) return last!;
    edge = next;
  }
}

/** Decodes `file`, center-crops it square, and shrinks it to the target. */
export async function compressAvatar(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new AvatarDecodeError();
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new AvatarDecodeError();

    const encode: EncodeSquare = (edge, quality) => {
      canvas.width = edge;
      canvas.height = edge;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // JPEG has no alpha. Black matches what the server does with it.
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, edge, edge);
      ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, edge, edge);
      return new Promise((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("could not encode image")),
          "image/jpeg",
          quality
        )
      );
    };

    return await shrinkToTarget(encode, side);
  } finally {
    bitmap.close();
  }
}
