import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request. Server Components
 * can't write cookies, so without this a session nearing its access-token
 * expiry could silently fail to refresh during a plain page render — the
 * refresh has to happen somewhere that *can* write the response, which is
 * here.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // See the matching comment in lib/supabase/server.ts — NEXT_PUBLIC_* vars
  // are inlined at build time, so a dashboard edit needs a genuinely fresh
  // build (not a cached-output redeploy) to actually take effect.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)"],
};
