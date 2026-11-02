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
const compressAvatar = vi.fn<(file: Blob) => Promise<Blob>>(() =>
  Promise.resolve(new Blob(["small"], { type: "image/jpeg" }))
);
vi.mock("@/lib/image/compress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/image/compress")>()),
  compressAvatar: (file: Blob) => compressAvatar(file),
}));
const toast = vi.fn();
vi.mock("sonner", () => ({
  toast: (...args: unknown[]) => toast(...args),
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
    compressAvatar.mockClear();
    toast.mockReset();
  });

  it("uploads the compressed image, not the original", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<ProfileSection me={me()} onSaved={onSaved} />);

    const file = new File([new Uint8Array([137, 80, 78, 71])], "me.png", {
      type: "image/png",
    });
    await user.upload(screen.getByLabelText(/upload a profile image/i), file);

    await waitFor(() => expect(uploadAvatar).toHaveBeenCalled());
    expect(compressAvatar).toHaveBeenCalledWith(file);
    const sent = (uploadAvatar.mock.calls[0] as unknown[])[0] as Blob;
    expect(sent).not.toBe(file);
    expect(sent.type).toBe("image/jpeg");
    expect(onSaved).toHaveBeenCalled();
  });

  it("accepts a phone-sized photo instead of refusing it", async () => {
    const user = userEvent.setup();
    render(<ProfileSection me={me()} onSaved={() => {}} />);

    const file = new File([new Uint8Array(10 * 1024 * 1024)], "phone.jpg", {
      type: "image/jpeg",
    });
    await user.upload(screen.getByLabelText(/upload a profile image/i), file);

    await waitFor(() => expect(uploadAvatar).toHaveBeenCalled());
  });

  it("explains a photo the browser cannot read, and uploads nothing", async () => {
    const { AvatarDecodeError } = await import("@/lib/image/compress");
    compressAvatar.mockRejectedValueOnce(new AvatarDecodeError());
    const user = userEvent.setup();
    render(<ProfileSection me={me()} onSaved={() => {}} />);

    const file = new File(["not really a jpeg"], "broken.jpg", {
      type: "image/jpeg",
    });
    await user.upload(screen.getByLabelText(/upload a profile image/i), file);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.stringMatching(/could not read that image/i)
      )
    );
    expect(uploadAvatar).not.toHaveBeenCalled();
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
