import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";

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

  it("carries the new updated date", () => {
    expect(textOf(Page)).toContain("Updated 4 November 2026");
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
  ])("names %s as a service that receives data", (service) => {
    render(<PrivacyPage />);
    const heading = screen.getByRole("heading", { name: /who receives/i });
    const list = heading.nextElementSibling as HTMLElement;
    expect(list.textContent).toContain(service);
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

  it("does not promise that deleting removes every copy at once", () => {
    const text = privacy();
    expect(text).not.toContain("Deleting your account deletes your data.");
    expect(text).toMatch(/backups?.{0,120}14 days/i);
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

  it("only claims the export holds what it holds", () => {
    const text = privacy();
    expect(text).toMatch(/import results and your taste profile/i);
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
