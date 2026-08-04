"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { createSessionCookie, verifyPassword } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [user] = await db().select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=invalid_credentials");
  }

  if (!user.verified) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  await createSessionCookie({ sub: String(user.id), name: user.name, role: user.role });
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}
