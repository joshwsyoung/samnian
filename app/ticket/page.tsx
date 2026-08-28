import QRCode from "qrcode";
import PrintButton from "@/components/PrintButton";
import { getBaseUrl } from "@/lib/url";
import "../design-system.css";

export const dynamic = "force-dynamic";

/**
 * A printable marketing asset — an A4 sheet of 10 cut-out tickets, each
 * individually numbered with its own QR code. Scanning one lands on
 * /founder?n=<that ticket's number>, where the visitor (after logging in)
 * claims that number as their Founder Member Number — a badge, not a
 * login mechanism. Design lifted from an earlier one-off mockup; this
 * in-app version is the source of truth going forward since its QR
 * always points at wherever this deployment actually lives, and its
 * numbers always follow on from the last sheet printed (via ?start=).
 * No auth required — meant to be visited from any phone or laptop to
 * print copies.
 */
export default async function TicketPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start } = await searchParams;
  const startNumber = Math.max(1, Number.isInteger(Number(start)) ? Number(start) : 1);

  const baseUrl = await getBaseUrl();
  const ticketNumbers = Array.from({ length: 10 }, (_, i) => startNumber + i);
  const qrSvgs = await Promise.all(
    ticketNumbers.map((n) =>
      QRCode.toString(`${baseUrl}/founder?n=${n}`, {
        type: "svg",
        margin: 0,
        color: { dark: "#2b2a26", light: "#00000000" },
      })
    )
  );

  const nextStart = startNumber + 10;

  return (
    <div className="sm-scope container mt-3 mb-5">
      <div className="sm-ticket-toolbar">
        <div className="sm-page-head">
          <div className="sm-greeting">Print a founder ticket sheet</div>
          <div className="sm-sub">
            10 cut-out tickets on one A4 page, numbered #{startNumber}&ndash;{startNumber + 9} — print at 100% (no
            &ldquo;fit to page&rdquo;), then cut along the dashed lines.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <form method="GET" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div className="sm-field" style={{ marginBottom: 0 }}>
              <label htmlFor="start">Sheet starts at ticket #</label>
              <input type="number" id="start" name="start" className="sm-input" min={1} defaultValue={startNumber} style={{ width: 110 }} />
            </div>
            <button type="submit" className="sm-btn sm-btn-ghost">Go</button>
          </form>
          <a className="sm-btn sm-btn-ghost" href={`/ticket?start=${nextStart}`}>Next sheet (#{nextStart}&ndash;{nextStart + 9})</a>
          <PrintButton />
        </div>
      </div>

      <div className="sm-ticket-page">
        <div className="sm-ticket-sheet">
          {ticketNumbers.map((n, i) => (
            <div className="sm-ticket" key={n}>
              <div className="sm-ticket-info">
                <span className="sm-tag">Founder No. {n}</span>
                <div className="sm-ticket-brand">Samnian</div>
                <p className="sm-ticket-headline">Dinner with new people, every Wednesday.</p>
                <p className="sm-ticket-body">
                  We match small groups for a dinner based on your personality — no swiping, no small talk over a screen.
                </p>
              </div>
              <div className="sm-ticket-stub">
                <div dangerouslySetInnerHTML={{ __html: qrSvgs[i]! }} />
                <span className="sm-scan-label">Scan to claim #{n}</span>
                <span className="sm-scan-url">{baseUrl.replace(/^https?:\/\//, "")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
