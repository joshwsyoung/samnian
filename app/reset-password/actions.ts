"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { passwordResetCodes, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { passwordResetEmail, sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/url";

export async function requestResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (email) {
    const [user] = await db().select().from(users).where(eq(users.email, email)).limit(1);

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db().insert(passwordResetCodes).values({ email, token, expiresAt });

      const baseUrl = await getBaseUrl();
      const resetLink = `${baseUrl}/reset-password/${token}`;
      await sendEmail(email, "Reset Your TalkTable Password", passwordResetEmail(resetLink));
    }
  }

  // Always redirect to the same "check your inbox" page, whether or not
  // the address is registered — avoids leaking which emails have accounts.
  redirect("/reset-password/sent");
}

export async function performResetAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!token || !password || !confirmPassword) {
    redirect(`/reset-password/${token}?error=missing`);
  }
  if (password !== confirmPassword) {
    redirect(`/reset-password/${token}?error=nomatch`);
  }

  const [record] = await db()
    .select()
    .from(passwordResetCodes)
    .where(and(eq(passwordResetCodes.token, token), gt(passwordResetCodes.expiresAt, new Date())))
    .limit(1);

  if (!record) {
    redirect(`/reset-password/${token}?error=invalid_or_expired`);
  }

  const passwordHash = await hashPassword(password);
  await db().update(users).set({ passwordHash }).where(eq(users.email, record.email));
  await db().delete(passwordResetCodes).where(eq(passwordResetCodes.token, token));

  redirect("/login?success=password_reset");
}
