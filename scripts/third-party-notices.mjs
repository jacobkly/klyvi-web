// Writes public/third-party-notices.txt: the license text of every
// production dependency. The Next build strips license comments from the
// bundles it ships, so this file is how those notices reach the browser.
// It runs before `next build` and its output is not committed.

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LICENSE_FILE = /^(licen[cs]e|copying)(\b|[-_.])/i;
const NOTICE_FILE = /^notice(\b|[-_.])/i;

function licenseName(pkg) {
  if (typeof pkg.license === "string") return pkg.license;
  if (pkg.license?.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses)) {
    return pkg.licenses.map((l) => l.type ?? l).join(" OR ");
  }
  return "UNKNOWN";
}

// readPackage returns one package's name, version, license and the text of
// its license and notice files, or null when the folder has no package.json.
export function readPackage(dir) {
  const manifest = join(dir, "package.json");
  if (!existsSync(manifest)) return null;
  const pkg = JSON.parse(readFileSync(manifest, "utf8"));
  const files = readdirSync(dir).sort();
  const picked = [
    ...files.filter((f) => LICENSE_FILE.test(f)),
    ...files.filter((f) => NOTICE_FILE.test(f)),
  ];
  const texts = picked
    .map((f) => readFileSync(join(dir, f), "utf8").trim())
    .filter(Boolean);
  return {
    name: pkg.name,
    version: pkg.version,
    license: licenseName(pkg),
    text: texts.length ? texts.join("\n\n") : null,
  };
}

// renderNotices lists each package once, sorted by name, with its text.
export function renderNotices(packages) {
  const seen = new Map();
  for (const p of packages) seen.set(`${p.name}@${p.version}`, p);
  const sorted = [...seen.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version)
  );
  const rule = "=".repeat(72);
  const parts = [
    "Third-party notices for the Klyvi website",
    "",
    "The Klyvi website ships the open-source packages below. Each entry",
    "gives the package's license and the license text from the package.",
    "",
  ];
  for (const p of sorted) {
    parts.push(
      rule,
      `${p.name}@${p.version} (${p.license})`,
      rule,
      "",
      p.text ?? `No license file in the package. Its license is ${p.license}.`,
      ""
    );
  }
  return parts.join("\n");
}

// productionDirs asks npm for the folder of every installed production
// dependency. npm ls exits non-zero over peer warnings, so a failed run
// still counts when it printed paths.
function productionDirs(root) {
  let out;
  try {
    out = execSync("npm ls --omit=dev --all --parseable", {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 << 20,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (err) {
    out = err.stdout ?? "";
    if (!out.trim()) throw err;
  }
  const lines = out.split(/\r?\n/).filter(Boolean);
  // The first line is the project itself.
  return [...new Set(lines.slice(1))];
}

function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const packages = productionDirs(root)
    .map(readPackage)
    .filter((p) => p !== null);
  const outPath = join(root, "public", "third-party-notices.txt");
  writeFileSync(outPath, renderNotices(packages));
  console.log(`third-party notices: ${packages.length} packages -> ${outPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
