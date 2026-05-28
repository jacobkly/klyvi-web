import { apiFetch } from './client';
import type {
  AddTrackingRequest,
  ApiTrackingEntry,
  TrackingStatus,
  UpdateTrackingRequest,
} from './types';

/** GET /v1/tracking?media_type=...&status=... */
export async function listTracking(
  token: string,
  opts: { mediaType?: 'movie' | 'season'; status?: TrackingStatus } = {}
): Promise<ApiTrackingEntry[]> {
  const params = new URLSearchParams();
  if (opts.mediaType) params.set('media_type', opts.mediaType);
  if (opts.status) params.set('status', opts.status);
  const qs = params.toString();
  // Backend returns `[]` for empty results; coerce defensively in case the
  // contract regresses (the old Go nil-slice quirk).
  const rows = await apiFetch<ApiTrackingEntry[] | null>(
    `/v1/tracking${qs ? `?${qs}` : ''}`,
    { token }
  );
  return rows ?? [];
}

export function addTracking(
  token: string,
  body: AddTrackingRequest
): Promise<ApiTrackingEntry> {
  return apiFetch<ApiTrackingEntry>('/v1/tracking', { method: 'POST', token, body });
}

export function updateTracking(
  token: string,
  mediaId: number,
  body: UpdateTrackingRequest
): Promise<ApiTrackingEntry> {
  return apiFetch<ApiTrackingEntry>(`/v1/tracking/${mediaId}`, {
    method: 'PATCH',
    token,
    body,
  });
}

export function deleteTracking(token: string, mediaId: number): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`/v1/tracking/${mediaId}`, {
    method: 'DELETE',
    token,
  });
}
