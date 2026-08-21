/** Formats a `date` column string ("YYYY-MM-DD") as e.g. "Wed 3 Sep". */
export function formatEventDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** Formats a 24h "HH:MM" slot as e.g. "7:00pm". */
export function formatSlot(slot: string): string {
  const [hStr, m] = slot.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === "00" ? `${h12}${period}` : `${h12}:${m}${period}`;
}

/** Formats a timestamp for a profile feed item — "Today", "Yesterday",
 * "3 days ago" for the last week, then a plain date (year only if not the
 * current one). */
export function formatFeedDate(date: Date): string {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

/** Formats a join date as e.g. "August 2026", for the profile cover. */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
