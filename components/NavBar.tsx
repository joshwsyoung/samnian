import Link from "next/link";
import type { Session } from "@/lib/auth";
import "../app/design-system.css";

/**
 * A single navbar for every screen size — collapses behind the standard
 * Bootstrap hamburger toggler below the `md` breakpoint. There used to
 * also be a separate floating pill-shaped bottom tab bar on mobile
 * (MobileBottomNav); it was dropped in favor of just this.
 *
 * Login/Register/Logout also get a compact icon-only row next to the
 * toggler, visible only below `md` — on mobile they'd otherwise be just
 * more rows buried at the bottom of the hamburger dropdown; as icons they
 * stay reachable without opening the menu. The full text versions still
 * render inside the dropdown for desktop, where there's room to spare.
 */
export default function NavBar({ session, hasGroup }: { session: Session | null; hasGroup: boolean }) {
  const isAdmin = session?.role === "admin";

  return (
    <nav className="sm-scope navbar navbar-expand-md">
      <div className="container-fluid">
        <Link className="navbar-brand sm-brand" href="/">
          <span className="sm-brand-word">Samnian</span>
        </Link>

        <div className="sm-nav-auth-icons d-flex d-md-none">
          {session ? (
            <form action="/logout" method="POST">
              <button type="submit" className="sm-nav-icon-btn" aria-label="Logout">
                <i className="bi bi-box-arrow-right" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <>
              <Link className="sm-nav-icon-btn" href="/login" aria-label="Login">
                <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
              </Link>
              <Link className="sm-nav-icon-btn sm-nav-icon-btn-primary" href="/register" aria-label="Register">
                <i className="bi bi-person-plus" aria-hidden="true" />
              </Link>
            </>
          )}
        </div>

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
                <li className="nav-item d-none d-md-block">
                  <form action="/logout" method="POST">
                    <button type="submit" className="nav-link sm-btn-reset">
                      Logout
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item d-none d-md-block">
                  <Link className="nav-link" href="/login">Login</Link>
                </li>
                <li className="nav-item sm-nav-cta d-none d-md-flex">
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
