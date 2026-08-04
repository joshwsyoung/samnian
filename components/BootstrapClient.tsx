"use client";

import { useEffect } from "react";

/**
 * Loads Bootstrap's JS bundle (modals, offcanvas, navbar toggler, dropdowns)
 * once on the client. The rest of the app relies on plain data-bs-* markup,
 * same as the legacy PHP templates, so no React wrapper components are
 * needed for Bootstrap's interactive widgets.
 */
export default function BootstrapClient() {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null;
}
