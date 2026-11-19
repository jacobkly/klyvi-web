import { describe, expect, it } from "vitest";

import { adminHref, ago, readAdminParams } from "./admin";

describe("readAdminParams", () => {
  it.each([
    [{}, { status: "open", offset: 0, openId: null }],
    [{ status: "resolved" }, { status: "resolved", offset: 0, openId: null }],
    [{ status: "all", offset: "50", id: "12" }, { status: "all", offset: 50, openId: 12 }],
    // Anything odd falls back rather than reaching the API as a 400.
    [{ status: "closed", offset: "-5", id: "x" }, { status: "open", offset: 0, openId: null }],
    [{ status: ["all", "open"], offset: "2.5" }, { status: "open", offset: 0, openId: null }],
  ])("reads %j", (params, want) => {
    expect(readAdminParams(params)).toEqual(want);
  });
});

describe("adminHref", () => {
  it("leaves the defaults out", () => {
    expect(adminHref({ status: "open", offset: 0, openId: null })).toBe("/admin");
  });

  it("keeps the tab, the page and the open group", () => {
    expect(adminHref({ status: "all", offset: 50, openId: 12 })).toBe(
      "/admin?status=all&offset=50&id=12"
    );
  });
});

describe("ago", () => {
  const now = Date.parse("2026-11-18T12:00:00Z");
  it.each([
    ["2026-11-18T11:59:40Z", "just now"],
    ["2026-11-18T11:50:00Z", "10 min ago"],
    ["2026-11-18T09:00:00Z", "3 h ago"],
    ["2026-11-17T09:00:00Z", "yesterday"],
    ["2026-11-10T12:00:00Z", "8 days ago"],
    ["nonsense", ""],
  ])("%s is %s", (iso, want) => {
    expect(ago(iso, now)).toBe(want);
  });
});
