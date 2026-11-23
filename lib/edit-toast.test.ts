import { describe, expect, it } from "vitest";

import { editToast } from "./edit-toast";

const before = { status: "completed" as const, score: 70 };

it("names a favorite change when nothing else changed", () => {
  const at = { status: "completed" as const, score: 80 };
  expect(
    editToast({ ...at, favorite: false }, { ...at, favorite: true }, "hundred")
  ).toBe("Added to favorites");
  expect(
    editToast({ ...at, favorite: true }, { ...at, favorite: false }, "hundred")
  ).toBe("Removed from favorites");
});

describe("editToast", () => {
  it("names the new status when the status changed", () => {
    expect(editToast(before, { status: "dropped", score: 70 }, "hundred")).toBe(
      "Dropped"
    );
  });

  it("names the score when only the score changed", () => {
    expect(editToast(before, { status: "completed", score: 88 }, "hundred")).toBe(
      "Score saved, 88"
    );
  });

  it("writes the score in the chosen system", () => {
    expect(editToast(before, { status: "completed", score: 80 }, "stars")).toBe(
      "Score saved, 4/5"
    );
  });

  it("says the score was cleared", () => {
    expect(editToast(before, { status: "completed", score: null }, "hundred")).toBe(
      "Score cleared"
    );
  });

  it("says saved when neither changed, such as a note", () => {
    expect(editToast(before, { status: "completed", score: 70 }, "hundred")).toBe(
      "Saved"
    );
  });
});
