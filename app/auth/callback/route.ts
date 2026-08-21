import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { personalityScores, users } from "@/db/schema";
import { safeNextPath } from "@/lib/auth";

const OAUTH_FAILED_ERROR = "Google sign-in didn't complete. Please try again.";

/**
 * Where Supabase sends the browser back after a Google OAuth round trip
 * (see components/GoogleSignInButton.tsx). Unlike email/password, there's no
 * separate register step — the first time we see a given Google account we
 * create this app's profile row right here, same as registerAction does
 * for email/password signups.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next") ?? undefined, "");

  if (!code) {
    redirect(`/login?error=${encodeURIComponent(OAUTH_FAILED_ERROR)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? OAUTH_FAILED_ERROR)}`);
  }

  const authUser = data.user;
  const [existing] = await db().select().from(users).where(eq(users.id, authUser.id)).limit(1);

  if (!existing) {
    const metaName =
      (authUser.user_metadata?.full_name as string | undefined) ||
      (authUser.user_metadata?.name as string | undefined) ||
      authUser.email?.split("@")[0] ||
      "there";

    await db()
      .insert(users)
      .values({ id: authUser.id, name: metaName, email: authUser.email ?? "" })
      .onConflictDoNothing({ target: users.id });
  }

  const [profile] = await db().select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (profile?.role === "admin") redirect("/admin");

  const [scores] = await db().select().from(personalityScores).where(eq(personalityScores.userId, authUser.id)).limit(1);
  if (scores) redirect(safeNextPath(next, "/events"));
  redirect(`/ocean-test?required=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
}
