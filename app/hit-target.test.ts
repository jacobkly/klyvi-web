import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const SKIP = new Set(["node_modules", ".next", "beta-ui", ".git"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [path] : [];
  });
}

/**
 * `hit-44` grows the tap target with an absolutely placed ::after, and it
 * doesn't position the element itself. Without a position the ::after sizes
 * to the nearest positioned ancestor, which once made the whole library
 * editor a Favorite switch on phones.
 */
describe("hit-44", () => {
  it("is only used on positioned elements", () => {
    const unpositioned: string[] = [];
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, "utf8");
      for (const [literal] of text.matchAll(/(["'`])[^"'`]*\bhit-44\b[^"'`]*\1/g)) {
        if (!/\b(relative|absolute|fixed|sticky)\b/.test(literal)) {
          unpositioned.push(`${relative(root, file)}: ${literal}`);
        }
      }
    }
    expect(unpositioned).toEqual([]);
  });

  it("finds the classes it checks", () => {
    const uses = sourceFiles(root).filter((f) =>
      readFileSync(f, "utf8").includes("hit-44")
    );
    expect(uses.length).toBeGreaterThanOrEqual(6);
  });
});
