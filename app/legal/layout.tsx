import Link from "next/link";

const NAV = [
  { href: "/legal/privacy", label: "Gizlilik Politikası" },
  { href: "/legal/kvkk", label: "KVKK Aydınlatma" },
  { href: "/legal/gdpr", label: "GDPR Bilgilendirme" },
  { href: "/legal/cookies", label: "Çerez Politikası" },
  { href: "/legal/terms", label: "Kullanım Şartları" },
  { href: "/legal/dpa", label: "Veri İşleme Sözleşmesi (DPA)" },
  { href: "/legal/refund", label: "İade & Cayma Hakkı" },
  { href: "/legal/imprint", label: "Künye / Impressum" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        <aside className="md:sticky md:top-10 md:self-start">
          <Link href="/" className="inline-block mb-6 text-sm text-ink-400 hover:text-ink-100">
            ← Ana sayfa
          </Link>
          <h2 className="text-xs uppercase tracking-wider text-ink-500 mb-3">Hukuki Belgeler</h2>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="block px-3 py-2 rounded-lg text-sm text-ink-300 hover:text-ink-50 hover:bg-zinc-900"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="legal-prose">
          {children}
        </main>
      </div>
    </div>
  );
}
