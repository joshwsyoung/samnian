import Link from "next/link";
import LogoMark from "./LogoMark";
import type { Session } from "@/lib/auth";
import "../app/design-system.css";

/**
 * A single navbar for every screen size — collapses behind the standard
 * Bootstrap hamburger toggler below the `md` breakpoint. There used to
 * also be a separate floating pill-shaped bottom tab bar on mobile
 * (MobileBottomNav); it was dropped in favor of just this.
 */
export default function NavBar({ session, hasGroup }: { session: Session | null; hasGroup: boolean }) {
  const isAdmin = session?.role === "admin";

  return (
    <nav className="sm-scope navbar navbar-expand-md">
      <div className="container-fluid">
        <Link className="navbar-brand sm-brand" href="/">
          <LogoMark size={30} filterId="navVectorShadow" />
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
            {session ? (
              <>
                {isAdmin ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" href="/admin">Admin Dashboard</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" href="/admin/users">User Management</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" href="/admin/events">Events</Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" href="/events">Events</Link>
                    </li>
                    {hasGroup && (
                      <li className="nav-item">
                        <Link className="nav-link" href="/messages">Chat</Link>
                      </li>
                    )}
                  </>
                )}
                <li className="nav-item">
                  <Link className="nav-link" href="/profile">Profile</Link>
                </li>
                <li className="nav-item">
                  <form action="/logout" method="POST">
                    <button
                      type="submit"
                      className="nav-link"
                      style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                    >
                      Logout
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/login">Login</Link>
                </li>
                <li className="nav-item sm-nav-cta">
                  <Link className="sm-btn sm-btn-primary" href="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
