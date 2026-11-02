import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_SOURCE_BYTES,
  validateAvatarFile,
  validateBirthday,
} from "./local-profile";

describe("validateAvatarFile", () => {
  it("rejects non-images", () => {
    expect(validateAvatarFile({ type: "text/plain", size: 10 })).toMatch(
      /not an image/i
    );
  });

  it("accepts a large phone photo, since it is shrunk before upload", () => {
    expect(
      validateAvatarFile({ type: "image/jpeg", size: 12 * 1024 * 1024 })
    ).toBeNull();
  });

  it("refuses a file too big to read in the browser", () => {
    expect(
      validateAvatarFile({ type: "image/png", size: AVATAR_MAX_SOURCE_BYTES + 1 })
    ).toMatch(/50 MB/);
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
