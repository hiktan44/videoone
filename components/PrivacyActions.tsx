"use client";

import { useState } from "react";
import { Download, Trash2, AlertTriangle, Loader2 } from "lucide-react";

export function PrivacyActions() {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const downloadData = () => {
    window.location.href = "/api/me/export";
  };

  const deleteAccount = async () => {
    if (confirmText !== "HESABIMI SİL") {
      setError('Onaylamak için tam olarak "HESABIMI SİL" yazın.');
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/me/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `Hata ${res.status}`);
        return;
      }
      // Hesap silindi -> ana sayfa
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-ink-50">Verilerimi İndir</h2>
            <p className="text-sm text-ink-300 mt-1">
              GDPR Madde 20 (Veri Taşınabilirliği) ve KVKK Madde 11 (Veri Sahibinin Hakları)
              kapsamında, sistemde tutulan tüm kişisel verilerinizin makine-okunabilir (JSON)
              kopyasını indirebilirsiniz: profil, projeler, üretim geçmişi, kredi hareketleri,
              abonelik, medya kayıtları ve tavsiye geçmişi.
            </p>
            <button
              onClick={downloadData}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-ink-950"
            >
              <Download className="h-4 w-4" />
              Verilerimi İndir (.json)
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-rose-100">Hesabımı Sil</h2>
            <p className="text-sm text-rose-200/80 mt-1">
              GDPR Madde 17 (Unutulma Hakkı) ve KVKK Madde 7 (Verilerin Silinmesi)
              kapsamında hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz:
            </p>
            <ul className="text-sm text-rose-200/80 mt-2 ml-5 list-disc space-y-0.5">
              <li>Tüm projeleriniz, kliplerinizi, karakterleriniz silinir</li>
              <li>Üretim geçmişi, kredi bakiyesi ve abonelik kaydı silinir</li>
              <li>R2 depolamadaki medya dosyalarınız 30 gün içinde temizlenir</li>
              <li>Clerk hesabınız da silinir (login anahtarınız iptal edilir)</li>
              <li>Yasal saklama yükümlülüğü olan finansal kayıtlar (fatura, vergi)
                anonimleştirilerek 10 yıl saklanır (VUK / TTK gereği)</li>
            </ul>
            <div className="mt-4 space-y-2">
              <label className="block text-xs uppercase tracking-wider text-rose-300">
                Onay metni — kutucuğa <strong>HESABIMI SİL</strong> yazın
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="HESABIMI SİL"
                className="w-full bg-rose-950/40 border border-rose-500/40 rounded-lg px-3 py-2 text-sm text-rose-100 focus:outline-none focus:border-rose-400 font-mono"
              />
              {error && <div className="text-xs text-rose-300">{error}</div>}
              <button
                onClick={deleteAccount}
                disabled={deleting || confirmText !== "HESABIMI SİL"}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Hesabımı Kalıcı Olarak Sil
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm text-ink-300 space-y-2">
        <h3 className="text-base font-semibold text-ink-100">Diğer Haklarınız</h3>
        <p>
          Verilerinizin işlenmesine itiraz, düzeltme veya işlemenin sınırlandırılması talebi
          için <a href="mailto:kvkk@videoone.com.tr" className="text-amber-300 hover:underline">kvkk@videoone.com.tr</a> adresine
          yazın. KVKK Madde 13 uyarınca taleplerinize 30 gün içinde yanıt verilir.
        </p>
        <p>
          AB içindeki kullanıcılar GDPR Madde 77 kapsamında veri koruma otoritesine
          (örn. CNIL, ICO, BfDI) şikayette bulunabilir. Türkiye'de KVKK için
          kişisel verileri koruma kuruluna (KVKK) başvurabilirsiniz.
        </p>
      </div>
    </div>
  );
}
