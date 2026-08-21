import QRCode from "qrcode";
import LogoMark from "@/components/LogoMark";
import PrintButton from "@/components/PrintButton";
import { getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

/**
 * A printable marketing asset — a small ticket stub with a QR code that
 * scans straight to /register. Designed to be printed on a home/office
 * printer, cut out, and handed out or stuck up around town (tube, cafés,
 * noticeboards). No auth required — it's meant to be visited from any
 * phone or laptop to print copies.
 */
export default async function TicketPage() {
  const baseUrl = await getBaseUrl();
  const registerUrl = `${baseUrl}/register?src=ticket`;

  const qrSvg = await QRCode.toString(registerUrl, {
    type: "svg",
    margin: 0,
    color: { dark: "#1c1c1c", light: "#00000000" },
  });

  return (
    <div className="container py-4">
      <div className="d-print-none mb-4">
        <h2 className="mb-1">Print a ticket</h2>
        <p className="text-muted">
          A small paper flyer people can scan to jump straight into registration.
          Print on plain paper or card, cut along the edge, and hand them out.
        </p>
        <PrintButton />
      </div>

      <div className="ticket-print-area">
        <div className="ticket-stub">
          <div className="ticket-stub-main">
            <div className="ticket-stub-brand">
              <LogoMark size={40} filterId="ticketVectorShadow" />
              <div>
                <div className="ticket-stub-name">Samnian</div>
                <div className="ticket-stub-tagline">GET SOCIAL</div>
              </div>
            </div>
            <p className="ticket-stub-copy">
              Scan. Register. Get matched with a small group for a great dinner.
            </p>
          </div>
          <div className="ticket-stub-perforation" aria-hidden="true" />
          <div className="ticket-stub-qr">
            <div className="ticket-stub-qr-code" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <div className="ticket-stub-scan-me">SCAN ME</div>
          </div>
        </div>
      </div>
    </div>
  );
}
