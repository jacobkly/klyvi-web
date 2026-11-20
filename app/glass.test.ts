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

  it("keeps muted text at 4.5:1 over pure white art", () => {
    // The worst case: white art, darkened by the backdrop tone, under the
    // fill. Colours are the measured sRGB of --background and
    // --muted-foreground.
    const fill = Number(/--glass-bg: color-mix\(in oklab, var\(--background\) (\d+)%/.exec(css)?.[1]) / 100;
    const tone = Number(/--glass-tone: ([\d.]+);/.exec(css)?.[1]);
    const lin = (v: number) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const surface = [9, 9, 11].map((c) => fill * c + (1 - fill) * 255 * tone);
    const ratio = (lum([159, 159, 169]) + 0.05) / (lum(surface) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
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
