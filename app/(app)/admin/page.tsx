import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ErrorList } from "@/components/admin/error-list";
import { readAdminParams, type AdminParams } from "@/lib/admin";
import { getErrorGroups } from "@/lib/api/admin";
import { getServerAccessToken } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Errors · Klyvi",
  robots: { index: false, follow: false },
};

type Query = string | string[] | undefined;

/** The page and the moment it was read, for the "3 h ago" labels. */
async function load(token: string, params: AdminParams) {
  const page = await getErrorGroups(token, params);
  return { page, readAt: Date.now() };
}

/**
 * The admin error page. The API decides who's an admin, and everyone else,
 * signed in or not, gets the same 404 page as an unknown address.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: Query; offset?: Query; id?: Query }>;
}) {
  const token = await getServerAccessToken();
  if (!token) notFound();

  const params = readAdminParams(await searchParams);
  const { page, readAt } = await load(token, params);
  if (!page) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 md:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Errors</h1>
      <ErrorList page={page} params={params} now={readAt} />
    </main>
  );
}
