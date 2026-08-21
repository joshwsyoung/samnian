"use client";

export default function PrintButton() {
  return (
    <button type="button" className="sm-btn sm-btn-primary" onClick={() => window.print()}>
      <i className="bi bi-printer me-2" />
      Print / Save as PDF
    </button>
  );
}
