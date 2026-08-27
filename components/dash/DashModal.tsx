"use client";

import { useId, useRef, type ReactNode } from "react";

/**
 * A trigger that opens a native <dialog> instead of an inline panel —
 * used on the dashboard so profile/interests/account editing lives behind
 * pop-ups rather than its own page. Native <dialog> gives us focus-trap,
 * Escape-to-close, and inert-background for free.
 *
 * With `action`, children are wrapped in one form with Save/Cancel footer
 * buttons (mirrors EditPanel's contract). Without it, children render as-is
 * — for a modal like "Account settings" that holds several independent
 * forms (email, password, delete account) side by side.
 */
export default function DashModal({
  triggerLabel,
  triggerClassName = "ed-dash-edit",
  title,
  action,
  encType,
  saveLabel = "Save",
  children,
}: {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  action?: (formData: FormData) => void;
  encType?: string;
  saveLabel?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button type="button" className={triggerClassName} onClick={open}>
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        className="ed-modal"
        onClick={(e) => {
          // A click that lands on the <dialog> element itself (its padding/
          // backdrop area, not a descendant) means it landed outside the
          // actual content — treat it like clicking outside to dismiss.
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="sm-scope ed-modal-inner">
          <div className="ed-modal-head">
            <h3>{title}</h3>
            <button type="button" className="ed-modal-close" onClick={close} aria-label="Close">
              &times;
            </button>
          </div>

          {action ? (
            <>
              <form id={formId} action={action} encType={encType}>
                {children}
              </form>
              <div className="sm-actions" style={{ marginTop: 16 }}>
                <button type="submit" form={formId} className="sm-btn sm-btn-primary">
                  {saveLabel}
                </button>
                <button type="button" className="sm-btn sm-btn-ghost" onClick={close}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            children
          )}
        </div>
      </dialog>
    </>
  );
}
