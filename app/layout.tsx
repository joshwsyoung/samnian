import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import BootstrapClient from "@/components/BootstrapClient";
import FadeIn from "@/components/FadeIn";
import NavBar, { MobileBottomNav } from "@/components/NavBar";
import { getSession } from "@/lib/auth";

// New design-system typeface — a fuller weight range than the legacy
// self-hosted Poppins-Light, kept under its own variable so pages that
// haven't been redesigned yet (still on globals.css's Poppins) are
// unaffected. See app/design-system.css for where this is used.
const poppinsV2 = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins-v2",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Samnian",
  description: "A small team helping connect everyone for a great dinner!",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const theme = session?.theme ?? "light";

  return (
    <html lang="en" data-bs-theme={theme} className={poppinsV2.variable}>
      <body>
        <noscript>
          <style>{`body { opacity: 1 !important; }`}</style>
        </noscript>
        <NavBar session={session} />
        {children}
        <MobileBottomNav session={session} />
        <FadeIn />
        <BootstrapClient />
      </body>
    </html>
  );
}
