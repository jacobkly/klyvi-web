import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { readBirthday, readLocalAvatar } from "@/lib/local-profile";
import type { UserProfile } from "@/lib/types";

import { ProfileSection } from "./profile-section";

vi.mock("@/lib/api/users", () => ({
  updateMe: vi.fn(() => Promise.resolve(me())),
}));
vi.mock("@/lib/use-username-availability", () => ({
  useUsernameAvailability: () => ({ kind: "idle" }),
  availabilityMessage: () => null,
}));

function me(): UserProfile {
  return {
    id: "u1",
    username: "jacob",
    usernameChangedAt: null,
    bio: null,
    avatarUrl: null,
    bannerUrl: null,
    birthday: null,
    settings: {},
    createdAt: "2026-01-01T00:00:00Z",
  };
}

describe("ProfileSection avatar and birthday", () => {
  beforeEach(() => window.localStorage.clear());

  it("uploads an image, persists it locally, and can remove it", async () => {
    const user = userEvent.setup();
    render(<ProfileSection me={me()} onSaved={() => {}} />);

    const file = new File([new Uint8Array([137, 80, 78, 71])], "me.png", {
      type: "image/png",
    });
    await user.upload(screen.getByLabelText(/upload a profile image/i), file);

    await waitFor(() => expect(readLocalAvatar()).toMatch(/^data:image\/png/));

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(readLocalAvatar()).toBeNull();
  });

  it("rejects a non-image without persisting", async () => {
    const user = userEvent.setup();
    render(<ProfileSection me={me()} onSaved={() => {}} />);

    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText(/upload a profile image/i), file);

    await waitFor(() => expect(readLocalAvatar()).toBeNull());
  });

  it("saves the birthday locally on save", async () => {
    const user = userEvent.setup();
    render(<ProfileSection me={me()} onSaved={() => {}} />);

    await user.type(screen.getByLabelText(/birthday/i), "1999-04-12");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(readBirthday()).toBe("1999-04-12"));
  });
});
