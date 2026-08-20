import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST-only deliberately: this has a side effect (ends the session), and a
// GET here reachable from a plain <Link> would get silently triggered by
// Next.js's automatic Link prefetching the moment the link scrolls into
// view — logging people out without them clicking anything. NavBar submits
// a form to this route instead of linking to it.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
