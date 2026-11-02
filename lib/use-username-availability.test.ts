import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUsernameAvailability } from "./use-username-availability";

const checkUsernameAvailable = vi.fn();
vi.mock("@/lib/api/users", () => ({
  checkUsernameAvailable: (...a: unknown[]) => checkUsernameAvailable(...a),
}));

describe("useUsernameAvailability", () => {
  beforeEach(() => {
    checkUsernameAvailable.mockReset();
  });

  it.each([
    ["an empty field", "  ", undefined],
    ["the name the user already owns", "Cinephile", "cinephile"],
    ["a name that fails format checks", "no spaces allowed", undefined],
  ])("stays idle without asking the API for %s", async (_, name, skip) => {
    const { result } = renderHook(() =>
      useUsernameAvailability(name, { skip })
    );
    expect(result.current).toEqual({ kind: "idle" });
    await new Promise((r) => setTimeout(r, 450));
    expect(checkUsernameAvailable).not.toHaveBeenCalled();
  });

  it.each([
    [{ available: true }, "free"],
    [{ available: false, reason: "taken" }, "taken"],
    [{ available: false, reason: "reserved" }, "reserved"],
  ])("checks, then reports %o as %s", async (reply, kind) => {
    checkUsernameAvailable.mockResolvedValue(reply);
    const { result } = renderHook(() => useUsernameAvailability("filmfan"));

    expect(result.current).toEqual({ kind: "checking" });
    await waitFor(() => expect(result.current).toEqual({ kind }));
    expect(checkUsernameAvailable).toHaveBeenCalledTimes(1);
  });

  it("does not show the last name's answer for a new name", async () => {
    checkUsernameAvailable.mockResolvedValueOnce({ available: true });
    const { result, rerender } = renderHook(
      ({ name }) => useUsernameAvailability(name),
      { initialProps: { name: "filmfan" } }
    );
    await waitFor(() => expect(result.current).toEqual({ kind: "free" }));

    checkUsernameAvailable.mockResolvedValueOnce({
      available: false,
      reason: "taken",
    });
    rerender({ name: "filmfans" });
    expect(result.current).toEqual({ kind: "checking" });
    await waitFor(() => expect(result.current).toEqual({ kind: "taken" }));
  });

  it("goes idle when the name is cleared after an answer", async () => {
    checkUsernameAvailable.mockResolvedValueOnce({ available: true });
    const { result, rerender } = renderHook(
      ({ name }) => useUsernameAvailability(name),
      { initialProps: { name: "filmfan" } }
    );
    await waitFor(() => expect(result.current).toEqual({ kind: "free" }));

    rerender({ name: "" });
    expect(result.current).toEqual({ kind: "idle" });
  });

  it("goes quiet when the lookup fails", async () => {
    checkUsernameAvailable.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useUsernameAvailability("filmfan"));
    expect(result.current).toEqual({ kind: "checking" });
    await waitFor(() => expect(result.current).toEqual({ kind: "idle" }));
  });
});
