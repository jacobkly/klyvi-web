import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useSession } from "./auth-provider";

type AuthCallback = (event: string, session: unknown) => void;
let fireAuth: AuthCallback = () => {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/supabase/browser", () => ({
  getBrowserSupabase: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (cb: AuthCallback) => {
        fireAuth = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      updateUser: async () => ({}),
    },
  }),
}));
const getMe = vi.fn();
vi.mock("@/lib/api/users", () => ({
  getMe: () => getMe(),
  updateMe: vi.fn(async () => ({})),
}));
vi.mock("@/lib/local-prefs", () => ({
  seedPrefs: vi.fn(),
  setPrefsPusher: vi.fn(),
}));

function Greeting() {
  const { profile } = useSession();
  return <p>{profile ? profile.username : "signed out"}</p>;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    getMe.mockReset().mockResolvedValue({ username: "filmfan", settings: {} });
  });

  it("drops the profile when the user signs out", async () => {
    render(
      <AuthProvider>
        <Greeting />
      </AuthProvider>
    );
    expect(await screen.findByText("signed out")).toBeInTheDocument();

    act(() => fireAuth("SIGNED_IN", { user: { id: "u1", user_metadata: {} } }));
    expect(await screen.findByText("filmfan")).toBeInTheDocument();

    act(() => fireAuth("SIGNED_OUT", null));
    expect(await screen.findByText("signed out")).toBeInTheDocument();
  });

  it("fetches the profile once while the session refreshes its token", async () => {
    render(
      <AuthProvider>
        <Greeting />
      </AuthProvider>
    );
    await screen.findByText("signed out");

    act(() => fireAuth("SIGNED_IN", { user: { id: "u1", user_metadata: {} } }));
    await screen.findByText("filmfan");
    // Supabase hands over a new user object on every refresh and tab focus.
    act(() => fireAuth("TOKEN_REFRESHED", { user: { id: "u1", user_metadata: {} } }));
    act(() => fireAuth("SIGNED_IN", { user: { id: "u1", user_metadata: {} } }));
    await screen.findByText("filmfan");

    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it("reports a failed profile load and loads it again on reload", async () => {
    getMe.mockRejectedValueOnce(new Error("offline"));
    function Status() {
      const { profile, profileFailed, reloadProfile } = useSession();
      return (
        <>
          <p>{profile ? profile.username : profileFailed ? "failed" : "waiting"}</p>
          <button type="button" onClick={reloadProfile}>
            reload
          </button>
        </>
      );
    }
    render(
      <AuthProvider>
        <Status />
      </AuthProvider>
    );
    // Let the first getSession (no session) land before signing in.
    await act(async () => {});
    act(() => fireAuth("SIGNED_IN", { user: { id: "u1", user_metadata: {} } }));
    expect(await screen.findByText("failed")).toBeInTheDocument();

    act(() => screen.getByRole("button", { name: "reload" }).click());
    expect(await screen.findByText("filmfan")).toBeInTheDocument();
    expect(getMe).toHaveBeenCalledTimes(2);
  });
});
