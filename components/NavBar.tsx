import Link from "next/link";
import LogoMark from "./LogoMark";
import type { Session } from "@/lib/auth";
import "../app/design-system.css";

export default function NavBar({ session }: { session: Session | null }) {
  const isAdmin = session?.role === "admin";

  return (
    <>
      {/* Desktop navbar */}
      <nav className="sm-scope navbar navbar-expand-md d-none d-sm-block">
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
                        <Link className="nav-link" href="/admin/matches">Matches</Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="nav-item">
                        <Link className="nav-link" href="/dashboard">Dashboard</Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" href="/messages">Chat</Link>
                      </li>
                    </>
                  )}
                  <li className="nav-item">
                    <Link className="nav-link" href="/profile">Profile</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" href="/logout">Logout</Link>
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
    </>
  );
}

export function MobileBottomNav({ session }: { session: Session | null }) {
  const isAdmin = session?.role === "admin";

  return (
    <nav className="sm-scope mobile-bottom-nav fixed-bottom d-block d-sm-none">
      <ul className="navbar-nav">
        {session ? (
          <>
            {isAdmin ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/admin">
                    <i className="bi bi-speedometer2" />Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/admin/users">
                    <i className="bi bi-people" />Users
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/admin/matches">
                    <i className="bi bi-list-check" />Matches
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/dashboard">
                    <i className="bi bi-house-door" />Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/messages">
                    <i className="bi bi-chat-dots" />Chat
                  </Link>
                </li>
              </>
            )}
            <li className="nav-item">
              <Link className="nav-link" href="/profile">
                <i className="bi bi-person" />Profile
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/logout">
                <i className="bi bi-box-arrow-right" />Logout
              </Link>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item">
              <Link className="nav-link" href="/login">
                <i className="bi bi-box-arrow-in-right" />Login
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/register">
                <i className="bi bi-person-plus" />Register
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
