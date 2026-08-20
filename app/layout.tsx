import type { Metadata } from "next";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import BootstrapClient from "@/components/BootstrapClient";
import FadeIn from "@/components/FadeIn";
import NavBar, { MobileBottomNav } from "@/components/NavBar";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Samnian",
  description: "A small team helping connect everyone for a great dinner!",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const theme = session?.theme ?? "light";

  return (
    <html lang="en" data-bs-theme={theme}>
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
