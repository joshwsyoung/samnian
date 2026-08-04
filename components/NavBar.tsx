import Link from "next/link";
import LogoMark from "./LogoMark";
import type { SessionPayload } from "@/lib/auth";

export default function NavBar({ session }: { session: SessionPayload | null }) {
  const isAdmin = session?.role === "admin";

  return (
    <>
      {/* Desktop navbar */}
      <nav className="navbar navbar-expand-md fw-light d-none d-sm-block">
        <div className="container-fluid">
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

          <Link className="navbar-brand ms-auto" href="/">
            <LogoMark filterId="navVectorShadow" />
          </Link>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto nav-text">
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
                  <li className="nav-item">
                    <Link className="nav-link" href="/register">Register</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div className="fw-light" />
    </>
  );
}

export function MobileBottomNav({ session }: { session: SessionPayload | null }) {
  const isAdmin = session?.role === "admin";

  return (
    <nav className="mobile-bottom-nav fixed-bottom d-block d-sm-none">
      <div className="container-fluid justify-content-around">
        <ul className="navbar-nav flex-row w-100 justify-content-around">
          {session ? (
            <>
              {isAdmin ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link text-center" href="/admin">
                      <i className="bi bi-speedometer2" /><br />Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-center" href="/admin/users">
                      <i className="bi bi-people" /><br />Users
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-center" href="/admin/matches">
                      <i className="bi bi-list-check" /><br />Matches
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link text-center" href="/dashboard">
                      <i className="bi bi-house-door" /><br />Home
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link text-center" href="/messages">
                      <i className="bi bi-chat-dots" /><br />Chat
                    </Link>
                  </li>
                </>
              )}
              <li className="nav-item">
                <Link className="nav-link" href="/profile">
                  <i className="bi bi-person" /><br />Profile
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-center" href="/logout">
                  <i className="bi bi-box-arrow-right" /><br />Logout
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link text-center" href="/login">
                  <i className="bi bi-box-arrow-in-right" /><br />Login
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-center" href="/register">
                  <i className="bi bi-person-plus" /><br />Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
