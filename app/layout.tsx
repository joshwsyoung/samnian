import type { Metadata } from "next";
import { Poppins, Fraunces, Newsreader } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import "./editorial.css";
import FadeIn from "@/components/FadeIn";
import SiteHeader from "@/components/SiteHeader";
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

// The editorial design's type pair — loaded site-wide (not just on the
// pages already rewritten onto it) because SiteHeader's full-page menu
// uses Fraunces too. Both are variable fonts with axes beyond weight/
// italic (Fraunces also ships SOFT/WONK), so `weight: "variable"` pulls
// the full variable file rather than pinning a few static instances.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal"],
  variable: "--font-fraunces",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Samnian",
  description: "A small team helping connect everyone for a great dinner!",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className={`${poppinsV2.variable} ${fraunces.variable} ${newsreader.variable}`}>
      <body>
        <noscript>
          <style>{`body { opacity: 1 !important; }`}</style>
        </noscript>
        <SiteHeader session={session} />
        {children}
        <FadeIn />
      </body>
    </html>
  );
}
