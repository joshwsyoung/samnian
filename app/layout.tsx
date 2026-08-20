import type { Metadata } from "next";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import BootstrapClient from "@/components/BootstrapClient";
import FadeIn from "@/components/FadeIn";
import NavBar, { MobileBottomNav } from "@/components/NavBar";
import { getSession, userHasGroup } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Samnian",
  description: "A small team helping connect everyone for a great dinner!",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const hasGroup = session ? await userHasGroup(session.id) : false;

  return (
    <html lang="en">
      <body>
        <noscript>
          <style>{`body { opacity: 1 !important; }`}</style>
        </noscript>
        <NavBar session={session} hasGroup={hasGroup} />
        {children}
        <MobileBottomNav session={session} hasGroup={hasGroup} />
        <FadeIn />
        <BootstrapClient />
      </body>
    </html>
  );
}
