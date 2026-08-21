import { redirect } from "next/navigation";

// The dashboard was replaced by /events (an Airbnb-style browsable list of
// dinner events). This route stays around as a redirect for old links and
// bookmarks.
export default function DashboardRedirect() {
  redirect("/events");
}
