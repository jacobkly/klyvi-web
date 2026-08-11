import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ImportJob } from "@/lib/types";

import { ImportProgress, importPercent } from "./import-progress";

function job(partial: Partial<ImportJob>): ImportJob {
  return {
    id: "j1",
    source: "letterboxd",
    status: "running",
    total: 0,
    matched: 0,
    unmatched: 0,
    error: null,
    ...partial,
  };
}

describe("importPercent", () => {
  it("is null while the row count is still unknown", () => {
    expect(importPercent(job({ status: "running", total: 0 }))).toBeNull();
  });

  it("is processed-over-total once total is known", () => {
    expect(importPercent(job({ total: 200, matched: 40, unmatched: 10 }))).toBe(
      25
    );
  });

  it("is 100 when done regardless of the counts", () => {
    expect(
      importPercent(job({ status: "done", total: 200, matched: 150 }))
    ).toBe(100);
  });

  it("clamps an over-count to 100", () => {
    expect(importPercent(job({ total: 10, matched: 8, unmatched: 6 }))).toBe(
      100
    );
  });
});

describe("ImportProgress", () => {
  it("renders nothing when there is no job and no start failure", () => {
    const { container } = render(<ImportProgress job={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a determinate bar with the processed count", () => {
    render(<ImportProgress job={job({ total: 200, matched: 40, unmatched: 10 })} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByText("50 / 200")).toBeInTheDocument();
  });

  it("shows an indeterminate bar while the file is still being read", () => {
    render(<ImportProgress job={job({ status: "running", total: 0 })} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(screen.getByText(/reading your export/i)).toBeInTheDocument();
  });

  it("summarizes a completed import at 100 percent", () => {
    render(
      <ImportProgress
        job={job({ status: "done", total: 200, matched: 180, unmatched: 20 })}
      />
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
    expect(screen.getByText(/180 added/)).toBeInTheDocument();
  });

  it("shows the job's error message when the import failed", () => {
    render(<ImportProgress job={job({ status: "failed", error: "bad file" })} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("bad file")).toBeInTheDocument();
  });

  it("reports a start failure without a job", () => {
    render(<ImportProgress job={null} startFailed />);
    expect(screen.getByText(/could not start the import/i)).toBeInTheDocument();
  });
});
