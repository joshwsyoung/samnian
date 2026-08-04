"use client";

import { useEffect } from "react";

/**
 * Mirrors the legacy master.js body fade-in. Unlike the original PHP app,
 * content is already server-rendered here, so we skip its "#preloader +
 * display:none #main-content until JS runs" gating — that pattern only
 * made sense for a classic multi-page app and would otherwise hide the
 * page from anyone whose JS is slow or fails.
 */
export default function FadeIn() {
  useEffect(() => {
    const t = setTimeout(() => document.body.classList.add("fade-in"), 10);
    return () => clearTimeout(t);
  }, []);

  return null;
}
