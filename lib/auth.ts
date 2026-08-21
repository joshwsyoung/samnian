import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { groupMembers, personalityScores, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export type Role = "user" | "admin";

export type Session = {
  /** Supabase auth.users id (uuid) — also this app's users.id. */
  id: string;
  email: string;
  name: string;
  role: Role;
};

/**
 * The current signed-in user, joined with this app's profile row. Returns
 * null if signed out, or if signed in but the profile row hasn't been
 * created yet (shouldn't normally happen — see app/register/actions.ts).
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await db().select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? profile.email,
    name: profile.name,
    role: profile.role,
  };
}

/**
 * Server Component / Server Action guard: redirects to /login if
 * unauthenticated. `next` (a relative path only — never pass a full URL
 * through here, to avoid an open redirect) is threaded onto the login
 * link so the login/OAuth flow can send the user back to what they were
 * doing instead of always landing on /events.
 */
export async function requireUser(next?: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return session;
}

/** Server Component / Server Action guard: redirects unless the user is an admin. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireUser();
  if (session.role !== "admin") redirect("/events");
  return session;
}

/**
 * Server Component / Server Action guard: the OCEAN test is mandatory
 * before a user can opt into an event, so actions that need a completed
 * test call this instead of requireUser() — it's the two-step "question
 * flow" a brand new visitor goes through (log in/register, then the
 * quiz) before their first RSVP goes through, threading `next` through
 * both hops so they land back on the event they were trying to join.
 */
export async function requireCompletedOceanTest(next?: string): Promise<Session> {
  const session = await requireUser(next);
  const [scores] = await db().select().from(personalityScores).where(eq(personalityScores.userId, session.id)).limit(1);
  if (!scores) redirect(`/ocean-test?required=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  return session;
}

/**
 * Only relative, same-site paths are safe to redirect to — anything else
 * (a bare "//evil.com", an absolute "https://…" URL) is dropped in favor
 * of the given fallback so a crafted `next` query param can't be used to
 * redirect through this app to somewhere else.
 */
export function safeNextPath(next: string | undefined, fallback: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

/** Whether this user has been placed in at least one dinner group — used to gate the Chat nav link. */
export async function userHasGroup(userId: string): Promise<boolean> {
  const [row] = await db().select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, userId)).limit(1);
  return Boolean(row);
}
