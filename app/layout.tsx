import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from "@/components/PostHogProvider";
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
        </ClerkProvider>
      </body>
    </html>
  );
}
