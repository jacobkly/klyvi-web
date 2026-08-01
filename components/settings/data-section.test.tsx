import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { readPref } from "@/lib/local-prefs";

import { DataSection } from "./data-section";
import { NotificationsSection } from "./notifications-section";

beforeEach(() => window.localStorage.clear());

describe("DataSection import dialog", () => {
  it("opens, accepts a picked file, and shows it by name and size", async () => {
    const user = userEvent.setup();
    render(<DataSection />);

    await user.click(screen.getByRole("button", { name: /import/i }));
    expect(
      await screen.findByText("Import your history", { selector: "h2" })
    ).toBeInTheDocument();

    const file = new File(["a,b,c"], "letterboxd-export.csv", {
      type: "text/csv",
    });
    await user.upload(screen.getByLabelText("Choose an export file"), file);

    expect(
      await screen.findByText("letterboxd-export.csv")
    ).toBeInTheDocument();
    // The real import waits on the backend; the button must not pretend.
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  });
});

describe("NotificationsSection", () => {
  it("persists a switch toggle", async () => {
    const user = userEvent.setup();
    render(<NotificationsSection />);

    const premieres = screen.getByRole("switch", {
      name: "Season premieres",
    });
    expect(premieres).toBeChecked();
    await user.click(premieres);
    expect(readPref("notifications")["premieres"]).toBe(false);
  });

  it("keeps email opt-ins off by default", () => {
    render(<NotificationsSection />);
    expect(
      screen.getByRole("checkbox", { name: /weekly digest/i })
    ).not.toBeChecked();
  });
});
