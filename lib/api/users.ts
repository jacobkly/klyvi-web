import { apiFetch } from './client';
import type { ApiUser, UpdateProfileRequest } from './types';

/** GET /v1/users/me — protected. Auto-creates the user row on first call. */
export function getMe(token: string): Promise<ApiUser> {
  return apiFetch<ApiUser>('/v1/users/me', { token });
}

/** PATCH /v1/users/me — partial update. Null/omitted fields stay unchanged. */
export function updateMe(token: string, body: UpdateProfileRequest): Promise<ApiUser> {
  return apiFetch<ApiUser>('/v1/users/me', {
    method: 'PATCH',
    token,
    body,
  });
}
