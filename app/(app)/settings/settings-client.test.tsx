import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsClient } from "./settings-client";

const getMe = vi.fn();
vi.mock("@/lib/api/users", () => ({
  getMe: () => getMe(),
}));
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({ user: { email: "a@b.c" }, setProfile: vi.fn() }),
}));
// The sections are tested on their own. Here they only need to show up.
vi.mock("@/components/settings/profile-section", () => ({
  ProfileSection: ({ me }: { me: { username: string } | null }) => (
    <p>profile form for {me?.username ?? "nobody"}</p>
  ),
}));

describe("SettingsClient", () => {
  beforeEach(() => {
    getMe.mockReset();
  });

  it("shows an error with a retry, not a blank form, when the profile fails to load", async () => {
    getMe.mockRejectedValueOnce(new Error("timed out"));
    render(<SettingsClient />);

    expect(await screen.findByText("Could not load your settings.")).toBeTruthy();
    // A blank form would let a save overwrite the real profile with nothing.
    expect(screen.queryByText(/profile form/)).toBeNull();

    getMe.mockResolvedValueOnce({ username: "jacob", avatarUrl: null });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByText("profile form for jacob")).toBeTruthy()
    );
    expect(getMe).toHaveBeenCalledTimes(2);
  });
});
