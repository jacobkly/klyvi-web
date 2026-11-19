import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (actual) => ({
  ...(await actual<typeof import("next/navigation")>()),
  useRouter: () => ({ push: vi.fn() }),
}));

import { metadata as attribution } from "./(app)/attribution/page";
import { metadata as copyright } from "./(app)/copyright/page";
import { metadata as explore } from "./(app)/explore/page";
import { metadata as top100Films } from "./(app)/explore/top-100-films/page";
import { metadata as top100Tv } from "./(app)/explore/top-100-tv/page";
import { metadata as privacy } from "./(app)/privacy/page";
import { metadata as terms } from "./(app)/terms/page";
import { metadata as landing } from "./page";

// #115: with www as the main address, every public page names its own
// canonical URL there (metadataBase supplies the host).
describe("canonical links", () => {
  it.each([
    ["/", landing],
    ["/explore", explore],
    ["/explore/top-100-films", top100Films],
    ["/explore/top-100-tv", top100Tv],
    ["/privacy", privacy],
    ["/terms", terms],
    ["/copyright", copyright],
    ["/attribution", attribution],
  ])("%s points at itself", (path, metadata) => {
    expect(metadata).toMatchObject({ alternates: { canonical: path } });
  });
});
