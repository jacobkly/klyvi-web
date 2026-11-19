import { readSection } from "@/lib/settings-sections";

import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings · Klyvi" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  return <SettingsClient initialSection={readSection(section)} />;
}
