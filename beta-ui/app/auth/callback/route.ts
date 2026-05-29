import { NextResponse, type NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

/**
 * Supabase magic-link callback. Exchanges the `code` query param for a session
 * cookie (server-side) then redirects to the original `next` destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const sb = await getServerSupabase();
    if (sb) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Failed exchange or no code — surface a friendly error.
  return NextResponse.redirect(`${origin}/signin?error=callback_failed`);
}
