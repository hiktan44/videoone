// /settings/privacy — KVKK / GDPR veri sahibi haklari
import { PrivacyActions } from "@/components/PrivacyActions";

export const metadata = { title: "Gizlilik & Verilerim — Vibe Studio" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Gizliliğim & Verilerim</h1>
        <p className="text-ink-300 mt-2 mb-8">
          KVKK Madde 11 ve GDPR Madde 15-22 kapsamındaki haklarınızı buradan kullanabilirsiniz.
        </p>
        <PrivacyActions />
      </div>
    </div>
  );
}
