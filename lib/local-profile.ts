/**
 * Client-side validators for profile media. The avatar round-trips through
 * the API (POST /v1/users/me/avatar); these just catch obvious problems
 * before a request.
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
