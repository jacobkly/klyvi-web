import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/http";

import { startFailure } from "./use-import-job";

describe("startFailure", () => {
  it.each([
    ["an import already running", new ApiError("busy", 409, null), "active"],
    ["a file over the size or title cap", new ApiError("big", 413, null), "too-large"],
    ["a file that could not be parsed", new ApiError("bad", 400, null), "other"],
    ["a network failure", new TypeError("Failed to fetch"), "other"],
  ])("reads %s", (_, err, want) => {
    expect(startFailure(err)).toBe(want);
  });
});
