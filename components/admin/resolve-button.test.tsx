import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setErrorResolved } from "@/lib/api/admin";

import { ResolveButton } from "./resolve-button";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/api/admin", () => ({ setErrorResolved: vi.fn() }));

const setMock = vi.mocked(setErrorResolved);

beforeEach(() => {
  refresh.mockReset();
  setMock.mockReset();
});

describe("ResolveButton", () => {
  it("resolves an open group, then refreshes the page", async () => {
    setMock.mockResolvedValue({} as never);
    render(<ResolveButton id={4} resolved={false} />);

    await userEvent.click(screen.getByRole("button", { name: "Resolve" }));

    expect(setMock).toHaveBeenCalledWith(4, true);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("reopens a resolved group", async () => {
    setMock.mockResolvedValue({} as never);
    render(<ResolveButton id={4} resolved />);

    await userEvent.click(screen.getByRole("button", { name: "Reopen" }));

    expect(setMock).toHaveBeenCalledWith(4, false);
  });

  it("says so when it fails, and stays usable", async () => {
    setMock.mockRejectedValue(new Error("Request failed (500)"));
    render(<ResolveButton id={4} resolved={false} />);

    await userEvent.click(screen.getByRole("button", { name: "Resolve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save that. Try again.");
    expect(screen.getByRole("button", { name: "Resolve" })).toBeEnabled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
