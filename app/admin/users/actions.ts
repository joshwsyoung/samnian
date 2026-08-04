"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import type { Role } from "@/lib/auth";

export async function updateUserAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const age = formData.get("age") ? Number(formData.get("age")) : null;
  const city = String(formData.get("city") ?? "").trim();
  const role = String(formData.get("role") ?? "user") as Role;

  await db().update(users).set({ name, email, phone, age, city, role }).where(eq(users.id, id));

  redirect("/admin/users?updated=1");
}

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("user_id"));
  await db().delete(users).where(eq(users.id, id));
  redirect("/admin/users?deleted=1");
}
