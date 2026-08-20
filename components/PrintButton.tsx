"use client";

export default function PrintButton() {
  return (
    <button type="button" className="btn btn-primary d-print-none" onClick={() => window.print()}>
      <i className="bi bi-printer me-2" />
      Print ticket
    </button>
  );
}
