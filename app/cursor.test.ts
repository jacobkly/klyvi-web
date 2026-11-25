import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** The arrow on something pressable reads as broken. One base rule covers it. */
describe("cursors", () => {
  it("gives the hand to every kind of control", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    const rule = /:is\(([^{]*)\{\s*cursor: pointer;/.exec(css)?.[1] ?? "";
    for (const s of ["a[href]", "button", "summary", "select", "option", "menuitem", "tab", "slider"]) {
      expect(rule).toContain(s);
    }
    expect(rule).toContain(":not(:disabled");
  });

  it("is not undone on the rows of menus, lists and pickers", () => {
    for (const f of [
      "components/ui/command.tsx",
      "components/ui/dropdown-menu.tsx",
      "components/media/region-picker.tsx",
    ]) {
      expect(readFileSync(join(process.cwd(), f), "utf8")).not.toContain("cursor-default");
    }
  });
});
