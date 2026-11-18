import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PosterCardSkeleton } from "./skeletons";

describe("PosterCardSkeleton", () => {
  it("holds a poster's shape and is hidden from screen readers", () => {
    const { container } = render(<PosterCardSkeleton variant="compact" />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.querySelector('[class*="aspect-[2/3]"]')).not.toBeNull();
    expect(root.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(1);
  });

  it("adds the title and year lines the below card has", () => {
    const { container } = render(<PosterCardSkeleton variant="below" />);
    expect(
      container.querySelectorAll('[data-slot="skeleton"]')
    ).toHaveLength(3);
  });
});
