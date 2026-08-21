"use client";

import { useTransition } from "react";
import { updateThemeAction } from "@/app/profile/actions";

export default function ThemeSwitch({ currentTheme }: { currentTheme: "light" | "dark" }) {
  const [, startTransition] = useTransition();
  const isDark = currentTheme === "dark";

  function toggle() {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-bs-theme", next);
    startTransition(() => {
      const fd = new FormData();
      fd.set("theme", next);
      updateThemeAction(fd);
    });
  }

  return (
    <div className="sm-settings-strip">
      <span>Dark mode</span>
      <button
        type="button"
        className="sm-toggle"
        aria-pressed={isDark}
        aria-label="Toggle dark mode"
        onClick={toggle}
      >
        <span className="sm-knob" />
      </button>
    </div>
  );
}
