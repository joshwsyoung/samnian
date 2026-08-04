"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interests, userInterests, users } from "@/db/schema";
import { clearSessionCookie, requireUser } from "@/lib/auth";
import { ProfileImageError, uploadProfileImage } from "@/lib/blob";
import { PRICE_LEVELS, type PriceLevel } from "@/lib/constants";

export async function updateProfileAction(formData: FormData) {
  const session = await requireUser();
  const userId = Number(session.sub);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const age = String(formData.get("age") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const priceLevel = String(formData.get("price_point") ?? "") as PriceLevel;

  const errors: string[] = [];
  if (!name) errors.push("Name is required.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required.");
  if (!phone) errors.push("Phone number is required.");
  const ageNum = Number(age);
  if (!age || Number.isNaN(ageNum) || ageNum < 16 || ageNum > 100) errors.push("Valid age is required.");
  if (!city) errors.push("City is required.");
  if (!PRICE_LEVELS.includes(priceLevel)) errors.push("Invalid price point selected.");

  let profileImageUrl: string | undefined;
  const file = formData.get("profile_image");
  if (file instanceof File && file.size > 0) {
    try {
      profileImageUrl = await uploadProfileImage(String(userId), file);
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
      email,
      phone,
      age: ageNum,
      city,
      priceLevel,
      ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
    })
    .where(eq(users.id, userId));

  redirect("/profile?success=" + encodeURIComponent("Profile updated successfully!"));
}

export async function updateInterestsAction(formData: FormData) {
  const session = await requireUser();
  const userId = Number(session.sub);

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

export async function deleteAccountAction() {
  const session = await requireUser();
  await db().delete(users).where(eq(users.id, Number(session.sub)));
  await clearSessionCookie();
  redirect("/");
}
