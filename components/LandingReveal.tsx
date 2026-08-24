"use client";

import { useEffect } from "react";

/**
 * Progressive-enhancement layer for the editorial landing page: the
 * lettered "samnian" reveal and the scroll-triggered .ed-lift bands.
 * Ported from the approved mockup's inline <script>, minus the dev-only
 * palette switcher and phone-preview panel (both were marked "remove
 * before launch" there). Without JS the page just renders fully visible
 * and static — .ed-fade/.ed-lift only hide content once .ed-anim/.ed-gathered
 * are added here, so nothing depends on this running.
 */
export default function LandingReveal() {
  useEffect(() => {
    const body = document.body;
    body.classList.add("ed-anim");
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => body.classList.add("ed-gathered"));
    });
    const gatherFallback = setTimeout(() => body.classList.add("ed-gathered"), 1200);

    let io: IntersectionObserver | undefined;
    const lifts = document.querySelectorAll(".ed-lift");
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("ed-in");
              io?.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
      );
      lifts.forEach((el) => io?.observe(el));
    } else {
      lifts.forEach((el) => el.classList.add("ed-in"));
    }

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(gatherFallback);
      io?.disconnect();
      body.classList.remove("ed-anim", "ed-gathered");
    };
  }, []);

  return null;
}
