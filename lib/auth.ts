import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "tt_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type Role = "user" | "admin";

export type SessionPayload = {
  sub: string; // user id, as a string (JWT convention)
  name: string;
  role: Role;
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Copy .env.example to .env.local and set a long random value."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof payload.name !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { sub: payload.sub, name: payload.name, role: payload.role as Role };
  } catch {
    return null;
  }
}

/** Reads and verifies the session cookie. Returns null if absent/invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Server Component / Server Action guard: redirects to /login if unauthenticated. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Server Component / Server Action guard: redirects unless the user is an admin. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "admin") redirect("/dashboard");
  return session;
}
