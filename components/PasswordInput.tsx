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
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="input-group">
        <input
          type={visible ? "text" : "password"}
          id={id}
          name={name}
          className="form-control"
          pattern={enforcePattern ? PASSWORD_PATTERN : undefined}
          title={enforcePattern ? PASSWORD_HINT : undefined}
          autoComplete={autoComplete}
          required
        />
        <button
          className="toggle-btn"
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <i className={`bi ${visible ? "bi-eye" : "bi-eye-slash"} password-toggle`} />
        </button>
      </div>
    </div>
  );
}
