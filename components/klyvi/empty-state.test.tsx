import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Compass } from "lucide-react";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders icon, title, body, and action", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={Compass}
        title="Nothing tracked yet"
        body="Log something you have watched and Klyvi starts learning what you like."
        action={{ label: "Find something to watch", onClick }}
      />
    );
    expect(screen.getByText("Nothing tracked yet")).toBeInTheDocument();
    expect(
      screen.getByText(/starts learning what you like/)
    ).toBeInTheDocument();
    screen.getByRole("button", { name: "Find something to watch" }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders a link action when given href", () => {
    render(
      <EmptyState
        icon={Compass}
        title="No favorites yet"
        body="Star a film, show, or person and it lands here."
        action={{ label: "Explore", href: "/explore" }}
      />
    );
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "href",
      "/explore"
    );
  });

  it("renders without an action", () => {
    render(<EmptyState icon={Compass} title="Nothing yet" body="Later." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("hides the icon from assistive tech", () => {
    const { container } = render(
      <EmptyState icon={Compass} title="Nothing yet" body="Later." />
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
