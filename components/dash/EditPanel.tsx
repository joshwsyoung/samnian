"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * A trigger that expands into an inline form, in place, instead of opening
 * a modal. Save submits the form (via the HTML `form` attribute, so the
 * button can live outside it); Cancel just collapses the panel again.
 */
export default function EditPanel({
  triggerLabel,
  triggerClassName = "sm-btn sm-btn-primary",
  saveLabel = "Save",
  action,
  encType,
  children,
}: {
  triggerLabel: string;
  triggerClassName?: string;
  saveLabel?: string;
  action: (formData: FormData) => void;
  encType?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();

  if (!open) {
    return (
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>
    );
  }

  return (
    <div className="sm-edit-panel">
      <form id={formId} action={action} encType={encType}>
        {children}
      </form>
      <div className="sm-actions" style={{ marginTop: 14 }}>
        <button type="submit" form={formId} className="sm-btn sm-btn-primary">
          {saveLabel}
        </button>
        <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
