"use server";

import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailVerificationCodes, users } from "@/db/schema";
import { createSessionCookie } from "@/lib/auth";
import { sendEmail, verificationCodeEmail } from "@/lib/mailer";

function generateCode() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

export async function resendCodeAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = generateCode();
  await db().insert(emailVerificationCodes).values({ email, code });
  await sendEmail(email, "Your TalkTable Verification Code", verificationCodeEmail(code));
  redirect(`/verify-email?email=${encodeURIComponent(email)}&success=resent`);
}

export async function verifyCodeAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();

  if (!email || !code) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}&error=missing`);
  }

  const [match] = await db()
    .select()
    .from(emailVerificationCodes)
    .where(and(eq(emailVerificationCodes.email, email), eq(emailVerificationCodes.code, code)))
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  if (!match) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}&error=invalid_code`);
  }

  await db().update(users).set({ verified: true }).where(eq(users.email, email));
  await db().delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, email));

  const [user] = await db().select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}&error=user_not_found`);
  }

  await createSessionCookie({ sub: String(user.id), name: user.name, role: user.role });
  redirect("/dashboard?success=verified");
}
