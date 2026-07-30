import Link from "next/link";

export const metadata = { title: "Welcome · Klyvi" };

const PATHS = [
  {
    href: "/onboarding/rate",
    title: "Rate some films",
    body: "About 20 films, roughly 90 seconds. The fastest way to get recommendations worth trusting.",
    action: "Start rating",
    primary: true,
  },
  {
    href: "/onboarding/import",
    title: "Import your history",
    body: "Bring in what you have already logged on Letterboxd or Trakt.",
    action: "Import",
    primary: false,
  },
  {
    href: "/onboarding/skip",
    title: "Skip for now",
    body: "Browse first. Recommendations stay generic until you rate something.",
    action: "Skip",
    primary: false,
  },
];

export default function OnboardingWelcome() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Klyvi needs to know what you like
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick how you want to start. You can change any of this later.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {PATHS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={
              "group rounded-lg p-5 ring-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 " +
              (p.primary
                ? "bg-card ring-violet-text/40 hover:bg-muted/60"
                : "bg-card ring-foreground/10 hover:bg-muted/60")
            }
          >
            <p className="text-[15px] font-semibold text-foreground">
              {p.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            <p
              className={
                "mt-3 text-sm font-medium " +
                (p.primary ? "text-violet-text" : "text-foreground")
              }
            >
              {p.action}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
