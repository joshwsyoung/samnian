"use client";

import { useId, useState } from "react";
import { PASSWORD_HINT, PASSWORD_PATTERN } from "@/lib/constants";

export default function PasswordInput({
  name,
  label,
  enforcePattern = true,
  autoComplete,
}: {
  name: string;
  label: string;
  /** Turn off for "confirm password" fields that just need to match, not re-validate strength. */
  enforcePattern?: boolean;
  /** e.g. "current-password" for login, "new-password" for register/reset. */
  autoComplete?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="sm-field">
      <label htmlFor={id}>{label}</label>
      <div className="sm-field-password">
        <input
          type={visible ? "text" : "password"}
          id={id}
          name={name}
          className="sm-input"
          pattern={enforcePattern ? PASSWORD_PATTERN : undefined}
          title={enforcePattern ? PASSWORD_HINT : undefined}
          autoComplete={autoComplete}
          required
        />
        <button
          className="sm-toggle-visibility"
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <i className={`bi ${visible ? "bi-eye" : "bi-eye-slash"}`} />
        </button>
      </div>
    </div>
  );
}
