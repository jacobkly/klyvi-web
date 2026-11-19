import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReasonChips } from "./reason-chips";
import type { Reason } from "@/lib/types";

const reasons: Reason[] = [
  { kind: "keyword", id: 9826, name: "slow-burn" },
  { kind: "genre", id: 18, name: "Drama" },
  { kind: "keyword", id: 1, name: "heist" },
  { kind: "genre", id: 80, name: "Crime" },
  { kind: "keyword", id: 2, name: "neo-noir" },
];

describe("ReasonChips", () => {
  it("renders named reasons as chips", () => {
    render(<ReasonChips reasons={reasons.slice(0, 2)} />);
    expect(screen.getByText("Slow-Burn")).toBeInTheDocument();
    expect(screen.getByText("Drama")).toBeInTheDocument();
  });

  it("writes keywords in title case, leaving short joining words small", () => {
    render(
      <ReasonChips
        reasons={[
          { kind: "keyword", id: 1, name: "based on novel or book" },
          { kind: "keyword", id: 2, name: "1970s" },
          { kind: "because", id: 3, name: "the Thing" },
        ]}
      />
    );
    expect(screen.getByText("Based on Novel or Book")).toBeInTheDocument();
    expect(screen.getByText("1970s")).toBeInTheDocument();
    expect(screen.getByText("because you liked the Thing")).toBeInTheDocument();
  });

  it("renders nothing at all for an empty list (Tier 0)", () => {
    const { container } = render(<ReasonChips reasons={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("skips reasons with no name instead of rendering ids", () => {
    render(
      <ReasonChips
        reasons={[
          { kind: "keyword", id: 42 },
          { kind: "genre", id: 18, name: "Drama" },
        ]}
      />
    );
    expect(screen.getByText("Drama")).toBeInTheDocument();
    expect(screen.queryByText("42")).not.toBeInTheDocument();
  });

  it("renders nothing when every reason is nameless", () => {
    const { container } = render(
      <ReasonChips reasons={[{ kind: "keyword", id: 42 }]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("collapses overflow past max into a +N chip", () => {
    render(<ReasonChips reasons={reasons} max={3} />);
    expect(screen.getByText("Slow-Burn")).toBeInTheDocument();
    expect(screen.getByText("Heist")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.queryByText("Crime")).not.toBeInTheDocument();
    expect(screen.queryByText("Neo-Noir")).not.toBeInTheDocument();
  });

  it("shows no overflow chip when at or under max", () => {
    render(<ReasonChips reasons={reasons.slice(0, 3)} max={3} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it("says which title a because reason names", () => {
    render(
      <ReasonChips
        reasons={[
          { kind: "because", id: 496243, name: "Parasite" },
          { kind: "keyword", id: 9826, name: "slow-burn" },
        ]}
      />
    );
    expect(screen.getByText("because you liked Parasite")).toBeInTheDocument();
    expect(screen.getByText("Slow-Burn")).toBeInTheDocument();
  });

  it("keeps the full title of a long because reason in its tooltip", () => {
    const name = "Harry Potter and the Prisoner of Azkaban";
    render(<ReasonChips reasons={[{ kind: "because", id: 673, name }]} />);
    expect(
      screen.getByText(`because you liked ${name}`).closest("li")
    ).toHaveAttribute("title", `because you liked ${name}`);
  });

  it("labels the group for assistive tech", () => {
    render(<ReasonChips reasons={reasons.slice(0, 2)} />);
    expect(
      screen.getByRole("list", { name: "Why this was picked" })
    ).toBeInTheDocument();
  });
});
