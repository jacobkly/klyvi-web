import {
  formatDate,
  formatRuntime,
  formatSeasons,
  type EpisodeRef,
  type MovieDetail,
  type TvDetail,
} from "@/lib/mock-media";

/**
 * One row of a title page's facts column. A row with no value and no links
 * is left out by MetadataList, never shown as a dash.
 */
export type Fact = {
  label: string;
  value: string | number | null;
  links?: { label: string; href: string }[];
};

const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** "$160M", "$836.8M", "$2.9B". TMDB reports both in US dollars. */
export function formatMoney(n: number | null): string | null {
  return n != null && n > 0 ? MONEY.format(n) : null;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "12 Dec 2026", short enough for the facts column. Spelled out by hand:
 *  ICU's short months differ between runtimes ("Sep" or "Sept"), and the
 *  server's HTML must match the browser's. */
function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "S3 E4 on 12 Dec 2026", or "S3 E4" while the date is unknown. */
export function formatEpisode(e: EpisodeRef | null): string | null {
  if (!e) return null;
  const n = `S${e.season} E${e.episode}`;
  const date = shortDate(e.airDate);
  return date ? `${n} on ${date}` : n;
}

/** "Directed by X. Written by Y, Z": the people near the top of the page. */
export function byLine(
  verb: string,
  people: string[],
  writers: string[] = []
): string | null {
  if (
    verb === "Directed by" &&
    people.length > 0 &&
    writers.length === people.length &&
    writers.every((w) => people.includes(w))
  ) {
    return `Written and directed by ${people.join(", ")}`;
  }
  const parts: string[] = [];
  if (people.length > 0) parts.push(`${verb} ${people.join(", ")}`);
  if (writers.length > 0) parts.push(`Written by ${writers.join(", ")}`);
  return parts.length > 0 ? parts.join(". ") : null;
}

/** A label that reads right for one item or several. */
function list(one: string, many: string, items: string[]): Fact {
  return {
    label: items.length > 1 ? many : one,
    value: items.length > 0 ? items.join(", ") : null,
  };
}

/** Only web links. A cached homepage is TMDB data, not something to trust
 *  as an href without a look. */
function webLink(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

function links(imdbId: string | null, homepage: string | null): Fact {
  const out: { label: string; href: string }[] = [];
  if (imdbId && /^tt\d+$/.test(imdbId)) {
    out.push({ label: "IMDb", href: `https://www.imdb.com/title/${imdbId}/` });
  }
  const site = webLink(homepage);
  if (site) out.push({ label: "Official site", href: site });
  return { label: "Links", value: null, links: out };
}

function differs(original: string | null, title: string): string | null {
  return original && original.trim() !== title.trim() ? original : null;
}

/** A fact with nothing to say is left out, never shown as a dash. */
function present(facts: Fact[]): Fact[] {
  return facts.filter(
    (f) => (f.value != null && f.value !== "") || (f.links?.length ?? 0) > 0
  );
}

function average(v: number | null): number | null {
  return v != null ? Math.round(v * 10) : null;
}

export function movieFacts(m: MovieDetail): Fact[] {
  return present([
    { label: "Original title", value: differs(m.originalTitle, m.title) },
    { label: "Runtime", value: formatRuntime(m.runtime) },
    { label: "Released", value: formatDate(m.releaseDate) },
    { label: "Status", value: m.status },
    { label: "Budget", value: formatMoney(m.budget) },
    { label: "Box office", value: formatMoney(m.revenue) },
    list("Studio", "Studios", m.studios),
    list("Country", "Countries", m.countries),
    { label: "Original language", value: m.language },
    list("Spoken language", "Spoken languages", m.spokenLanguages),
    { label: "Average score", value: average(m.voteAverage) },
    links(m.imdbId, m.homepage),
  ]);
}

export function tvFacts(t: TvDetail): Fact[] {
  return present([
    { label: "Original name", value: differs(t.originalTitle, t.title) },
    { label: "Next episode", value: formatEpisode(t.nextEpisode) },
    { label: "Last episode", value: formatEpisode(t.lastEpisode) },
    { label: "Seasons", value: t.seasons.length || null },
    {
      label: "Episodes",
      value: t.seasons.reduce((n, s) => n + s.episodeCount, 0) || null,
    },
    { label: "First aired", value: formatDate(t.firstAirDate) },
    { label: "Last aired", value: formatDate(t.lastAirDate) },
    { label: "Status", value: t.status },
    { label: "Type", value: t.showType },
    { label: "In production", value: t.inProduction ? "Yes" : null },
    list("Network", "Networks", t.networks),
    list("Studio", "Studios", t.studios),
    list("Country", "Countries", t.countries),
    { label: "Original language", value: t.language },
    list("Spoken language", "Spoken languages", t.spokenLanguages),
    { label: "Average score", value: average(t.voteAverage) },
    links(t.imdbId, t.homepage),
  ]);
}

/** The phone's one-line strip under the title. The year is already beside
 *  the title, so it isn't repeated. */
export function movieStrip(m: MovieDetail): string[] {
  const avg = average(m.voteAverage);
  return [formatRuntime(m.runtime), avg != null ? `${avg} average` : null].filter(
    (s): s is string => s != null
  );
}

export function tvStrip(t: TvDetail): string[] {
  const avg = average(t.voteAverage);
  return [
    formatSeasons(t.seasons.length || null),
    avg != null ? `${avg} average` : null,
  ].filter((s): s is string => s != null);
}
