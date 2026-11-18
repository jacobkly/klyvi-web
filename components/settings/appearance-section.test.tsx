import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { readPref } from "@/lib/local-prefs";

import { AppearanceSection } from "./appearance-section";

describe("AppearanceSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves the mode and accent picked from a swatch", async () => {
    const user = userEvent.setup();
    render(<AppearanceSection />);
    await user.click(screen.getByRole("radio", { name: "light Blue" }));
    expect(readPref("themeMode")).toBe("light");
    expect(readPref("themeAccent")).toBe("blue");
    expect(screen.getByRole("radio", { name: "light Blue" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("previews light on a light chip even inside the dark app", () => {
    render(<AppearanceSection />);
    const lightRow = screen.getByRole("radiogroup", { name: "light accent" });
    expect(lightRow.closest(".light")).not.toBeNull();
    const darkRow = screen.getByRole("radiogroup", { name: "dark accent" });
    expect(darkRow.closest(".dark")).not.toBeNull();
  });

  // #91: the options said Compact, Default and Large with no size attached.
  it("labels each text size with its size", () => {
    render(<AppearanceSection />);
    for (const [name, size] of [
      ["Compact", "15 px"],
      ["Default", "16 px"],
      ["Large", "18 px"],
    ]) {
      expect(screen.getByRole("radio", { name: new RegExp(name) })).toBeInTheDocument();
      expect(screen.getByText(size)).toBeInTheDocument();
    }
  });

  it("saves the text size and reduce motion", async () => {
    const user = userEvent.setup();
    render(<AppearanceSection />);
    await user.click(screen.getByText("Large"));
    expect(readPref("textSize")).toBe("large");
    await user.click(screen.getByRole("switch", { name: "Reduce motion" }));
    expect(readPref("reduceMotion")).toBe(true);
  });

  it("no longer says the choices do nothing yet", () => {
    render(<AppearanceSection />);
    expect(screen.queryByText(/apply when theming/i)).toBeNull();
    expect(screen.queryByText(/unlock when theming/i)).toBeNull();
  });
});
