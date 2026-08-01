import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AVATAR_MAX_BYTES,
  readBirthday,
  readLocalAvatar,
  subscribeLocalProfile,
  validateAvatarFile,
  validateBirthday,
  writeBirthday,
  writeLocalAvatar,
} from "./local-profile";

beforeEach(() => window.localStorage.clear());

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

describe("local avatar persistence", () => {
  it("round-trips and clears", () => {
    expect(readLocalAvatar()).toBeNull();
    expect(writeLocalAvatar("data:image/png;base64,AAA")).toBe(true);
    expect(readLocalAvatar()).toBe("data:image/png;base64,AAA");
    writeLocalAvatar(null);
    expect(readLocalAvatar()).toBeNull();
  });

  it("notifies subscribers on write", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLocalProfile(listener);
    writeLocalAvatar("data:image/png;base64,BBB");
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});

describe("birthday", () => {
  it("round-trips", () => {
    writeBirthday("1999-04-12");
    expect(readBirthday()).toBe("1999-04-12");
    writeBirthday(null);
    expect(readBirthday()).toBeNull();
  });

  it("rejects future dates and accepts past ones", () => {
    expect(validateBirthday("2900-01-01")).toMatch(/future/i);
    expect(validateBirthday("1999-04-12")).toBeNull();
    expect(validateBirthday("not-a-date")).toMatch(/date/i);
  });
});
