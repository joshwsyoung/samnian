import { redirect } from "next/navigation";

// The profile page's editing UI moved into pop-up modals on /dashboard
// (the post-login landing page) — this route stays around as a redirect
// for old links and bookmarks.
export default function ProfileRedirect() {
  redirect("/dashboard");
}
