"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interests, userInterests, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfileImageError, uploadProfileImage } from "@/lib/blob";

export async function updateProfileAction(formData: FormData) {
  const session = await requireUser();
  const userId = session.id;

  // Login email is managed by Supabase Auth, not editable from here — see
  // the profile page, where it's rendered read-only.
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const age = String(formData.get("age") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  const errors: string[] = [];
  if (!name) errors.push("Name is required.");
  if (!phone) errors.push("Phone number is required.");
  const ageNum = Number(age);
  if (!age || Number.isNaN(ageNum) || ageNum < 16 || ageNum > 100) errors.push("Valid age is required.");
  if (!city) errors.push("City is required.");

  let profileImageUrl: string | undefined;
  const file = formData.get("profile_image");
  if (file instanceof File && file.size > 0) {
    try {
      profileImageUrl = await uploadProfileImage(userId, file);
    } catch (err) {
      errors.push(err instanceof ProfileImageError ? err.message : "Failed to upload image.");
    }
  }

  if (errors.length > 0) {
    redirect("/profile?error=" + encodeURIComponent(errors.join(" ")));
  }

  await db()
    .update(users)
    .set({
      name,
      phone,
      age: ageNum,
      city,
      ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
    })
    .where(eq(users.id, userId));

  redirect("/profile?success=" + encodeURIComponent("Profile updated successfully!"));
}

export async function updateInterestsAction(formData: FormData) {
  const session = await requireUser();
  const userId = session.id;

  const selectedNames = String(formData.get("selected_interests") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (selectedNames.length === 0) {
    redirect("/profile?error=" + encodeURIComponent("Please select at least one interest."));
  }

  await db().transaction(async (tx) => {
    await tx.delete(userInterests).where(eq(userInterests.userId, userId));

    const rows = await tx.select({ id: interests.id, name: interests.name }).from(interests);
    const idByName = new Map(rows.map((r) => [r.name, r.id]));

    const toInsert = selectedNames
      .map((name) => idByName.get(name))
      .filter((id): id is number => id !== undefined)
      .map((interestId) => ({ userId, interestId }));

    if (toInsert.length > 0) {
      await tx.insert(userInterests).values(toInsert);
    }
  });

  redirect("/profile?success=" + encodeURIComponent("Your interests have been updated successfully!"));
}

export async function updateEmailAction(formData: FormData) {
  await requireUser();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/profile?error=" + encodeURIComponent("Please enter an email address."));

  // Supabase sends a confirmation link to the new address and only swaps
  // it over once that's clicked — this app's own users.email column (and
  // the login email people actually use) stays as-is until then, so it's
  // deliberately not updated optimistically here.
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) redirect("/profile?error=" + encodeURIComponent(error.message));

  redirect("/profile?success=" + encodeURIComponent(`Check ${email} for a link to confirm your new email address.`));
}

export async function updatePasswordAction(formData: FormData) {
  await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!password || !confirmPassword) redirect("/profile?error=" + encodeURIComponent("Please fill in both password fields."));
  if (password !== confirmPassword) redirect("/profile?error=" + encodeURIComponent("Passwords do not match."));

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/profile?error=" + encodeURIComponent(error.message));

  redirect("/profile?success=" + encodeURIComponent("Password updated."));
}

export async function deleteAccountAction() {
  const session = await requireUser();

  // Sign out first, while the session is still valid, then delete the auth
  // user with the admin client — Postgres cascades the rest (profile row,
  // event interest, group membership, chat) via the FK to auth.users.
  const supabase = await createClient();
  await supabase.auth.signOut();

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(session.id);

  redirect("/");
}
