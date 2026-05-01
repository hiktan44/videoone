"use client";

import { useEffect, useState } from "react";
import { X, Copy, Gift, Check } from "lucide-react";

type Props = { open: boolean; onClose: () => void };

export function ReferralModal({ open, onClose }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitCode, setSubmitCode] = useState("");
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCode(d?.user?.referralCode || null))
      .catch(() => {});
  }, [open]);

  const link =
    code && typeof window !== "undefined"
      ? `${window.location.origin}/r/${code}`
      : "";

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const submitReferral = async () => {
    setSubmitMsg(null);
    const c = submitCode.trim();
    if (!c) return;
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMsg({
          ok: true,
          text: `+${data.youCredited} kredi yatırıldı! Davet eden kullanıcı +${data.referrerCredited} kazandı.`,
        });
        setSubmitCode("");
      } else {
        setSubmitMsg({ ok: false, text: data.error || "Hata" });
      }
    } catch (e) {
      setSubmitMsg({ ok: false, text: "Network hatası" });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 shadow-glow-amber"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-amber-400" />
            <div className="text-sm font-semibold text-ink-50">Arkadaşını davet et</div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md hover:bg-ink-800 text-ink-400 hover:text-ink-100 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider mb-2">
              Senin davet linkin
            </div>
            <div className="flex items-center gap-2">
              <input
                value={link}
                readOnly
                className="flex-1 bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-xs text-ink-100 font-mono focus:outline-none"
              />
              <button
                onClick={copy}
                className="h-9 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 text-xs font-semibold inline-flex items-center gap-1"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Kopyalandı" : "Kopyala"}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-ink-400 leading-relaxed">
              Bu link ile kayıt olan herkes için sen <span className="text-amber-300 font-semibold">+200 kredi</span>,
              davet edilen kişi <span className="text-cyan-300 font-semibold">+100 kredi</span> kazanır.
            </div>
          </div>

          <div className="border-t border-ink-800 pt-4">
            <div className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider mb-2">
              Bir kod girdin mi?
            </div>
            <div className="flex items-center gap-2">
              <input
                value={submitCode}
                onChange={(e) => setSubmitCode(e.target.value)}
                placeholder="Davet kodu yapıştır"
                className="flex-1 bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={submitReferral}
                disabled={!submitCode.trim()}
                className="h-9 px-3 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-40 text-cyan-200 text-xs font-semibold"
              >
                Kullan
              </button>
            </div>
            {submitMsg && (
              <div
                className={
                  submitMsg.ok
                    ? "mt-2 text-[11px] text-emerald-300"
                    : "mt-2 text-[11px] text-coral-400"
                }
              >
                {submitMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
