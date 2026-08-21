"use client";

import { useEffect } from "react";

/**
 * Bootstrap's collapse only toggles from the hamburger button itself — it
 * has no built-in "close when a link inside it is clicked" behavior, so on
 * mobile the menu stayed open after picking Events/Profile/Log in, sitting
 * on top of the page you just navigated to until you tapped the hamburger
 * again. Closes #navbarNav's collapse instance on any click inside it.
 */
export default function NavCollapseOnClick() {
  useEffect(() => {
    const collapseEl = document.getElementById("navbarNav");
    if (!collapseEl) return;

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("a, button")) return;
      import("bootstrap/dist/js/bootstrap.bundle.min.js").then(({ Collapse }) => {
        Collapse.getInstance(collapseEl as HTMLElement)?.hide();
      });
    }

    collapseEl.addEventListener("click", onClick);
    return () => collapseEl.removeEventListener("click", onClick);
  }, []);

  return null;
}
