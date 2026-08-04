"use client";

import { useEffect, useState } from "react";

/** Success/error banner, auto-dismissed after 5s — mirrors the legacy session-flash messages. */
export default function Flash({ success, error }: { success?: string; error?: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!success && !error) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [success, error]);

  if (!visible || (!success && !error)) return null;

  return (
    <>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
    </>
  );
}
