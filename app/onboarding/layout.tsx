import type { ReactNode } from "react";

import { OnboardingBackdrop } from "@/components/onboarding/backdrop";

/**
 * Onboarding floats over a glimpse of the live app: dimmed real artwork
 * behind, the task in a centered elevated container in front (phase 9,
 * task 13). The steps stay chromeless routes; only the presentation
 * changed. The container is the scroll context, so tall steps scroll
 * inside it rather than pushing the page.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <OnboardingBackdrop />
      <div className="relative z-10 flex flex-1 items-center justify-center p-3 sm:p-6">
        <div className="flex max-h-[92dvh] min-h-[80dvh] w-full max-w-4xl flex-col overflow-y-auto rounded-lg bg-background/95 ring-1 ring-foreground/10 lg:w-[80vw] lg:max-w-5xl">
          {children}
        </div>
      </div>
    </div>
  );
}
