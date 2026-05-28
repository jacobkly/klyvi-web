import { apiFetch } from './client';
import type { ApiInteraction, RecordInteractionRequest } from './types';

/** POST /v1/interactions */
export function recordInteraction(
  token: string,
  body: RecordInteractionRequest
): Promise<ApiInteraction> {
  return apiFetch<ApiInteraction>('/v1/interactions', { method: 'POST', token, body });
}

/** GET /v1/interactions?since_days=N */
export function listInteractions(
  token: string,
  opts: { sinceDays?: number } = {}
): Promise<ApiInteraction[]> {
  const qs = opts.sinceDays ? `?since_days=${opts.sinceDays}` : '';
  return apiFetch<ApiInteraction[]>(`/v1/interactions${qs}`, { token });
}
