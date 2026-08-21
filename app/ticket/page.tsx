import QRCode from "qrcode";
import PrintButton from "@/components/PrintButton";
import { getBaseUrl } from "@/lib/url";
import "../design-system.css";

export const dynamic = "force-dynamic";

/**
 * A printable marketing asset — an A4 sheet of 10 cut-out tickets, each
 * with a QR code that scans straight to /register. Design lifted from an
 * earlier one-off mockup; this in-app version is the source of truth
 * going forward since its QR always points at wherever this deployment
 * actually lives, rather than a hardcoded URL baked into a static file.
 * No auth required — meant to be visited from any phone or laptop to
 * print copies.
 */
export default async function TicketPage() {
  const baseUrl = await getBaseUrl();
  const registerUrl = `${baseUrl}/register?src=ticket`;

  const qrSvg = await QRCode.toString(registerUrl, {
    type: "svg",
    margin: 0,
    color: { dark: "#0d3d3a", light: "#00000000" },
  });

  return (
    <div className="sm-scope container mt-3 mb-5">
      <div className="sm-ticket-toolbar">
        <div className="sm-page-head">
          <div className="sm-greeting">Print a ticket sheet</div>
          <div className="sm-sub">
            10 cut-out tickets on one A4 page — print at 100% (no &ldquo;fit to page&rdquo;), then cut along the dashed lines.
          </div>
        </div>
        <PrintButton />
      </div>

      <div className="sm-ticket-page">
        <div className="sm-ticket-sheet">
          {Array.from({ length: 10 }, (_, i) => (
            <div className="sm-ticket" key={i}>
              <div className="sm-ticket-info">
                <span className="sm-tag">Get social</span>
                <div className="sm-ticket-brand">Samnian</div>
                <p className="sm-ticket-headline">Dinner with new people, every Wednesday.</p>
                <p className="sm-ticket-body">
                  We match small groups for a dinner based on your personality — no swiping, no small talk over a screen.
                </p>
              </div>
              <div className="sm-ticket-stub">
                <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <span className="sm-scan-label">Scan to join</span>
                <span className="sm-scan-url">{baseUrl.replace(/^https?:\/\//, "")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
