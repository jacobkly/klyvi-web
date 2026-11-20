import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Episode } from "@/lib/types";

import { EpisodeList } from "./episode-list";

function episodes(n: number): Episode[] {
  return Array.from({ length: n }, (_, i) => ({
    number: i + 1,
    name: `Episode ${i + 1} title`,
    airDate: `2025-01-${String(17 + i).padStart(2, "0")}`,
    runtime: 50 + i,
    stillPath: i === 0 ? "/still.jpg" : null,
    overview: i === 0 ? "Mark returns to Lumon." : null,
  }));
}

describe("EpisodeList", () => {
  it("shows an episode's number, date and runtime", () => {
    render(<EpisodeList episodes={episodes(3)} next={null} />);
    const list = screen.getByRole("list", { name: "Episodes" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText("Episode 1 title")).toBeInTheDocument();
    expect(within(rows[0]).getByText("E1")).toBeInTheDocument();
    expect(within(rows[0]).getByText("17 Jan 2025")).toBeInTheDocument();
    expect(within(rows[0]).getByText("50m")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Mark returns to Lumon.")).toBeInTheDocument();
  });

  it("shows four episodes until asked for the rest", async () => {
    render(<EpisodeList episodes={episodes(22)} next={null} />);
    const list = screen.getByRole("list", { name: "Episodes" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    expect(within(list).getByText("E1")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Show all 22 episodes" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(22);

    await user.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
  });

  it("has no toggle when four or fewer episodes fit", () => {
    render(<EpisodeList episodes={episodes(4)} next={null} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the next episode in view while the season airs", () => {
    render(<EpisodeList episodes={episodes(10)} next={8} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((r) => within(r).getByText(/^E\d+$/).textContent)).toEqual([
      "E5",
      "E6",
      "E7",
      "E8",
    ]);
    expect(within(rows[3]).getByText("Next")).toBeInTheDocument();
  });

  it("marks the next episode to air", () => {
    render(<EpisodeList episodes={episodes(3)} next={3} />);
    const rows = screen.getAllByRole("listitem");
    expect(within(rows[2]).getByText("Next")).toBeInTheDocument();
    expect(within(rows[1]).queryByText("Next")).toBeNull();
  });

  it("names an episode TMDB hasn't titled yet", () => {
    render(
      <EpisodeList
        episodes={[{ number: 4, name: null, airDate: null, runtime: null, stillPath: null, overview: null }]}
        next={null}
      />
    );
    expect(screen.getByText("Episode 4")).toBeInTheDocument();
  });

  it("renders nothing without episodes", () => {
    const { container } = render(<EpisodeList episodes={[]} next={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
