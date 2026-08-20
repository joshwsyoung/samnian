"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/auth";

export async function updateUserAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const age = formData.get("age") ? Number(formData.get("age")) : null;
  const city = String(formData.get("city") ?? "").trim();
  const role = String(formData.get("role") ?? "user") as Role;

  // Admins can also fix a broken login email — unlike the user's own
  // profile form, which leaves this read-only. Update the real Supabase
  // Auth identity, not just this app's copy of it, so they stay in sync.
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(id, { email, email_confirm: true });

  await db().update(users).set({ name, email, phone, age, city, role }).where(eq(users.id, id));

  redirect("/admin/users?updated=1");
}

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("user_id") ?? "");

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id); // cascades to the public.users profile row

  redirect("/admin/users?deleted=1");
}
