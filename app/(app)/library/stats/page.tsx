import { redirect } from "next/navigation";

/** Stats moved into the profile. The old URL keeps working. */
export default function LegacyStatsPage() {
  redirect("/profile/stats");
}
