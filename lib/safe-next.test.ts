import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-next";

const ORIGIN = "https://klyvi.net";

describe("safeNext", () => {
  it.each([
    ["a protocol-relative url", "//evil.com"],
    ["a backslash the browser reads as a slash", "/\\evil.com"],
    ["an absolute url to another site", "https://evil.com"],
    ["an encoded protocol-relative url", "/%2F%2Fevil.com"],
    ["a tab hidden inside the slashes", "/\t/evil.com"],
    ["a javascript url", "javascript:alert(1)"],
    ["a relative path with no leading slash", "home"],
  ])("sends %s to /home", (_, raw) => {
    expect(safeNext(raw, ORIGIN)).toBe("/home");
  });

  it("falls back to /home when next is missing or empty", () => {
    expect(safeNext(null, ORIGIN)).toBe("/home");
    expect(safeNext(undefined, ORIGIN)).toBe("/home");
    expect(safeNext("", ORIGIN)).toBe("/home");
  });

  it("keeps a normal path with its query and hash", () => {
    expect(safeNext("/find?mood=cozy#top", ORIGIN)).toBe("/find?mood=cozy#top");
  });

  it("only takes paths, even an absolute url to this site", () => {
    expect(safeNext("https://klyvi.net/library", ORIGIN)).toBe("/home");
  });
});
