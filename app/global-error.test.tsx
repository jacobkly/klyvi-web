import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./error";
import GlobalError from "./global-error";

describe("error boundaries", () => {
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
