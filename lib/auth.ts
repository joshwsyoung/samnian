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

/** Server Component / Server Action guard: redirects to /login if unauthenticated. */
export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
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
 * before a user can browse or opt into events, so route handlers that need
 * a completed test call this instead of requireUser().
 */
export async function requireCompletedOceanTest(): Promise<Session> {
  const session = await requireUser();
  const [scores] = await db().select().from(personalityScores).where(eq(personalityScores.userId, session.id)).limit(1);
  if (!scores) redirect("/ocean-test?required=1");
  return session;
}

/** Whether this user has been placed in at least one dinner group — used to gate the Chat nav link. */
export async function userHasGroup(userId: string): Promise<boolean> {
  const [row] = await db().select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, userId)).limit(1);
  return Boolean(row);
}
