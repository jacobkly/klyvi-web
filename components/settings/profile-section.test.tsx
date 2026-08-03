import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfile } from "@/lib/types";

import { ProfileSection } from "./profile-section";

const updateMe = vi.fn(() => Promise.resolve(me()));
const uploadAvatar = vi.fn(() => Promise.resolve(me("https://cdn/a.jpg")));
const deleteAvatar = vi.fn(() => Promise.resolve(me()));
vi.mock("@/lib/api/users", () => ({
  updateMe: (...a: unknown[]) => updateMe(...(a as [])),
  uploadAvatar: (...a: unknown[]) => uploadAvatar(...(a as [])),
  deleteAvatar: (...a: unknown[]) => deleteAvatar(...(a as [])),
}));
vi.mock("@/lib/use-username-availability", () => ({
  useUsernameAvailability: () => ({ kind: "idle" }),
  availabilityMessage: () => null,
}));

function me(avatarUrl: string | null = null): UserProfile {
  return {
    id: "u1",
    username: "jacob",
    usernameChangedAt: null,
    bio: null,
    avatarUrl,
    bannerUrl: null,
    birthday: null,
    settings: {},
    createdAt: "2026-01-01T00:00:00Z",
  };
}

describe("ProfileSection avatar and birthday", () => {
  beforeEach(() => {
    updateMe.mockClear();
    uploadAvatar.mockClear();
    deleteAvatar.mockClear();
  });

  it("uploads an image through the API and reports the updated profile", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<ProfileSection me={me()} onSaved={onSaved} />);

    const file = new File([new Uint8Array([137, 80, 78, 71])], "me.png", {
      type: "image/png",
    });
    await user.upload(screen.getByLabelText(/upload a profile image/i), file);

    await waitFor(() => expect(uploadAvatar).toHaveBeenCalledWith(file));
    expect(onSaved).toHaveBeenCalled();
  });

  it("rejects a non-image without calling the API", async () => {
    const user = userEvent.setup();
    render(<ProfileSection me={me()} onSaved={() => {}} />);

    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText(/upload a profile image/i), file);

    await new Promise((r) => setTimeout(r, 0));
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it("sends the birthday to the API on save", async () => {
    const user = userEvent.setup();
    updateMe.mockClear();
    render(<ProfileSection me={me()} onSaved={() => {}} />);

    await user.type(screen.getByLabelText(/birthday/i), "1999-04-12");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateMe).toHaveBeenCalledWith(
        expect.objectContaining({ birthday: "1999-04-12" })
      )
    );
  });
});
