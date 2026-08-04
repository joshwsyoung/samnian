"use client";

import { useTransition } from "react";
import { updateThemeAction } from "@/app/dashboard/actions";

export default function ThemeToggle({ currentTheme }: { currentTheme: "light" | "dark" }) {
  const [, startTransition] = useTransition();

  function apply(theme: "light" | "dark") {
    document.documentElement.setAttribute("data-bs-theme", theme);
    startTransition(() => {
      const fd = new FormData();
      fd.set("theme", theme);
      updateThemeAction(fd);
    });
  }

  return (
    <div className="card-body fw-lighter fs-6">
      <h5 className="card-title">Theme</h5>
      <div className="form-check form-check-inline">
        <input
          className="form-check-input"
          type="radio"
          name="themeRadio"
          id="themeLight"
          value="light"
          defaultChecked={currentTheme === "light"}
          onChange={() => apply("light")}
        />
        <label className="form-check-label" htmlFor="themeLight">Light</label>
      </div>
      <div className="form-check form-check-inline">
        <input
          className="form-check-input"
          type="radio"
          name="themeRadio"
          id="themeDark"
          value="dark"
          defaultChecked={currentTheme === "dark"}
          onChange={() => apply("dark")}
        />
        <label className="form-check-label" htmlFor="themeDark">Dark</label>
      </div>
    </div>
  );
}
