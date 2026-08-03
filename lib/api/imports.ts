/**
 * Watch-history import: an async job. POST starts it and returns a pending
 * job; the client polls GET until done or failed.
 */

import type { ImportJob } from "@/lib/types";

import { browserFetch } from "./http";
import { mapImportJob } from "./map";
import type { WireImportJob } from "./wire";

export type ImportSource = "letterboxd" | "trakt" | "csv";

export async function startImport(
  source: ImportSource,
  file: File
): Promise<ImportJob> {
  const form = new FormData();
  form.append("source", source);
  form.append("file", file);
  const w = await browserFetch<WireImportJob>("/v1/imports", {
    method: "POST",
    body: form,
  });
  return mapImportJob(w);
}

export async function getImport(id: string): Promise<ImportJob> {
  const w = await browserFetch<WireImportJob>(`/v1/imports/${id}`);
  return mapImportJob(w);
}
