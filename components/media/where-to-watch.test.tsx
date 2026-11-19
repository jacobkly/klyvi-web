import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WatchProviders } from "@/lib/types";

import { WhereToWatch } from "./where-to-watch";

const getProviders = vi.fn();

vi.mock("@/lib/api/catalog", () => ({
  getProviders: (...a: unknown[]) => getProviders(...a),
}));

function offers(over: Partial<WatchProviders> = {}): WatchProviders {
  return {
    region: "GB",
    regions: ["GB", "US"],
    link: "https://www.themoviedb.org/tv/95396-severance/watch?locale=GB",
    stream: [{ id: 350, name: "Apple TV+", logoPath: "/apple.jpg" }],
    free: [],
    ads: [],
    rent: [],
    buy: [{ id: 3, name: "Google Play Movies", logoPath: null }],
    ...over,
  };
}

function setLanguages(langs: string[]) {
  Object.defineProperty(window.navigator, "languages", {
    value: langs,
    configurable: true,
  });
}

describe("WhereToWatch", () => {
  beforeEach(() => {
    getProviders.mockReset();
    window.localStorage.clear();
    setLanguages(["en-GB"]);
  });
  afterEach(() => {
    setLanguages(["en-US"]);
  });

  it("asks for the browser's country and credits JustWatch beside the providers", async () => {
    getProviders.mockResolvedValue(offers());
    render(<WhereToWatch kind="tv" tmdbId={95396} title="Severance" />);

    const section = await screen.findByRole("region", { name: "Where to watch" });
    expect(getProviders).toHaveBeenCalledWith("tv", 95396, "GB", expect.anything());

    const stream = within(section).getByRole("list", { name: "Stream" });
    expect(within(stream).getByText("Apple TV+")).toBeInTheDocument();
    const buy = within(section).getByRole("list", { name: "Buy" });
    expect(within(buy).getByText("Google Play Movies")).toBeInTheDocument();
    // Kinds with nothing on offer are left out.
    expect(within(section).queryByRole("list", { name: "Rent" })).toBeNull();

    const credit = within(section).getByRole("link", { name: /JustWatch/ });
    expect(credit).toHaveAttribute("href", "https://www.justwatch.com/");
    expect(
      within(section).getByRole("link", { name: /every option on TMDB/ })
    ).toHaveAttribute("href", offers().link);
  });

  it("opens on a country picked earlier", async () => {
    window.localStorage.setItem("klyvi:watch-region", "US");
    getProviders.mockResolvedValue(offers({ region: "US" }));
    render(<WhereToWatch kind="movies" tmdbId={1} title="A film" />);

    await screen.findByRole("region", { name: "Where to watch" });
    expect(getProviders).toHaveBeenCalledWith("movies", 1, "US", expect.anything());
  });

  it("says so when nothing is on offer in your country, still with the credit", async () => {
    getProviders.mockResolvedValue(
      offers({ stream: [], buy: [], link: null, regions: ["US"] })
    );
    render(<WhereToWatch kind="tv" tmdbId={95396} title="Severance" />);

    const section = await screen.findByRole("region", { name: "Where to watch" });
    expect(
      within(section).getByText(/No streaming, rental or purchase options for Severance in United Kingdom/)
    ).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: /JustWatch/ })).toBeInTheDocument();
  });

  it("stays out of the way for a title with no offers anywhere", async () => {
    getProviders.mockResolvedValue(
      offers({ stream: [], buy: [], link: null, regions: [] })
    );
    const { container } = render(
      <WhereToWatch kind="movies" tmdbId={2} title="Obscure" />
    );

    await waitFor(() => expect(getProviders).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("offers a retry when the request fails", async () => {
    getProviders.mockRejectedValueOnce(new Error("down"));
    getProviders.mockResolvedValueOnce(offers());
    render(<WhereToWatch kind="tv" tmdbId={95396} title="Severance" />);

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Apple TV+")).toBeInTheDocument();
    expect(getProviders).toHaveBeenCalledTimes(2);
  });
});
