import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import "./design-system.css";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  // Defensive fallback: Supabase Auth lands here with a bare ?code= (PKCE
  // code exchange) instead of reaching our own /auth/confirm page whenever
  // a confirmation/reset email's redirect_to isn't on the Redirect URLs
  // allowlist — e.g. the form was submitted from a domain alias that isn't
  // allow-listed there. Complete the exchange here too so that path still
  // results in a session instead of silently doing nothing.
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    redirect(
      error
        ? "/login?error=" + encodeURIComponent("That link is invalid or has expired.")
        : "/dashboard"
    );
  }

  return (
    <div className="sm-scope">
      <div className="container">
        <section className="sm-hero-split">
          <div className="sm-hero-copy">
            <div className="sm-kicker">Get social</div>
            <h1>
              Great dinners start at <span className="sm-accent-word">Samnian</span>.
            </h1>
            <p>
              Take a personality quiz, browse upcoming dinners, and tell us what you&rsquo;re up
              for — we&rsquo;ll match you with a small table for the night, budget and all.
            </p>
            <div className="sm-hero-actions">
              <Link href="/register" className="sm-btn sm-btn-primary">Join in</Link>
              <Link href="/login" className="sm-btn sm-btn-ghost">Already a member? Log in</Link>
            </div>
          </div>
          <div className="sm-hero-photo">
            <Image
              src="/images/dinner-group-toast.jpg"
              alt="A group of friends raising a toast together at a restaurant table"
              fill
              sizes="(max-width: 860px) 100vw, 480px"
              priority
            />
          </div>
        </section>

        <div className="sm-steps-head">
          <h2>How it works</h2>
        </div>
        <div className="sm-steps">
          <div className="sm-step-card" style={{ backgroundImage: "url('/images/dinner-fine-dining.jpg')" }}>
            <div className="sm-step-num">Step 1</div>
            <h3>Take the test</h3>
            <p>Complete our quick personality quiz (OCEAN model) to help us understand you.</p>
          </div>
          <div className="sm-step-card" style={{ backgroundImage: "url('/images/dinner-diner-friends.jpg')" }}>
            <div className="sm-step-num">Step 2</div>
            <h3>Pick your events</h3>
            <p>Browse upcoming dinners, RSVP to the ones you fancy, and tell us your budget for each.</p>
          </div>
          <div className="sm-step-card" style={{ backgroundImage: "url('/images/dinner-seafood-shack.jpg')" }}>
            <div className="sm-step-num">Step 3</div>
            <h3>Get matched</h3>
            <p>We&rsquo;ll group you with a small table for a great shared meal.</p>
          </div>
          <div className="sm-step-card" style={{ backgroundImage: "url('/images/dinner-cheers-riverside.jpg')" }}>
            <div className="sm-step-num">Step 4</div>
            <h3>Enjoy dinner</h3>
            <p>Meet new people and enjoy good food and great conversation.</p>
          </div>
        </div>

        <div className="sm-cta-band">
          <h2>Ready to meet your table?</h2>
          <Link href="/register" className="sm-btn sm-btn-primary">Register &amp; take the test</Link>
        </div>
      </div>
    </div>
  );
}
