"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const nextQuery = next ? `&next=${encodeURIComponent(next)}` : "";
    if (error.code === "email_not_confirmed") {
      redirect(`/verify-email?email=${encodeURIComponent(email)}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    }
    redirect(`/login?error=invalid_credentials${nextQuery}`);
  }

  const [profile] = await db().select().from(users).where(eq(users.id, data.user.id)).limit(1);

  redirect(profile?.role === "admin" ? "/admin" : safeNextPath(next, "/events"));
}
