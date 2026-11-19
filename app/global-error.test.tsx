import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { reportError } from "@/lib/api/errors";

import ErrorBoundary from "./error";
import GlobalError from "./global-error";

vi.mock("@/lib/api/errors", () => ({ reportError: vi.fn() }));

describe("error boundaries", () => {
  beforeEach(() => {
    vi.mocked(reportError).mockReset();
  });

  it.each([
    ["a page error", ErrorBoundary],
    ["the root layout's crash", GlobalError],
  ])("%s is reported with its digest", (_name, Boundary) => {
    const error = Object.assign(new Error("render broke"), { digest: "d1" });
    render(<Boundary error={error} retry={vi.fn()} reset={vi.fn()} />);
    expect(reportError).toHaveBeenCalledWith(error, "d1");
  });

  it("the root layout's own crash still gets a page with a retry", () => {
    const retry = vi.fn();
    render(<GlobalError error={new Error("layout broke")} retry={retry} />);
    expect(screen.getByText("Something broke on this page.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("a page error retries by fetching again", () => {
    const retry = vi.fn();
    render(
      <ErrorBoundary
        error={new Error("fetch failed")}
        retry={retry}
        reset={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
