import { Bell } from "lucide-react";

import { EmptyState } from "@/components/klyvi/empty-state";

export const metadata = { title: "Notifications \u00b7 Klyvi" };

export default function NotificationsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
      <EmptyState
        icon={Bell}
        title="Nothing yet"
        body="Season premieres and updates for what you track will show up here."
        className="py-20"
      />
    </main>
  );
}
