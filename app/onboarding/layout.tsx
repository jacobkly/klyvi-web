import type { ReactNode } from "react";

/**
 * Onboarding runs chromeless: no nav, no sidebar, no footer (phase2 §8,
 * archetype C). Everything on screen is the task.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-full flex-col">{children}</div>;
}
