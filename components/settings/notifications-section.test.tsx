import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { browserFetch } from "@/lib/api/http";
import type { WireUser } from "@/lib/api/wire";
import type { UserProfile } from "@/lib/types";

import { NotificationsSection } from "./notifications-section";

const toast = vi.fn();

vi.mock("@/lib/api/http", () => ({ browserFetch: vi.fn(), apiFetch: vi.fn() }));
vi.mock("sonner", () => ({
  toast: (...args: unknown[]) => toast(...args),
}));

const fetchMock = vi.mocked(browserFetch);

function me(over: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "u1",
    username: "jacob",
    usernameChangedAt: null,
    bio: null,
    avatarUrl: null,
    bannerUrl: null,
    birthday: null,
    settings: {},
    notifyPremieres: true,
    notifyReleases: true,
    createdAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

function wire(over: Partial<WireUser> = {}): WireUser {
  return {
    id: "u1",
    username: "jacob",
    username_changed_at: null,
    bio: null,
    avatar_url: null,
    banner_url: null,
    birthday: null,
    settings: {},
    notify_premieres: true,
    notify_releases: true,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  toast.mockReset();
});

describe("NotificationsSection", () => {
  it("shows what the account has saved", () => {
    render(
      <NotificationsSection
        me={me({ notifyReleases: false })}
        onSaved={vi.fn()}
      />
    );
    expect(screen.getByRole("switch", { name: "Season premieres" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Film releases" })).not.toBeChecked();
  });

  it("sends the PATCH for season premieres", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    fetchMock.mockResolvedValue(wire({ notify_premieres: false }));
    render(<NotificationsSection me={me()} onSaved={onSaved} />);

    await user.click(screen.getByRole("switch", { name: "Season premieres" }));

    expect(fetchMock).toHaveBeenCalledWith("/v1/users/me", {
      method: "PATCH",
      body: { notify_premieres: false },
    });
    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith(
        expect.objectContaining({ notifyPremieres: false })
      )
    );
  });

  it("sends the PATCH for film releases", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(wire({ notify_releases: true }));
    render(
      <NotificationsSection
        me={me({ notifyReleases: false })}
        onSaved={vi.fn()}
      />
    );

    await user.click(screen.getByRole("switch", { name: "Film releases" }));

    expect(fetchMock).toHaveBeenCalledWith("/v1/users/me", {
      method: "PATCH",
      body: { notify_releases: true },
    });
  });

  it("moves the switch straight away", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<NotificationsSection me={me()} onSaved={vi.fn()} />);

    const premieres = screen.getByRole("switch", { name: "Season premieres" });
    await user.click(premieres);
    expect(premieres).not.toBeChecked();
  });

  it("puts the switch back and says so when the save fails", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    fetchMock.mockRejectedValue(new Error("down"));
    render(<NotificationsSection me={me()} onSaved={onSaved} />);

    const premieres = screen.getByRole("switch", { name: "Season premieres" });
    await user.click(premieres);

    await waitFor(() => expect(premieres).toBeChecked());
    expect(toast).toHaveBeenCalledWith("Could not save that. Try again");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("holds the switches until the account has loaded", () => {
    render(<NotificationsSection me={null} onSaved={vi.fn()} />);
    // Base UI renders the switch as a span, so the state is in the aria.
    expect(screen.getByRole("switch", { name: "Season premieres" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(screen.getByRole("switch", { name: "Film releases" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("offers no switch for things that do not exist, and keeps the email line", () => {
    render(<NotificationsSection me={me()} onSaved={vi.fn()} />);

    expect(screen.getAllByRole("switch")).toHaveLength(2);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(/saved on this device/i)).toBeNull();
    expect(
      screen.getByText("Account and security email cannot be turned off.")
    ).toBeInTheDocument();
  });
});
