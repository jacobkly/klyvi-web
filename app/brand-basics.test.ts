import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { AUTH_SCREENS, PROTECTED_PREFIXES } from "@/lib/gated-routes";
import { robotsFor } from "@/lib/robots-rules";
import { rootMetadata, SITE_URL } from "@/lib/site";

import manifest from "./manifest";
import sitemap from "./sitemap";

const root = process.cwd();

/** Width and height from a PNG's IHDR chunk. */
function pngSize(relativePath: string) {
  const bytes = readFileSync(join(root, relativePath));
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** robots() allows one rule or a list. Klyvi uses a single rule for everyone. */
function robots() {
  return robotsFor("www.klyvi.net");
}

function theRule() {
  const { rules } = robots();
  expect(Array.isArray(rules)).toBe(false);
  return rules as Exclude<typeof rules, unknown[]>;
}

function disallowed(): string[] {
  const { disallow } = theRule();
  return Array.isArray(disallow) ? disallow : [disallow ?? ""];
}

describe("robots.txt", () => {
  it("applies to every crawler and allows the site by default", () => {
    expect(theRule().userAgent).toBe("*");
    expect(theRule().allow).toBe("/");
  });

  it.each([...PROTECTED_PREFIXES, ...AUTH_SCREENS, "/reset-password", "/auth"])(
    "keeps crawlers off %s",
    (route) => {
      expect(disallowed()).toContain(route);
    }
  );

  it.each(["/explore", "/movie", "/tv", "/privacy", "/terms", "/copyright"])(
    "leaves %s open to crawlers",
    (route) => {
      expect(disallowed().filter((d) => route.startsWith(d))).toEqual([]);
    }
  );

  it("points at the sitemap on the real domain", () => {
    expect(robots().sitemap).toBe("https://www.klyvi.net/sitemap.xml");
  });

  it.each(["staging.klyvi.net", "klyvi-web-abc123.vercel.app", "localhost:3000", null])(
    "keeps crawlers off everything on %s",
    (host) => {
      expect(robotsFor(host)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    }
  );

  it("treats the main host case-insensitively", () => {
    expect(robotsFor("WWW.KLYVI.NET").sitemap).toBe("https://www.klyvi.net/sitemap.xml");
  });
});

describe("the sitemap", () => {
  const paths = () =>
    sitemap().map((entry) => {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
      return new URL(entry.url).pathname;
    });

  it.each([
    "/",
    "/explore",
    "/explore/top-100-films",
    "/explore/top-100-tv",
    "/privacy",
    "/terms",
    "/copyright",
    "/attribution",
  ])("lists %s", (path) => {
    expect(paths()).toContain(path);
  });

  it("never lists a route a crawler is told to stay off", () => {
    for (const path of paths()) {
      const blockedBy = disallowed().filter(
        (d) => path === d || path.startsWith(`${d}/`)
      );
      expect(blockedBy).toEqual([]);
    }
  });
});

describe("the web manifest", () => {
  it("describes Klyvi as an app that opens on the root", () => {
    const m = manifest();
    expect(m.name).toBe("Klyvi");
    expect(m.short_name).toBe("Klyvi");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });

  it("uses the Dark Room background, so an installed app opens dark", () => {
    const m = manifest();
    expect(m.background_color).toBe("#09090b");
    expect(m.theme_color).toBe("#09090b");
  });

  it("lists icons that exist at the size they claim", () => {
    const icons = manifest().icons ?? [];
    expect(icons.map((i) => i.sizes)).toEqual(
      expect.arrayContaining(["192x192", "512x512"])
    );
    for (const icon of icons) {
      const [width, height] = (icon.sizes as string).split("x").map(Number);
      expect(pngSize(join("public", icon.src))).toEqual({ width, height });
    }
  });
});

describe("the metadata every page starts from", () => {
  it("resolves relative image addresses against the real domain", () => {
    expect(String(rootMetadata.metadataBase)).toBe("https://www.klyvi.net/");
  });

  it("asks for a large card in link previews", () => {
    expect(rootMetadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Klyvi",
    });
    expect(rootMetadata.twitter).toMatchObject({
      card: "summary_large_image",
    });
  });

  it("sets no share title of its own, so a shared film keeps its title", () => {
    expect(rootMetadata.openGraph?.title).toBeUndefined();
    expect(rootMetadata.twitter?.title).toBeUndefined();
  });
});

describe("the brand files", () => {
  it("has a share image at the size link previews expect", () => {
    expect(pngSize("app/opengraph-image.png")).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it("has an Apple icon at 180 pixels", () => {
    expect(pngSize("app/apple-icon.png")).toEqual({ width: 180, height: 180 });
  });

  it("has a scalable icon", () => {
    const svg = readFileSync(join(root, "app/icon.svg"), "utf8");
    expect(svg).toContain("<svg");
    expect(svg).toContain("<path");
  });

  it("no longer ships the create-next-app favicon", () => {
    const bytes = readFileSync(join(root, "app/favicon.ico"));
    const hash = createHash("sha256").update(bytes).digest("hex");
    expect(hash.startsWith("2b8ad2d33455a8f7")).toBe(false);
    // An ICO starts with reserved 0 and type 1.
    expect(bytes.readUInt16LE(0)).toBe(0);
    expect(bytes.readUInt16LE(2)).toBe(1);
  });

  it.each(["file", "globe", "next", "vercel", "window"])(
    "has removed the starter %s.svg",
    (name) => {
      expect(existsSync(join(root, "public", `${name}.svg`))).toBe(false);
    }
  );
});
