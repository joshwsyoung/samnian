import Link from "next/link";
import "./design-system.css";

export default function LandingPage() {
  return (
    <div className="sm-scope">
      <div className="container">
        <section className="sm-hero-landing">
          <div className="sm-kicker">Get social</div>
          <h1>
            Great dinners start at <span className="sm-accent-word">Samnian</span>.
          </h1>
          <p>
            We match you with a small group for a Wednesday dinner, based on your personality
            and your plans — no swiping, no small talk over a screen.
          </p>
          <div className="sm-hero-actions">
            <Link href="/register" className="sm-btn sm-btn-primary">Join in</Link>
            <Link href="/login" className="sm-btn sm-btn-ghost">Already a member? Log in</Link>
          </div>
        </section>

        <div className="sm-steps-head">
          <h2>How it works</h2>
        </div>
        <div className="sm-steps">
          <div className="sm-step-card" style={{ backgroundImage: "url('/images/Friends-1.jpg')" }}>
            <div className="sm-step-num">Step 1</div>
            <h3>Take the test</h3>
            <p>Complete our quick personality quiz (OCEAN model) to help us understand you.</p>
          </div>
          <div className="sm-step-card" style={{ backgroundImage: "url('/images/Friends-2.jpg')" }}>
            <div className="sm-step-num">Step 2</div>
            <h3>Set availability</h3>
            <p>Choose the Wednesdays you&rsquo;re free and your preferences like city and budget.</p>
          </div>
          <div className="sm-step-card" style={{ backgroundImage: "url('/images/Friends-3.jpg')" }}>
            <div className="sm-step-num">Step 3</div>
            <h3>Get matched</h3>
            <p>We&rsquo;ll match you with a small group for a great shared meal.</p>
          </div>
          <div className="sm-step-card" style={{ backgroundImage: "url('/images/Friends-1.jpg')" }}>
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
