import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { DataSection } from "./data-section";

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
    // Import is disabled until a file is chosen, then enabled.
    expect(
      screen.getByRole("button", { name: "Import" })
    ).not.toBeDisabled();
  });

  it("disables Import until a file is chosen", async () => {
    const user = userEvent.setup();
    render(<DataSection />);
    await user.click(screen.getByRole("button", { name: /import/i }));
    await screen.findByText("Import your history", { selector: "h2" });
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  });
});
