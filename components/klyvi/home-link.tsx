"use client";

import Link from "next/link";

import { useSession } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** "Go home": your home signed in, the landing page signed out, since /home
 *  would only bounce a visitor to sign-in. */
export function HomeLink({ className }: { className?: string }) {
  const { user } = useSession();
  return (
    <Link
      href={user ? "/home" : "/"}
      className={cn(buttonVariants({ size: "touch" }), "mt-6", className)}
    >
      Go home
    </Link>
  );
}
