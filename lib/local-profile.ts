/**
 * Client-side validators for profile media and dates. The actual avatar and
 * birthday now round-trip through the API (POST /v1/users/me/avatar and
 * PATCH /v1/users/me); these just catch obvious problems before a request.
 */

/**
 * Photos are shrunk in the browser before upload (lib/image/compress), so
 * this only stops files too large to decode comfortably on a phone.
 */
export const AVATAR_MAX_SOURCE_BYTES = 50 * 1024 * 1024;

export function validateAvatarFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!file.type.startsWith("image/"))
    return "That file is not an image. PNG, JPG, WebP, or GIF works.";
  if (file.size > AVATAR_MAX_SOURCE_BYTES)
    return "That image is over 50 MB. Try a smaller photo.";
  return null;
}

/** Null when the date can be honored; the reason otherwise. */
export function validateBirthday(value: string): string | null {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return "That is not a real date.";
  if (t > Date.now()) return "A birthday cannot be in the future.";
  if (t < Date.parse("1900-01-01")) return "That is too long ago.";
  return null;
}
