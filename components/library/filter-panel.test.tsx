import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterPanel } from "./filter-panel";

const counts = {
  all: 0, watching: 0, planning: 0, completed: 0, rewatching: 0, paused: 0, dropped: 0,
};

describe("FilterPanel", () => {
  it("starts Title at A to Z, whatever order the last sort used (#68)", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FilterPanel
        filters={{ status: "all", type: "all", query: "" }}
        onFiltersChange={vi.fn()}
        sortKey="updated"
        sortOrder="desc"
        onSortChange={onSortChange}
        counts={counts}
        onSurprise={vi.fn()}
      />
    );
    await user.click(screen.getByRole("combobox", { name: "Sort by" }));
    await user.click(await screen.findByRole("option", { name: "Title" }));
    expect(onSortChange).toHaveBeenCalledWith("title", "asc");
  });
});
