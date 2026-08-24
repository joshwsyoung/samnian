import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, gte } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events } from "@/db/schema";
import { formatEventDate, formatSlot } from "@/lib/format";
import LandingReveal from "@/components/LandingReveal";
import "./editorial.css";

export const dynamic = "force-dynamic";

// Fraunces/Newsreader are loaded once, site-wide, in app/layout.tsx (as
// CSS variables on <html>) since SiteHeader's full-page menu needs them
// too — no need to load them again here.

const WORD = "samnian".split("");

// Editorial-style copy for the "how it works" band — describes the
// product itself rather than any one event, so it isn't DB-driven.
const HOW_STEPS = [
  {
    season: "First",
    title: "Take the test",
    when: "About ten minutes",
    body: "The Big Five — openness, conscientiousness, extraversion, agreeableness, neuroticism. It is the personality model psychologists actually use, and it tells us far more about who you'll enjoy an evening with than your job title does.",
    seatsLabel: "Five traits",
    seatsValue: "No wrong answers",
    take: "Start yours",
    href: "/ocean-test",
  },
  {
    season: "Then",
    title: "Meet your match",
    when: "Six at the table, including you",
    body: "We put together a group who score close enough to get on and far enough apart to stay interesting. You see the evenings on offer and choose the ones you fancy. Nothing is ever assigned to you.",
    seatsLabel: "Six seats",
    seatsValue: "You pick the night",
    take: "See the tables",
    href: "/events",
  },
  {
    season: "Finally",
    title: "Just turn up",
    when: "From seven, most evenings",
    body: "We book the restaurant and message the group a few days before, with a handful of ice breakers so nobody is left doing the weather. Everything after that is up to the six of you.",
    seatsLabel: "Booked for you",
    seatsValue: "Bring nothing",
    take: "Join in",
    href: "/register",
  },
];

// Falls back to one of the site's stock dinner photos when an event has no
// photo of its own yet — same "reuse if you don't have enough" approach
// the events pages already use.
const FALLBACK_SHOTS = [
  "/images/dinner-fine-dining.jpg",
  "/images/dinner-diner-friends.jpg",
  "/images/dinner-seafood-shack.jpg",
];

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

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (
    await db()
      .select()
      .from(events)
      .where(and(eq(events.published, true), gte(events.eventDate, today)))
  )
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 3);

  return (
    <div className="ed-scope">
      <div className="ed-wash" />
      <div className="ed-grain" />

      <LandingReveal />

      <div className="ed-page">
        <div className="ed-shell">
          <main className="ed-entry">
            <h1 className="ed-word" aria-label="Samnian">
              {WORD.map((letter, i) => (
                <span key={i}>{letter}</span>
              ))}
            </h1>

            <p className="ed-meta ed-fade">
              <span className="ed-ipa">/ˈsɑm·ni·ən/</span>
              <span className="ed-dot">·</span>
              <span className="ed-pos">verb</span>
              <span className="ed-dot">·</span>
              <span className="ed-lang">Old English</span>
            </p>

            <hr className="ed-rule ed-fade" />

            <ol className="ed-senses ed-fade">
              <li>To gather, to collect, to assemble — to bring people together in one place.</li>
              <li>To draw together; to join, to unite.</li>
            </ol>

            <div className="ed-actions ed-fade">
              <Link href="/register" className="ed-ticket">
                Scan my ticket
              </Link>
              <Link href="/register" className="ed-join">
                Join the list
              </Link>
            </div>
          </main>
        </div>

        <footer className="ed-hero-foot ed-fade">
          <p>
            Kin to <em>samnón</em> (Old Saxon) · <em>samena</em> (Old Frisian) · <em>samanón</em> (Old High
            German) · <em>samna</em> (Icelandic)
          </p>
          <p>
            <a href="https://bosworthtoller.com/26354" target="_blank" rel="noopener">
              Bosworth-Toller, <em>An Anglo-Saxon Dictionary</em>
            </a>
          </p>
        </footer>
      </div>

      <section className="ed-band ed-statement">
        <p className="ed-lift">
          Dinner on Wednesday and Thursday evenings with five people you haven&rsquo;t met, matched on
          how you&rsquo;re actually wired. We book the restaurant. <em>You just turn up hungry.</em>
        </p>
      </section>

      <section className="ed-band" id="how">
        <div className="ed-band-head ed-lift">
          <h2>How a table comes together</h2>
          <span className="ed-aside">Three steps, one evening</span>
        </div>

        <div className="ed-cards">
          {HOW_STEPS.map((step, i) => (
            <Link
              href={step.href}
              className="ed-card ed-lift"
              style={{ transitionDelay: `${0.06 + i * 0.08}s` }}
              key={step.title}
            >
              <span className="ed-season">{step.season}</span>
              <h3>{step.title}</h3>
              <p className="ed-when">{step.when}</p>
              <p>{step.body}</p>
              <span className="ed-seats">
                <span>
                  {step.seatsLabel} · <b>{step.seatsValue}</b>
                </span>
                <span className="ed-take">{step.take}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="ed-band" id="tables">
        <div className="ed-band-head ed-lift">
          <h2>Tables this month</h2>
          <span className="ed-aside">Wednesdays &amp; Thursdays</span>
        </div>

        {upcoming.length === 0 ? (
          <p className="ed-lift" style={{ color: "var(--ed-fg-soft)" }}>
            Nothing on the books quite yet —{" "}
            <Link href="/events" style={{ color: "var(--ed-accent)" }}>
              check the full list
            </Link>
            .
          </p>
        ) : (
          <div className="ed-cards">
            {upcoming.map((e, i) => {
              const day = new Date(`${e.eventDate}T00:00:00`).toLocaleDateString("en-GB", {
                weekday: "long",
              });
              const shot = e.imageUrl || FALLBACK_SHOTS[i % FALLBACK_SHOTS.length]!;
              return (
                <Link
                  href={`/events/${e.id}`}
                  className="ed-card ed-lift"
                  style={{ transitionDelay: `${0.06 + i * 0.08}s` }}
                  key={e.id}
                >
                  <div className="ed-shot">
                    <Image src={shot} alt={e.restaurantName} fill sizes="(max-width: 900px) 100vw, 33vw" />
                  </div>
                  <span className="ed-season">{day}</span>
                  <h3>{e.title}</h3>
                  <p className="ed-when">
                    {formatEventDate(e.eventDate)}
                    {e.address && `, ${e.address}`}, {formatSlot(e.slot)}
                  </p>
                  {e.description && <p>{e.description}</p>}
                  <span className="ed-seats">
                    <span>
                      Six seats · <b>{e.cuisine || "Open"}</b>
                    </span>
                    <span className="ed-take">Scan my ticket</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="ed-band ed-closing ed-lift">
        <p className="ed-stmt">
          Five strangers who probably would have got on anyway, and a table someone else booked. That is
          the whole idea — <em>samnian</em>, and then dinner.
        </p>
        <Link href="/register" className="ed-ticket">
          Join the list
        </Link>
      </section>

      <div className="ed-pagefoot">
        <p>London · Wednesday and Thursday evenings</p>
        <p>Matched on the Big Five</p>
      </div>
    </div>
  );
}
