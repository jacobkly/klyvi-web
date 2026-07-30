import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionHeader } from "./section-header";

describe("SectionHeader", () => {
  it("renders the title as a heading", () => {
    render(<SectionHeader title="Continue watching" />);
    expect(
      screen.getByRole("heading", { name: "Continue watching" })
    ).toBeInTheDocument();
  });

  it("renders an action link when given one", () => {
    render(
      <SectionHeader title="Trending this week" action={{ label: "View all", href: "/explore" }} />
    );
    const link = screen.getByRole("link", { name: "View all" });
    expect(link).toHaveAttribute("href", "/explore");
  });

  it("renders no link when no action is given", () => {
    render(<SectionHeader title="Recent activity" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
