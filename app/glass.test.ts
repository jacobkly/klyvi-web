import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const SKIP = new Set(["node_modules", ".next", "beta-ui", ".git", "docs"]);
const css = readFileSync(join(root, "app/globals.css"), "utf8");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [path] : [];
  });
}

function glassBlock(): string {
  const start = css.indexOf("@utility glass {");
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("\n}\n", start));
}

describe("glass", () => {
  it("is defined once, from tokens", () => {
    expect(css.match(/@utility glass \{/g)).toHaveLength(1);
    for (const token of ["--glass-bg:", "--glass-bg-solid:", "--glass-border:", "--glass-blur:"]) {
      expect(css).toContain(token);
    }
    expect(glassBlock()).toContain("blur(var(--glass-blur))");
  });

  it("falls back to a solid surface without blur support or with reduced transparency", () => {
    const block = glassBlock();
    // The default, outside @supports, is the solid one.
    expect(block.slice(0, block.indexOf("@supports"))).toContain("var(--glass-bg-solid)");
    const reduced = block.slice(block.indexOf("prefers-reduced-transparency"));
    expect(reduced).toContain("var(--glass-bg-solid)");
    expect(reduced).toContain("backdrop-filter: none");
  });

  it("keeps the fill dense enough for 4.5:1 muted text over white art", () => {
    // Measured: muted text over the background at 80% on white is 4.32:1,
    // at 85% it is 5.18:1.
    const pct = Number(/--glass-bg: color-mix\(in oklab, var\(--background\) (\d+)%/.exec(css)?.[1]);
    expect(pct).toBeGreaterThanOrEqual(85);
  });

  it("casts no shadow, so ring borders survive", () => {
    expect(glassBlock()).not.toContain("box-shadow");
  });

  it("is the only blur a component sets", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, "utf8");
      if (/\bbackdrop-blur(-\w+)?\b|backdrop-filter/.test(text)) offenders.push(relative(root, file));
    }
    expect(offenders).toEqual([]);
  });
});
