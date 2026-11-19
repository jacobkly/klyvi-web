import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsClient } from "./settings-client";

const getMe = vi.fn();
vi.mock("@/lib/api/users", () => ({
  getMe: () => getMe(),
}));
const reloadProfile = vi.fn();
let session: {
  profile: { username: string; avatarUrl: null } | null;
  profileFailed: boolean;
} = { profile: null, profileFailed: false };
vi.mock("@/components/auth/auth-provider", () => ({
  useSession: () => ({
    user: { email: "a@b.c" },
    setProfile: vi.fn(),
    reloadProfile,
    ...session,
  }),
}));
// The sections are tested on their own. Here they only need to show up.
vi.mock("@/components/settings/profile-section", () => ({
  ProfileSection: ({ me }: { me: { username: string } | null }) => (
    <p>profile form for {me?.username ?? "nobody"}</p>
  ),
}));

vi.mock("@/components/settings/account-section", () => ({
  AccountSection: () => <p>account form</p>,
}));
vi.mock("@/components/settings/appearance-section", () => ({
  AppearanceSection: () => <p>appearance form</p>,
}));

describe("SettingsClient", () => {
  beforeEach(() => {
    getMe.mockReset();
    reloadProfile.mockReset();
  });

  it("groups Profile and Account under Account, so no group shares an item's name", () => {
    session = { profile: { username: "jacob", avatarUrl: null }, profileFailed: false };
    render(<SettingsClient />);
    const rail = screen.getByRole("navigation", { name: "Settings" });
    const groups = Array.from(rail.querySelectorAll("p")).map((p) => p.textContent);
    expect(groups).toEqual(["Account", "Preferences", "Data"]);
  });

  it("starts from the profile the session already holds, with no fetch of its own", () => {
    session = { profile: { username: "jacob", avatarUrl: null }, profileFailed: false };
    render(<SettingsClient />);
    expect(screen.getByText("profile form for jacob")).toBeTruthy();
    expect(getMe).not.toHaveBeenCalled();
  });

  it("shows an error with a retry, not a blank form, when the profile fails to load", () => {
    session = { profile: null, profileFailed: true };
    render(<SettingsClient />);

    expect(screen.getByText("Could not load your settings.")).toBeTruthy();
    // A blank form would let a save overwrite the real profile with nothing.
    expect(screen.queryByText(/profile form/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reloadProfile).toHaveBeenCalledTimes(1);
  });

  it("opens the section the url names", () => {
    session = { profile: { username: "jacob", avatarUrl: null }, profileFailed: false };
    render(<SettingsClient initialSection="account" />);
    expect(screen.getByText("account form")).toBeTruthy();
  });

  it("gives each section its own url, so Back returns to the last one", async () => {
    session = { profile: { username: "jacob", avatarUrl: null }, profileFailed: false };
    window.history.replaceState(null, "", "/settings");
    render(<SettingsClient />);

    fireEvent.click(screen.getAllByRole("button", { name: "Appearance" })[0]);
    expect(screen.getByText("appearance form")).toBeTruthy();
    expect(window.location.search).toBe("?section=appearance");

    window.history.back();
    expect(await screen.findByText("profile form for jacob")).toBeTruthy();
  });
});
