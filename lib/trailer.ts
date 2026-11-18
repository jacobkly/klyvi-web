/** A YouTube video id: eleven URL-safe characters, nothing else. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The trailer key, or null. The API already checks it, but the key goes
 * straight into a player URL, so the client checks again rather than trust
 * a cached row.
 */
export function trailerKey(key: string | null | undefined): string | null {
  return key && YOUTUBE_ID.test(key) ? key : null;
}

/** The no-cookie player: YouTube sets no cookies until the video plays. */
export function trailerEmbedUrl(key: string): string {
  return `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`;
}

export function trailerWatchUrl(key: string): string {
  return `https://www.youtube.com/watch?v=${key}`;
}
