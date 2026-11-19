import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { readPackage, renderNotices } from "./third-party-notices.mjs";

const dirs: string[] = [];

function pkgDir(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "notices-"));
  dirs.push(dir);
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("readPackage", () => {
  it("reads the name, version, license and the license file's text", () => {
    const dir = pkgDir({
      "package.json": JSON.stringify({
        name: "left-pad",
        version: "1.3.0",
        license: "MIT",
      }),
      "LICENSE.md": "Copyright (c) Someone\n\nPermission is hereby granted",
    });
    expect(readPackage(dir)).toEqual({
      name: "left-pad",
      version: "1.3.0",
      license: "MIT",
      text: "Copyright (c) Someone\n\nPermission is hereby granted",
    });
  });

  it("finds a British-spelled LICENCE and keeps a NOTICE file too", () => {
    const dir = pkgDir({
      "package.json": JSON.stringify({
        name: "x",
        version: "1.0.0",
        license: "Apache-2.0",
      }),
      LICENCE: "Apache text",
      NOTICE: "Notice text",
    });
    expect(readPackage(dir)?.text).toBe("Apache text\n\nNotice text");
  });

  it("has no text when the package ships no license file", () => {
    const dir = pkgDir({
      "package.json": JSON.stringify({ name: "y", version: "2.0.0", license: "ISC" }),
    });
    expect(readPackage(dir)?.text).toBeNull();
  });
});

describe("renderNotices", () => {
  it("lists each package once, by name, with its license text", () => {
    const out = renderNotices([
      { name: "zod", version: "3.0.0", license: "MIT", text: "zod text" },
      { name: "react", version: "19.0.0", license: "MIT", text: "react text" },
      { name: "zod", version: "3.0.0", license: "MIT", text: "zod text" },
    ]);
    expect(out.indexOf("react@19.0.0 (MIT)")).toBeLessThan(
      out.indexOf("zod@3.0.0 (MIT)")
    );
    expect(out.match(/zod@3\.0\.0/g)).toHaveLength(1);
    expect(out).toContain("react text");
  });

  it("names the license when the package has no file to quote", () => {
    const out = renderNotices([
      { name: "y", version: "2.0.0", license: "ISC", text: null },
    ]);
    expect(out).toContain("y@2.0.0 (ISC)");
    expect(out).toContain("No license file in the package. Its license is ISC.");
  });
});
