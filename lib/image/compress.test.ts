import { describe, expect, it } from "vitest";

import { AVATAR_TARGET_BYTES, shrinkToTarget } from "./compress";

type Call = { edge: number; quality: number };

/**
 * A stand-in for canvas encoding (jsdom has no canvas). `sizeFor` decides
 * how big each attempt comes out, and every attempt is recorded.
 */
function fakeEncoder(sizeFor: (c: Call) => number) {
  const calls: Call[] = [];
  const encode = async (edge: number, quality: number) => {
    calls.push({ edge, quality });
    return new Blob([new Uint8Array(sizeFor({ edge, quality }))]);
  };
  return { calls, encode };
}

const OVER = AVATAR_TARGET_BYTES + 1;
const UNDER = AVATAR_TARGET_BYTES - 1;

describe("shrinkToTarget", () => {
  it("stops after one attempt when the first encode fits", async () => {
    const { calls, encode } = fakeEncoder(() => 200 * 1024);

    const out = await shrinkToTarget(encode, 4000);

    expect(calls).toEqual([{ edge: 1024, quality: 0.85 }]);
    expect(out.size).toBe(200 * 1024);
  });

  it("steps quality down before it touches the size", async () => {
    const { calls, encode } = fakeEncoder(({ quality }) =>
      quality > 0.65 ? OVER : UNDER
    );

    await shrinkToTarget(encode, 4000);

    expect(calls).toEqual([
      { edge: 1024, quality: 0.85 },
      { edge: 1024, quality: 0.75 },
      { edge: 1024, quality: 0.65 },
    ]);
  });

  it("shrinks the edge by a quarter once every quality is too big", async () => {
    const { calls, encode } = fakeEncoder(({ edge }) =>
      edge > 768 ? OVER : UNDER
    );

    await shrinkToTarget(encode, 4000);

    expect(calls.map((c) => c.edge)).toEqual([1024, 1024, 1024, 1024, 768]);
    expect(calls.at(-1)).toEqual({ edge: 768, quality: 0.85 });
  });

  it("never scales a small source up", async () => {
    const { calls, encode } = fakeEncoder(() => UNDER);

    await shrinkToTarget(encode, 300);

    expect(calls).toEqual([{ edge: 300, quality: 0.85 }]);
  });

  it("gives up at the smallest edge and returns the last attempt", async () => {
    const { calls, encode } = fakeEncoder(({ edge, quality }) =>
      OVER + edge + Math.round(quality * 100)
    );

    const out = await shrinkToTarget(encode, 4000);

    const last = calls.at(-1)!;
    expect(last.edge).toBeGreaterThanOrEqual(256);
    expect(Math.round(last.edge * 0.75)).toBeLessThan(256);
    expect(last.quality).toBe(0.55);
    expect(out.size).toBe(OVER + last.edge + 55);
  });
});
