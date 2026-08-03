import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TrackingDialog } from "./tracking-dialog";
import { MOCK_LIBRARY } from "@/lib/mock-library";

const severance = MOCK_LIBRARY.find((e) => e.mediaId === 4)!; // season, 7/10
const parasite = MOCK_LIBRARY.find((e) => e.mediaId === 1)!; // movie

describe("TrackingDialog", () => {
  it("renders the title and every field with copy-doc labels", () => {
    render(
      <TrackingDialog
        entry={severance}
        open
        onOpenChange={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    // The accessible dialog title plus the visible identity column both name
    // the entry, which is intentional: the column is what you are editing.
    expect(screen.getAllByText(/Severance/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Season 2")).toBeInTheDocument();
    for (const label of ["Status", "Score", "Episodes watched", "Notes"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // Dates and rewatches are deliberately absent: no API write path exists
    // for them yet, and a field that saves nothing is a lie.
    for (const label of ["Started", "Finished", "Rewatches"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    expect(screen.getByText(/Only you can see these/)).toBeInTheDocument();
    expect(
      screen.getByText(/Leave blank if you would rather not rate it/)
    ).toBeInTheDocument();
  });

  it("hides the episode field for movies", () => {
    render(
      <TrackingDialog
        entry={parasite}
        open
        onOpenChange={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.queryByText("Episodes watched")).not.toBeInTheDocument();
  });

  it("separates delete from save and requires a named confirmation", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <TrackingDialog
        entry={parasite}
        open
        onOpenChange={() => {}}
        onSave={() => {}}
        onDelete={onDelete}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Remove from library" })
    );
    // The confirm names the title, per 06-copy.md.
    expect(
      await screen.findByText(/Remove Parasite from your library\?/)
    ).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(
      screen.getAllByRole("button", { name: "Remove from library" }).at(-1)!
    );
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("reports edited values on save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <TrackingDialog
        entry={severance}
        open
        onOpenChange={() => {}}
        onSave={onSave}
        onDelete={() => {}}
      />
    );
    const score = screen.getByLabelText("Score");
    await user.clear(score);
    await user.type(score, "91");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ score: 91 })
    );
  });

  it("prefills notes from the entry and returns them on save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const noted = MOCK_LIBRARY.find((e) => e.notes != null)!;
    render(
      <TrackingDialog
        entry={noted}
        open
        onOpenChange={() => {}}
        onSave={onSave}
        onDelete={() => {}}
      />
    );
    const notes = screen.getByLabelText("Notes");
    expect(notes).toHaveValue(noted.notes);
    await user.type(notes, " Done.");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave.mock.calls[0][0].notes).toBe(`${noted.notes} Done.`);
  });

  it("toggles the favorite flag and reports it on save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <TrackingDialog
        entry={parasite}
        open
        onOpenChange={() => {}}
        onSave={onSave}
        onDelete={() => {}}
      />
    );
    const star = screen.getByRole("switch", { name: "Favorite" });
    expect(star).toHaveAttribute("aria-checked", "false");
    await user.click(star);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ favorite: true })
    );
  });

  it("hides Remove from library for a fresh, never-tracked entry", () => {
    render(
      <TrackingDialog
        entry={parasite}
        isNew
        open
        onOpenChange={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Remove from library" })
    ).not.toBeInTheDocument();
  });

  it("returns null notes when the field is cleared", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const noted = MOCK_LIBRARY.find((e) => e.notes != null)!;
    render(
      <TrackingDialog
        entry={noted}
        open
        onOpenChange={() => {}}
        onSave={onSave}
        onDelete={() => {}}
      />
    );
    await user.clear(screen.getByLabelText("Notes"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave.mock.calls[0][0].notes).toBeNull();
  });
});
