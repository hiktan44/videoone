// /settings/brand-kit — Marka Kiti yönetim sayfası
import { BrandKitEditor } from "@/components/BrandKitEditor";

export const metadata = { title: "Marka Kiti — Vibe Studio" };

export default function BrandKitPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Marka Kiti</h1>
          <p className="text-ink-300 mt-2">
            Renkleriniz, fontunuz ve logonuz tüm yeni projelere otomatik uygulanır.
            İstediğiniz projede tek tıkla değiştirebilirsiniz.
          </p>
        </div>
        <BrandKitEditor />
      </div>
    </div>
  );
}
