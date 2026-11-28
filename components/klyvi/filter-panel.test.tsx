import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "@/components/ui/switch";

import { FilterField, FilterPanel } from "./filter-panel";

type Value = { late: boolean };

/** A one-switch panel holding its saved value the way a page would. */
function Page({ onSave }: { onSave?: (v: Value) => void }) {
  const [value, setValue] = React.useState<Value>({ late: false });
  return (
    <>
      <p>Saved: {value.late ? "late" : "early"}</p>
      <FilterPanel
        value={value}
        defaults={{ late: false }}
        count={(v) => (v.late ? 1 : 0)}
        onSave={(v) => {
          setValue(v);
          onSave?.(v);
        }}
      >
        {(draft, setDraft) => (
          <FilterField label="Showings" hint="After 9 pm only.">
            <Switch
              aria-label="Late showings"
              checked={draft.late}
              onCheckedChange={(late) => setDraft({ late })}
            />
          </FilterField>
        )}
      </FilterPanel>
    </>
  );
}

// Both openers are in the page, the sheet for phones first and the panel
// under the button second. jsdom has no CSS, so each test picks one.
const sheetOpener = () => screen.getAllByRole("button", { name: /^Filters/ })[0];
const panelOpener = () => screen.getAllByRole("button", { name: /^Filters/ })[1];

describe("FilterPanel", () => {
  it("saves the copy only on Save, and counts what is on", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<Page onSave={onSave} />);

    await user.click(panelOpener());
    await user.click(await screen.findByRole("switch", { name: "Late showings" }));
    expect(screen.getByText("Saved: early")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith({ late: true });
    expect(screen.getByText("Saved: late")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Filters (1)" })).toHaveLength(2);
  });

  it("drops the copy on Cancel, and opens on the saved value next time", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<Page onSave={onSave} />);

    await user.click(panelOpener());
    await user.click(await screen.findByRole("switch", { name: "Late showings" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSave).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull()
    );
    await user.click(panelOpener());
    expect(
      await screen.findByRole("switch", { name: "Late showings" })
    ).not.toBeChecked();
  });

  it("offers Reset only once the copy differs, and Reset is not a save", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<Page onSave={onSave} />);

    await user.click(sheetOpener());
    const toggle = await screen.findByRole("switch", { name: "Late showings" });
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();

    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(toggle).not.toBeChecked();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("labels its group with the field name and hint", async () => {
    const user = userEvent.setup();
    render(<Page />);

    await user.click(sheetOpener());
    expect(await screen.findByRole("group", { name: "Showings" })).toBeInTheDocument();
    expect(screen.getByText("After 9 pm only.")).toBeInTheDocument();
  });
});
