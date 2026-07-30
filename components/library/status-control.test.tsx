import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StatusControl } from "./status-control";

describe("StatusControl", () => {
  it("shows the current status label", () => {
    render(<StatusControl status="watching" onChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: /Watching/ })
    ).toBeInTheDocument();
  });

  it("shows the add label when untracked", () => {
    render(<StatusControl status={null} onChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: /Add to library/ })
    ).toBeInTheDocument();
  });

  it("offers all six statuses and reports the chosen one", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusControl status="planning" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /Planning/ }));
    for (const label of [
      "Watching",
      "Planning",
      "Completed",
      "Rewatching",
      "Paused",
      "Dropped",
    ]) {
      expect(
        await screen.findByRole("menuitem", { name: label })
      ).toBeInTheDocument();
    }
    await user.click(screen.getByRole("menuitem", { name: "Completed" }));
    expect(onChange).toHaveBeenCalledWith("completed");
  });
});
