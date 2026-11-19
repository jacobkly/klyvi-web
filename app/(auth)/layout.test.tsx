import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AuthLayout from "./layout";

describe("AuthLayout", () => {
  // #103: sign-in, sign-up and reset had no way back to the site.
  it("shows the logo, linking to the landing page", () => {
    render(
      <AuthLayout>
        <p>form</p>
      </AuthLayout>
    );
    expect(screen.getByRole("link", { name: "Klyvi" })).toHaveAttribute(
      "href",
      "/"
    );
  });
});
