import Image from "next/image";
import type { ReactNode } from "react";

/**
 * The split auth layout (06-copy.md, auth-login-supabase reference): a narrow
 * form column beside one full-bleed backdrop still. Below lg the image panel
 * drops entirely and the form centres, the one place art appears purely for
 * atmosphere.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full">
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[480px] lg:shrink-0 lg:px-16">
        <div className="mx-auto w-full max-w-[380px] lg:mx-0">{children}</div>
      </div>
      <div className="relative hidden flex-1 lg:block">
        <Image
          src="https://image.tmdb.org/t/p/w1280/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg"
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        <p className="absolute bottom-8 right-8 max-w-xs text-right text-sm text-muted-foreground">
          Know what to watch tonight.
        </p>
      </div>
    </div>
  );
}
