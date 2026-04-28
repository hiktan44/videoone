import type { Metadata } from "next";
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
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">{children}</body>
    </html>
  );
}
