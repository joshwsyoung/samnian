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
