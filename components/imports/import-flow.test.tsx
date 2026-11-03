import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImportFlow, SOURCE_HELP } from "./import-flow";

describe("ImportFlow", () => {
  it("asks Letterboxd users for ratings.csv by default", () => {
    render(<ImportFlow />);

    expect(screen.getByText(SOURCE_HELP.letterboxd.hint)).toBeTruthy();
    expect(screen.getByLabelText("Choose an export file").getAttribute("accept")).toBe(
      ".csv"
    );
  });
});

describe("SOURCE_HELP", () => {
  it("asks Trakt users for the ZIP from Settings, Data", () => {
    expect(SOURCE_HELP.trakt.hint).toContain("ZIP");
    expect(SOURCE_HELP.trakt.accept).toBe(".zip,.json");
  });

  it("names the optional TV columns of a CSV", () => {
    for (const column of ["type", "season", "tmdb_id"]) {
      expect(SOURCE_HELP.csv.hint).toContain(column);
    }
  });

  it("keeps UI copy free of em dashes and semicolons", () => {
    for (const help of Object.values(SOURCE_HELP)) {
      expect(`${help.hint} ${help.result}`).not.toMatch(/[—;]/);
    }
  });
});
