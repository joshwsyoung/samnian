import "server-only";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2MB, matches the legacy limit

export class ProfileImageError extends Error {}

export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new ProfileImageError("Image file size must be less than 2MB.");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ProfileImageError("Only JPG, PNG, GIF, or WEBP images are allowed.");
  }

  const ext = file.type.split("/")[1];
  const blob = await put(`profile-images/${userId}-${Date.now()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return blob.url;
}
