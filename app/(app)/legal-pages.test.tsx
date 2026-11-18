import { cleanup, render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteFooter } from "@/components/klyvi/site-footer";

import AttributionPage from "./attribution/page";
import CopyrightPage from "./copyright/page";
import PrivacyPage from "./privacy/page";
import TermsPage from "./terms/page";

afterEach(cleanup);

function textOf(Page: ComponentType): string {
  const { container } = render(<Page />);
  return (container.textContent ?? "").replace(/\s+/g, " ");
}

describe.each<[string, ComponentType]>([
  ["privacy", PrivacyPage],
  ["terms", TermsPage],
  ["copyright", CopyrightPage],
  ["attribution", AttributionPage],
])("the %s page", (_name, Page) => {
  it("renders no placeholder", () => {
    const { container } = render(<Page />);
    expect(container.querySelector("mark")).toBeNull();
    expect(container.textContent).not.toMatch(/\[[^\]]*\]/);
    expect(container.textContent).not.toMatch(
      /NEEDED|CONFIRM|DECIDE|DEPENDS ON|HOSTING PROVIDER|TARGET RESPONSE/
    );
  });

  it("keeps to the prose rules", () => {
    const text = textOf(Page);
    expect(text).not.toContain("—");
    expect(text).not.toContain(";");
  });
});

describe.each<[string, ComponentType]>([
  ["privacy", PrivacyPage],
  ["terms", TermsPage],
  ["copyright", CopyrightPage],
])("the %s page's contact and date", (_name, Page) => {
  it("gives the contact address as a working email link", () => {
    render(<Page />);
    const links = screen.getAllByRole("link", { name: "hello@klyvi.net" });
    expect(links[0].getAttribute("href")).toBe("mailto:hello@klyvi.net");
  });

  it("says when it was last updated", () => {
    expect(textOf(Page)).toMatch(/Last updated \d{1,2} [A-Z][a-z]+ 2026/);
  });
});

describe.each<[string, ComponentType]>([
  ["privacy", PrivacyPage],
  ["terms", TermsPage],
])("the %s page's layout", (_name, Page) => {
  it("carries this round's date", () => {
    expect(textOf(Page)).toContain("Last updated 18 November 2026");
  });

  it("numbers its sections and lists them in a contents list", () => {
    const { container } = render(<Page />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    const contents = screen.getByRole("navigation", { name: "Contents" });
    const links = within(contents).getAllByRole("link");

    expect(links).toHaveLength(headings.length);
    headings.forEach((heading, i) => {
      expect(heading.textContent).toMatch(new RegExp(`^${i + 1}\\. `));
      const href = links[i].getAttribute("href") ?? "";
      expect(href).toBe(`#${heading.id}`);
      expect(container.querySelector(href)).toBe(heading);
    });
  });

  it("promises notice in the app before a material change", () => {
    const text = textOf(Page);
    expect(text).toMatch(
      /date at the top changes with every edit/i
    );
    expect(text).toMatch(
      /material change.{0,80}notice in the app before it takes effect/i
    );
    expect(text).toMatch(/keep using Klyvi after that.{0,40}accept/i);
  });
});

describe("the footer", () => {
  it("has a Contact link under Support", () => {
    render(<SiteFooter />);
    const support = screen.getByRole("navigation", { name: "Support" });
    expect(within(support).getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "mailto:hello@klyvi.net"
    );
  });
});

describe("the privacy page", () => {
  const privacy = () => textOf(PrivacyPage);

  it.each([
    "Supabase",
    "Vercel",
    "Cloudflare",
    "Resend",
    "Google",
    "Microsoft",
    "TMDB",
    "YouTube",
  ])("names %s as a service that receives data", (service) => {
    render(<PrivacyPage />);
    const heading = screen.getByRole("heading", { name: /who receives/i });
    const list = heading.nextElementSibling as HTMLElement;
    expect(list.textContent).toContain(service);
  });

  it("says YouTube only loads when you press play on a trailer", () => {
    expect(privacy()).toMatch(/YouTube.{0,200}only when you press play/i);
  });

  it("names the server the operator runs", () => {
    expect(privacy()).toMatch(/server run by the person behind Klyvi/i);
  });

  it("says Google and Microsoft only apply if you sign in with them", () => {
    expect(privacy()).toMatch(/Google and Microsoft:.*only if you sign in/i);
  });

  it("corrects the claim about TMDB", () => {
    const text = privacy();
    expect(text).not.toMatch(/never your identity/i);
    expect(text).toMatch(/TMDB.{0,160}image servers.{0,160}IP address/i);
  });

  it("states what the logs hold and how they age out, without a day count", () => {
    const text = privacy();
    expect(text).toMatch(/IP address/);
    expect(text).toMatch(/search terms/i);
    expect(text).toMatch(/30 MB/);
    expect(text).not.toMatch(/logs? (?:are|is) kept for \d+ days/i);
  });

  it("makes no backup claim, since Klyvi keeps none", () => {
    expect(privacy()).not.toMatch(/backup/i);
  });

  it("says deleting removes your data at once, logs aside", () => {
    const text = privacy();
    expect(text).toMatch(/deleting your account removes.{0,200}at once/i);
    expect(text).toMatch(/only thing left.{0,80}log lines.{0,80}30 MB/i);
  });

  it("describes sign-in cookies rather than one session cookie", () => {
    const text = privacy();
    expect(text).not.toMatch(/one session cookie/i);
    expect(text).toMatch(/sign-in cookies/i);
    expect(text).toMatch(/no advertising or analytics cookies/i);
  });

  it("describes local storage", () => {
    expect(privacy()).toMatch(/local storage/i);
  });

  it("separates the import file from the import result", () => {
    const text = privacy();
    expect(text).toMatch(/file.{0,80}not kept/i);
    expect(text).toMatch(/titles it could not match/i);
  });

  it("explains the profile photo", () => {
    const text = privacy();
    expect(text).toMatch(/shrunk in your browser/i);
    expect(text).toMatch(/location data/i);
    expect(text).toMatch(/anyone with the link/i);
  });

  it("covers notices and their switches", () => {
    const text = privacy();
    expect(text).toMatch(/notices/i);
    expect(text).toMatch(/90 days/);
    expect(text).toMatch(/170 days/);
  });

  it("says where data is stored", () => {
    expect(privacy()).toMatch(/stored in the United States/i);
  });

  it("gives the legal basis, the rights and the right to complain", () => {
    const text = privacy();
    expect(text).toMatch(/legal basis/i);
    expect(text).toMatch(/legitimate interests?/i);
    expect(text).toMatch(/Download your data/);
    expect(text).toMatch(/complain.{0,80}(regulator|data protection)/i);
  });

  it("says the export holds the import results and the taste profile", () => {
    const text = privacy();
    expect(text).toMatch(
      /one file with your account, library, ratings, interactions, notices, import results \(titles that didn't match included\), and taste profile/i
    );
    expect(text).not.toMatch(/leaves out/i);
  });

  it("sets the minimum age at 16", () => {
    expect(privacy()).toMatch(/under 16/);
  });

  it("says who runs it", () => {
    expect(privacy()).toMatch(/one person in Washington State, USA/);
  });
});

describe("the terms page", () => {
  const terms = () => textOf(TermsPage);

  it("names the operator", () => {
    expect(terms()).toMatch(/one person in Washington State, USA/);
  });

  it("sets the governing law", () => {
    expect(terms()).toMatch(/law of the State of Washington/);
  });

  it("sets the minimum age at 16", () => {
    expect(terms()).toMatch(/at least 16/);
  });

  it("says Klyvi is not affiliated with TMDB", () => {
    expect(terms()).toMatch(/not affiliated with.{0,40}TMDB/);
  });

  it("allows suspension for abuse", () => {
    expect(terms()).toMatch(/suspend.{0,80}abuse/i);
  });
});

describe("the copyright page", () => {
  it("gives the response time", () => {
    expect(textOf(CopyrightPage)).toMatch(/within 7 days/);
  });
});

describe("the attribution page", () => {
  it("credits Wikidata and its license", () => {
    expect(textOf(AttributionPage)).toMatch(/Wikidata.*CC0/);
  });
});
