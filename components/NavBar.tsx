import Link from "next/link";
import type { Session } from "@/lib/auth";
import "../app/design-system.css";

/**
 * Deliberately down to three destinations total: Events (always shown —
 * it's public, and doubles as the entry point/"question flow" for a new
 * visitor), Profile (signed in), Login (signed out — one button, toggles
 * to Register on the page itself). Admin has no nav entry at all; admins
 * go straight to /admin. Logout lives in Profile's settings section, not
 * up here.
 */
export default function NavBar({ session }: { session: Session | null }) {
  return (
    <nav className="sm-scope navbar navbar-expand-md">
      <div className="container-fluid">
        <Link className="navbar-brand sm-brand" href="/">
          <span className="sm-brand-word">Samnian</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" href="/events">
                <i className="bi bi-calendar-event" /> Events
              </Link>
            </li>
            {session ? (
              <li className="nav-item">
                <Link className="nav-link" href="/profile">
                  <i className="bi bi-person" /> Profile
                </Link>
              </li>
            ) : (
              <li className="nav-item sm-nav-cta">
                <Link className="sm-btn sm-btn-primary" href="/login">
                  <i className="bi bi-box-arrow-in-right" /> Log in
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
