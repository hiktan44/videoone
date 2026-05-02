import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ReferralAttribution } from "@/components/ReferralAttribution";
import { CookieConsent } from "@/components/CookieConsent";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Vibe Studio",
  description: "Türkçe AI video stüdyosu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-ink-950 text-ink-50 min-h-screen">
        <ClerkProvider>
          <PostHogProvider>{children}</PostHogProvider>
          <ReferralAttribution />
          <CookieConsent />
        </ClerkProvider>
      </body>
    </html>
  );
}
