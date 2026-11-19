import { describe, expect, it } from "vitest";

import { libraryQuery, readLibraryParams } from "./library-params";

describe("readLibraryParams", () => {
  it("reads every known param", () => {
    expect(
      readLibraryParams(
        new URLSearchParams(
          "status=watching&type=season&q=dune&sort=score&order=asc&view=grid&tab=season"
        )
      )
    ).toEqual({
      status: "watching",
      type: "season",
      q: "dune",
      sort: "score",
      order: "asc",
      view: "grid",
      tab: "season",
    });
  });

  it("drops values it doesn't know", () => {
    expect(
      readLibraryParams(new URLSearchParams("status=binge&sort=vibes&view=wall&tab=tv"))
    ).toEqual({});
  });

  it("takes the page's searchParams object too", () => {
    expect(readLibraryParams({ status: ["paused", "dropped"], q: "x" })).toEqual({
      status: "paused",
      q: "x",
    });
  });
});

describe("libraryQuery", () => {
  it("round-trips through the URL", () => {
    const p = {
      status: "completed",
      type: "movie",
      q: "the thing",
      sort: "year",
      order: "desc",
      view: "list",
      tab: "season",
    } as const;
    const qs = libraryQuery("", p);
    expect(readLibraryParams(new URLSearchParams(qs))).toEqual(p);
  });

  it("leaves out the defaults", () => {
    expect(libraryQuery("", { status: "all", type: "all", q: "", tab: "movie" })).toBe("");
  });

  it("keeps params that aren't the library's", () => {
    expect(libraryQuery("?state=empty&status=paused", { status: "watching" })).toBe(
      "?state=empty&status=watching"
    );
  });
});
