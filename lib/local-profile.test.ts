import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_BYTES,
  validateAvatarFile,
  validateBirthday,
} from "./local-profile";

describe("validateAvatarFile", () => {
  it("rejects non-images", () => {
    expect(validateAvatarFile({ type: "text/plain", size: 10 })).toMatch(
      /not an image/i
    );
  });

  it("rejects oversized images", () => {
    expect(
      validateAvatarFile({ type: "image/png", size: AVATAR_MAX_BYTES + 1 })
    ).toMatch(/2 MB/);
  });

  it("accepts a small png", () => {
    expect(validateAvatarFile({ type: "image/png", size: 1024 })).toBeNull();
  });
});

describe("validateBirthday", () => {
  it("rejects future dates and accepts past ones", () => {
    expect(validateBirthday("2900-01-01")).toMatch(/future/i);
    expect(validateBirthday("1999-04-12")).toBeNull();
    expect(validateBirthday("not-a-date")).toMatch(/date/i);
  });
});
