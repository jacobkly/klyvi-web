import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProseLayout } from "./prose-layout";

describe("ProseLayout", () => {
  it("renders the title and children inside a main landmark", () => {
    render(
      <ProseLayout title="Terms of use" updated="4 November 2026">
        <p>Body text.</p>
      </ProseLayout>
    );
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of use" })
    ).toBeInTheDocument();
    expect(screen.getByText("Body text.")).toBeInTheDocument();
    expect(screen.getByText(/4 November 2026/)).toBeInTheDocument();
  });

  it("omits the updated line when not given", () => {
    render(
      <ProseLayout title="Donate">
        <p>Body.</p>
      </ProseLayout>
    );
    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
  });
});
