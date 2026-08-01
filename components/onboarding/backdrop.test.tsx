import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OnboardingLayout from "@/app/onboarding/layout";

import { OnboardingBackdrop } from "./backdrop";

vi.mock("@/lib/api/catalog", () => ({
  getMovieList: vi.fn(() => Promise.reject(new Error("offline"))),
  getTvList: vi.fn(() => Promise.reject(new Error("offline"))),
}));

describe("OnboardingBackdrop", () => {
  it("is invisible to assistive tech and inert to interaction", async () => {
    const { container } = render(<OnboardingBackdrop />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("inert");
    // Fallback artwork appears even with the API down.
    await waitFor(() =>
      expect(container.querySelectorAll("img").length).toBeGreaterThan(0)
    );
    // Nothing behind the overlay may be reachable: no links, no buttons.
    expect(root.querySelectorAll("a, button")).toHaveLength(0);
  });
});

describe("OnboardingLayout", () => {
  it("renders the step inside the elevated container over the backdrop", () => {
    render(
      <OnboardingLayout>
        <p>step content</p>
      </OnboardingLayout>
    );
    expect(screen.getByText("step content")).toBeInTheDocument();
  });
});
