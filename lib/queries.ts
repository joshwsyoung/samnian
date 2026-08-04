import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

/** Used by the root layout on every request to set <html data-bs-theme>. */
export async function getUserTheme(userId: string): Promise<"light" | "dark"> {
  const [row] = await db()
    .select({ theme: users.theme })
    .from(users)
    .where(eq(users.id, Number(userId)))
    .limit(1);
  return row?.theme ?? "light";
}
