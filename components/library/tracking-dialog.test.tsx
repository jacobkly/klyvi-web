import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TrackingDialog } from "./tracking-dialog";
import { writePref } from "@/lib/local-prefs";
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
    const score = screen.getByRole("textbox", { name: "Score" });
    await user.clear(score);
    await user.type(score, "91");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ score: 91 })
    );
  });

  it("resets the form when a different entry opens", async () => {
    const user = userEvent.setup();
    const props = {
      open: true,
      onOpenChange: () => {},
      onSave: () => {},
      onDelete: () => {},
    };
    const { rerender } = render(<TrackingDialog entry={severance} {...props} />);
    await user.type(screen.getByRole("textbox", { name: "Score" }), "91");

    rerender(<TrackingDialog entry={parasite} {...props} />);
    expect(screen.getByRole("textbox", { name: "Score" })).toHaveValue(String(parasite.score));
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

  it("throws away unsaved edits on Cancel, so reopening shows the saved values", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSave = vi.fn();
    const props = { entry: parasite, onOpenChange, onSave, onDelete: () => {} };
    const { rerender } = render(<TrackingDialog {...props} open />);

    await user.click(screen.getByRole("switch", { name: "Favorite" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSave).not.toHaveBeenCalled();

    rerender(<TrackingDialog {...props} open={false} />);
    rerender(<TrackingDialog {...props} open />);
    expect(screen.getByRole("switch", { name: "Favorite" })).toHaveAttribute(
      "aria-checked",
      String(parasite.favorite)
    );
  });

  it("keeps edits when the parent re-renders the same entry", async () => {
    const user = userEvent.setup();
    const props = { open: true, onOpenChange: () => {}, onSave: () => {}, onDelete: () => {} };
    const { rerender } = render(<TrackingDialog entry={{ ...severance }} {...props} />);
    await user.type(screen.getByRole("textbox", { name: "Score" }), "91");

    rerender(<TrackingDialog entry={{ ...severance }} {...props} />);
    expect(screen.getByRole("textbox", { name: "Score" })).toHaveValue("91");
  });

  it("fills episodes watched with the season's count when Completed is picked", async () => {
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
    await user.click(screen.getByLabelText("Status"));
    await user.click(await screen.findByRole("option", { name: "Completed" }));

    expect(screen.getByLabelText("Episodes watched")).toHaveValue(
      String(severance.progressTotal)
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", progress: severance.progressTotal })
    );
  });

  it.each([
    ["150", /Score must be a whole number from 0 to 100/],
    ["-4", /Score must be a whole number from 0 to 100/],
    ["7.5", /Score must be a whole number from 0 to 100/],
  ])("refuses a score of %s with an inline message and doesn't save", async (value, message) => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <TrackingDialog
        entry={severance}
        open
        onOpenChange={onOpenChange}
        onSave={onSave}
        onDelete={() => {}}
      />
    );
    const score = screen.getByRole("textbox", { name: "Score" });
    await user.type(score, value);
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(score).toHaveAttribute("aria-invalid", "true");

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("refuses more episodes than the season has", async () => {
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
    const episodes = screen.getByLabelText("Episodes watched");
    await user.clear(episodes);
    await user.type(episodes, "11");
    expect(
      screen.getByText(`Episodes must be 0 to ${severance.progressTotal}`)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("lets only Save submit the form", () => {
    render(
      <TrackingDialog
        entry={severance}
        open
        onOpenChange={() => {}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
    const submitters = screen
      .getAllByRole("button")
      .concat(screen.getAllByRole("switch"))
      .filter((b) => b.closest("form") && b.getAttribute("type") !== "button");
    expect(submitters.map((b) => b.textContent)).toEqual(["Save"]);
  });

  it("saves on Enter", async () => {
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
    await user.type(screen.getByRole("textbox", { name: "Score" }), "88{Enter}");
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ score: 88 }));
  });
});

describe("TrackingDialog in another scoring system", () => {
  afterEach(() => writePref("scoringSystem", "hundred"));

  const scored = { ...parasite, score: 88 };

  it("saves a picked star as the stored score", async () => {
    writePref("scoringSystem", "stars");
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <TrackingDialog
        entry={scored}
        open
        onOpenChange={() => {}}
        onSave={onSave}
        onDelete={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "4 stars" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.click(screen.getByRole("button", { name: "3 stars" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ score: 60 }));
  });

  it("keeps the exact stored score when the field is left alone", async () => {
    writePref("scoringSystem", "stars");
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <TrackingDialog
        entry={scored}
        open
        onOpenChange={() => {}}
        onSave={onSave}
        onDelete={() => {}}
      />
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ score: 88 }));
  });

  it("checks typed scores against the ten point range", async () => {
    writePref("scoringSystem", "ten");
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
    const field = screen.getByRole("textbox", { name: "Score" });
    await user.clear(field);
    await user.type(field, "11");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Score must be a whole number from 1 to 10")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    await user.clear(field);
    await user.type(field, "8");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ score: 80 }));
  });
});
