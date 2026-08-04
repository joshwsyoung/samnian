"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, emailVerificationCodes } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sendEmail, verificationCodeEmail } from "@/lib/mailer";

function generateCode() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

async function issueVerificationCode(email: string) {
  const code = generateCode();
  await db().insert(emailVerificationCodes).values({ email, code });
  await sendEmail(email, "Your TalkTable Verification Code", verificationCodeEmail(code));
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    redirect("/register?error=missing_fields");
  }

  const [existing] = await db().select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    if (!existing.verified) {
      await issueVerificationCode(email);
      redirect(`/verify-email?email=${encodeURIComponent(email)}`);
    }
    redirect("/register?error=already_registered");
  }

  const passwordHash = await hashPassword(password);
  await db().insert(users).values({ name, email, passwordHash, verified: false });
  await issueVerificationCode(email);

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}
