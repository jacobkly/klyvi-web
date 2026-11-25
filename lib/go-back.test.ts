import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({
  path: "/movie/1",
  back: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.path,
  useRouter: () => ({ back: nav.back, replace: nav.replace }),
}));

import { backFallback, isDetailPath, stepsBack, useGoBack } from "./go-back";

describe("isDetailPath", () => {
  it("is films, shows and seasons", () => {
    for (const p of ["/movie/1", "/tv/2", "/tv/2/season/3"]) {
      expect(isDetailPath(p)).toBe(true);
    }
    for (const p of ["/home", "/explore/browse/popular", "/movie", "/tvs/1"]) {
      expect(isDetailPath(p)).toBe(false);
    }
  });
});

describe("backFallback", () => {
  it("is the show for a season and Explore for the rest", () => {
    expect(backFallback("/tv/2/season/3")).toBe("/tv/2");
    expect(backFallback("/tv/2")).toBe("/explore");
    expect(backFallback("/movie/1")).toBe("/explore");
  });
});

describe("stepsBack", () => {
  it("is one step to the page before", () => {
    expect(stepsBack(["/library", "/movie/1"])).toBe(1);
  });

  it("goes past other entries for the same page", () => {
    expect(stepsBack(["/library", "/movie/1", "/movie/1"])).toBe(2);
  });

  it("goes past signing in and up", () => {
    expect(stepsBack(["/explore", "/movie/1", "/signin", "/movie/1"])).toBe(3);
    expect(stepsBack(["/signup", "/onboarding/rate", "/movie/1"])).toBe(0);
  });

  it("has nowhere to go on a direct link", () => {
    expect(stepsBack(["/movie/1"])).toBe(0);
    expect(stepsBack([null, "/movie/1"])).toBe(0);
  });
});

describe("useGoBack", () => {
  const go = vi.fn();

  function historyOf(paths: string[], index = paths.length - 1) {
    vi.stubGlobal("navigation", {
      entries: () => paths.map((p) => ({ url: `http://localhost${p}` })),
      currentEntry: { index },
    });
  }

  beforeEach(() => {
    nav.path = "/movie/1";
    nav.back.mockReset();
    nav.replace.mockReset();
    go.mockReset();
    vi.spyOn(window.history, "go").mockImplementation(go);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns to the page the user came from, whatever lies ahead", () => {
    historyOf(["/library", "/movie/1", "/movie/2"], 1);
    renderHook(() => useGoBack()).result.current();
    expect(go).toHaveBeenCalledWith(-1);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("stays on Klyvi when the page was opened from a link", () => {
    historyOf(["/movie/1"]);
    renderHook(() => useGoBack()).result.current();
    expect(go).not.toHaveBeenCalled();
    expect(nav.replace).toHaveBeenCalledWith("/explore");
  });

  it("without the Navigation API, goes back only after moving within the app", () => {
    vi.stubGlobal("navigation", undefined);
    const { result, rerender } = renderHook(() => useGoBack());
    result.current();
    expect(nav.back).not.toHaveBeenCalled();
    expect(nav.replace).toHaveBeenCalledWith("/explore");

    nav.path = "/movie/2";
    rerender();
    result.current();
    expect(nav.back).toHaveBeenCalledOnce();
  });
});
