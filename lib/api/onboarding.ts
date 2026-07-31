/** GET /v1/onboarding/pool: the curated cold-start deck. Public. */

import type { PoolEntry } from "@/lib/mock-onboarding";

import { apiFetch } from "./http";
import { mapPoolEntry } from "./map";
import type { WirePoolEntry } from "./wire";

export async function getPool(limit = 30): Promise<PoolEntry[]> {
  const rows = await apiFetch<WirePoolEntry[] | null>(
    `/v1/onboarding/pool?limit=${limit}`
  );
  return (rows ?? []).map(mapPoolEntry);
}
