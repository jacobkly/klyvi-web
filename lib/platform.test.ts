import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useIsMac } from "./platform";

describe("useIsMac", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["MacIntel", true],
    ["Win32", false],
  ])("answers for platform %s once mounted", (platform, want) => {
    vi.stubGlobal("navigator", { platform, userAgent: "" });
    const { result } = renderHook(() => useIsMac());
    expect(result.current).toBe(want);
  });
});
