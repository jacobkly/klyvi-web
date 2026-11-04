import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { browserFetch } from "@/lib/api/http";

import { UnreadProvider, useUnreadNotices } from "./unread-provider";

const session = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
}));

vi.mock("@/lib/api/http", () => ({ browserFetch: vi.fn(), apiFetch: vi.fn() }));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: session.user }),
}));

const fetchMock = vi.mocked(browserFetch);

const page = (unread: number) => ({
  notifications: [],
  unread_count: unread,
  has_more: false,
});

function Probe() {
  const { unread, setUnread } = useUnreadNotices();
  return (
    <>
      <p data-testid="count">{unread}</p>
      <button onClick={() => setUnread(0)}>Clear</button>
    </>
  );
}

function renderProbe() {
  return render(
    <UnreadProvider>
      <Probe />
    </UnreadProvider>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  session.user = { id: "u1" };
});

describe("UnreadProvider", () => {
  it("fetches the count once for a signed-in user", async () => {
    fetchMock.mockResolvedValue(page(2));
    renderProbe();

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("2")
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/v1/notifications?limit=1");
  });

  it("does not refetch when the session refreshes for the same user", async () => {
    fetchMock.mockResolvedValue(page(2));
    const { rerender } = renderProbe();
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("2")
    );

    session.user = { id: "u1" };
    rerender(
      <UnreadProvider>
        <Probe />
      </UnreadProvider>
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("asks nothing while signed out", () => {
    session.user = null;
    renderProbe();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("shows no count when the fetch fails", async () => {
    fetchMock.mockRejectedValue(new Error("down"));
    renderProbe();
    await act(async () => {});
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("does not bring the dot back when a slow first fetch lands after the page cleared it", async () => {
    let land: (v: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => (land = resolve)));
    renderProbe();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await act(async () => land(page(3)));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("forgets the count when the user signs out", async () => {
    fetchMock.mockResolvedValue(page(2));
    const { rerender } = renderProbe();
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("2")
    );

    session.user = null;
    rerender(
      <UnreadProvider>
        <Probe />
      </UnreadProvider>
    );
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
