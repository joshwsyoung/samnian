"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@/lib/auth";

/**
 * Replaces the old NavBar entirely — Josh called the Bootstrap nav bar
 * "horrible" and asked for just a hamburger, everywhere (mobile and
 * desktop alike), opening a full-page menu of plain text links, no icons.
 * Lives outside both .sm-scope and .ed-scope (it's site chrome, not page
 * content) but deliberately uses the new editorial palette/type — this is
 * the template going forward, so new chrome leads with it even on pages
 * that haven't been redesigned yet.
 */
export default function SiteHeader({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="ed-chrome">
      <header className="ed-chrome-bar">
        <Link href="/" className="ed-chrome-brand" onClick={close}>
          Samnian
        </Link>
        <button
          type="button"
          className="ed-chrome-toggle"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`ed-hamburger${open ? " ed-hamburger-open" : ""}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>

      <nav
        id="site-menu"
        className={`ed-menu-overlay${open ? " ed-menu-open" : ""}`}
        aria-hidden={!open}
      >
        <ul className="ed-menu-links">
          <li>
            <Link href="/" onClick={close}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/events" onClick={close}>
              Events
            </Link>
          </li>
          {session ? (
            <li>
              <Link href="/dashboard" onClick={close}>
                Dashboard
              </Link>
            </li>
          ) : (
            <li>
              <Link href="/login" onClick={close}>
                Log in
              </Link>
            </li>
          )}
          {session?.role === "admin" && (
            <li>
              <Link href="/admin" onClick={close}>
                Admin
              </Link>
            </li>
          )}
        </ul>

        {session && (
          <form action="/logout" method="POST" className="ed-menu-logout">
            <button type="submit">Log out</button>
          </form>
        )}
      </nav>
    </div>
  );
}
