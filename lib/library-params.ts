import type { LibraryViewMode } from "@/components/library/view-switcher";
import type { LibrarySortKey, SortOrder } from "@/lib/library-filter";
import type { MediaType, TrackingStatus } from "@/lib/types";

/** The library's place, as it rides in the URL so Back, reload and a shared
 *  link land on the same view (#67). Absent means the default. */
export type LibraryParams = {
  status?: TrackingStatus | "all";
  type?: MediaType | "all";
  q?: string;
  sort?: LibrarySortKey;
  order?: SortOrder;
  view?: LibraryViewMode;
  tab?: MediaType;
};

const STATUSES = ["watching", "planning", "completed", "rewatching", "paused", "dropped"];
const TYPES = ["movie", "season"];
const SORTS = ["title", "score", "added", "year", "progress", "updated"];
const ORDERS = ["asc", "desc"];
const VIEWS = ["grid", "list", "compact"];

type Source = URLSearchParams | Record<string, string | string[] | undefined>;

function get(src: Source, key: string): string | undefined {
  if (src instanceof URLSearchParams) return src.get(key) ?? undefined;
  const v = src[key];
  return Array.isArray(v) ? v[0] : v;
}

function oneOf<T extends string>(v: string | undefined, allowed: string[]): T | undefined {
  return v != null && allowed.includes(v) ? (v as T) : undefined;
}

/** Reads the library's params, dropping any value it doesn't know. */
export function readLibraryParams(src: Source): LibraryParams {
  const p: LibraryParams = {};
  const status = oneOf<TrackingStatus>(get(src, "status"), STATUSES);
  if (status) p.status = status;
  const type = oneOf<MediaType>(get(src, "type"), TYPES);
  if (type) p.type = type;
  const q = get(src, "q");
  if (q) p.q = q;
  const sort = oneOf<LibrarySortKey>(get(src, "sort"), SORTS);
  if (sort) p.sort = sort;
  const order = oneOf<SortOrder>(get(src, "order"), ORDERS);
  if (order) p.order = order;
  const view = oneOf<LibraryViewMode>(get(src, "view"), VIEWS);
  if (view) p.view = view;
  const tab = oneOf<MediaType>(get(src, "tab"), TYPES);
  if (tab) p.tab = tab;
  return p;
}

/**
 * The query string for `p`, written over `current` so params that aren't the
 * library's (the dev `?state=`) survive. Defaults are left out, so a library
 * nobody has touched keeps a bare URL.
 */
export function libraryQuery(current: string, p: LibraryParams): string {
  const sp = new URLSearchParams(current);
  const set = (key: string, value: string | undefined, fallback?: string) => {
    if (value == null || value === "" || value === fallback) sp.delete(key);
    else sp.set(key, value);
  };
  set("status", p.status, "all");
  set("type", p.type, "all");
  set("q", p.q);
  set("sort", p.sort);
  set("order", p.order);
  set("view", p.view);
  set("tab", p.tab, "movie");
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
