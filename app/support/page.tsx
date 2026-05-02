import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  Book,
  AlertTriangle,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export const runtime = "nodejs";

const faqs = [
  {
    q: "Krediler nasıl harcanır?",
    a: "Hız/kalite katmanına göre değişir. Hızlı modda dakikası ~18 kredi, Pro modda ~190, Max modda ~600. 15s tanıtım Pro modda yaklaşık 50 kredi.",
  },
  {
    q: "Üretim çok mu sürüyor?",
    a: "AI video üretimi sahne başına 2-15 dakika sürebilir (özellikle Veo 3.1 ve Sora 2 gibi yüksek kaliteli modeller). Sayfayı kapatabilirsin — arka planda devam eder, geldiğinde Üretim Kuyruğu'nda görürsün.",
  },
  {
    q: "Ürettiğim videolar nerede saklanıyor?",
    a: "Otomatik olarak Cloudflare R2'ye yedekleniyor. Kie.ai 14 gün sonra orijinal dosyayı silse bile bizdeki kopyaya MediaAsset üzerinden ulaşabilirsin.",
  },
  {
    q: "Plan yükseltirsem eski kredilerim gider mi?",
    a: "Hayır — mevcut kredilerin korunur. Yeni planın aylık kredi miktarı her ay yenilenmesinde eklenir.",
  },
  {
    q: "Türkçe destek var mı?",
    a: "Evet — arayüz, AI, altyazı hepsi Türkçe. AI video modelleri için arka planda otomatik İngilizceye çeviriliyor (kalite için).",
  },
  {
    q: "Public yayınladığım video silinebilir mi?",
    a: "Sen istediğin zaman sayıdan kaldırabilirsin (Editor → Yayınla butonuna tekrar bas). Telif hakkı ihlali raporlanırsa biz de kaldırabiliriz.",
  },
];

export default function SupportPage() {
  return (
    <AppShell title="Destek" subtitle="Sorun, soru veya geri bildirim için doğru yerdesin">
      {/* İletişim kanalları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <a
          href="mailto:destek@videoone.com.tr"
          className="rounded-xl border border-ink-700 bg-ink-900/40 hover:border-amber-500/40 hover:bg-ink-900 p-5 transition-all"
        >
          <Mail className="h-5 w-5 text-amber-400 mb-2" />
          <div className="text-sm font-semibold text-ink-50">Email</div>
          <div className="text-[11px] text-ink-400 mt-0.5">destek@videoone.com.tr</div>
        </a>
        <a
          href="https://discord.gg/vibestudio"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-ink-700 bg-ink-900/40 hover:border-cyan-500/40 hover:bg-ink-900 p-5 transition-all"
        >
          <MessageSquare className="h-5 w-5 text-cyan-400 mb-2" />
          <div className="text-sm font-semibold text-ink-50">Discord</div>
          <div className="text-[11px] text-ink-400 mt-0.5">Topluluk + canlı destek</div>
        </a>
        <Link
          href="/explore"
          className="rounded-xl border border-ink-700 bg-ink-900/40 hover:border-coral-500/40 hover:bg-ink-900 p-5 transition-all"
        >
          <Book className="h-5 w-5 text-coral-400 mb-2" />
          <div className="text-sm font-semibold text-ink-50">Örnekler</div>
          <div className="text-[11px] text-ink-400 mt-0.5">Topluluk projelerinden öğren</div>
        </Link>
      </div>

      {/* SSS */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-ink-100 mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-amber-400" />
          Sıkça Sorulan
        </h2>
        <div className="space-y-2">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-ink-700 bg-ink-900/40 hover:border-ink-600 transition-colors"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-medium text-ink-100 px-4 py-3">
                {f.q}
                <span className="text-ink-400 group-open:text-amber-400 group-open:rotate-180 transition-all">
                  ▾
                </span>
              </summary>
              <p className="px-4 pb-3 text-sm text-ink-300 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Hızlı linkler */}
      <div className="rounded-xl border border-ink-700 bg-gradient-to-r from-amber-500/[0.05] to-cyan-500/[0.05] p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-ink-100">Yeni özellik mi istiyorsun?</div>
            <p className="text-xs text-ink-300 mt-1 leading-relaxed">
              Aklında bir özellik veya iyileştirme varsa bize Discord üzerinden veya{" "}
              <a
                href="mailto:hello@videoone.com.tr"
                className="text-amber-300 hover:text-amber-200"
              >
                hello@videoone.com.tr
              </a>{" "}
              adresinden yaz. Her geri bildirimi okuyoruz.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <a
          href="https://github.com/hiktan44/videoone/issues"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-ink-400 hover:text-amber-300 inline-flex items-center gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          Bug bildirin (GitHub Issues)
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </AppShell>
  );
}
