import { NotificationsClient } from "@/components/notifications/notifications-client";

export const metadata = { title: "Notifications · Klyvi" };

export default function NotificationsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 md:px-6">
      <NotificationsClient />
    </main>
  );
}
