import { apiFetch } from './client';
import { getMovie } from './movies';
import type { ApiMovie, Scored, ResolvedReason } from './types';

/** GET /v1/reco/feed — personalized cascade. */
export function getRecoFeed(token: string): Promise<Scored[]> {
  return apiFetch<Scored[]>('/v1/reco/feed', { token });
}

/**
 * Enrich a feed item with display fields (title, poster, etc.) when the
 * backend doesn't include them inline yet (Backend Task 1 will).
 *
 * Strategy: fetch the movie via `id_type=media` and merge.
 */
export async function enrichScored(item: Scored): Promise<Scored> {
  // If the backend already inlined display fields, no work needed.
  if (item.Title && item.PosterPath !== undefined) return item;

  const movie = await getMovie(item.MediaID, { idType: 'media' });
  if (!movie) return item;
  return mergeScoredWithMovie(item, movie);
}

export function mergeScoredWithMovie(item: Scored, movie: ApiMovie): Scored {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : undefined;
  return {
    ...item,
    TMDBID: movie.movie_id,
    Title: movie.title ?? movie.original_title ?? 'Untitled',
    PosterPath: movie.poster_path,
    BackdropPath: movie.backdrop_path,
    ReleaseYear: year,
    VoteAverage: movie.vote_average,
  };
}

/**
 * Resolve `Reasons` to human-readable names client-side.
 *
 * Today's backend returns raw `kind:id` tokens. Backend Task 3 will return
 * pre-resolved `{kind, id, name}` objects. We handle both.
 *
 * Resolution uses the movie's own genres + keywords payloads (which the
 * backend already populates from TMDB).
 */
export function resolveReasons(reasons: Scored['Reasons'], movie: ApiMovie | null): ResolvedReason[] {
  if (!reasons || reasons.length === 0) return [];

  return reasons.map((r): ResolvedReason => {
    // Already resolved by backend (Task 3).
    if (typeof r === 'object' && r !== null && 'kind' in r) return r as ResolvedReason;

    // Legacy string form: "keyword:9826" or "genre:18".
    if (typeof r === 'string') {
      const [kindRaw, idRaw] = r.split(':');
      const kind: 'keyword' | 'genre' =
        kindRaw === 'genre' ? 'genre' : 'keyword';
      const id = Number(idRaw);
      let name: string | undefined;
      if (movie) {
        const pool = kind === 'keyword' ? movie.keywords ?? [] : movie.genres ?? [];
        name = pool.find((p) => p.id === id)?.name;
      }
      return { kind, id, name };
    }
    return { kind: 'keyword', id: 0 };
  });
}
