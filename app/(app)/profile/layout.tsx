import type { ReactNode } from "react";

import { ProfileShell } from "@/components/profile/profile-shell";

/**
 * Both profile tabs share the banner, identity block, and tab row, and the
 * data fetch behind them. The shell is a client component; the tabs are
 * routes inside it so they deep-link and the banner never refetches
 * between them.
 */
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <ProfileShell>{children}</ProfileShell>;
}
