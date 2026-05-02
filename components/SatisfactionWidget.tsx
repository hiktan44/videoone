"use client";

import { useState } from "react";
import { Star, X, CheckCircle2 } from "lucide-react";

// Üretim sonrası gösterilen "Sonuçtan memnun musun?" mini widget'ı.
// 4-5 yıldız → +10 kredi (sunucu kontrol eder; bir job için bir kere).
export function SatisfactionWidget({ jobId, onClose }: { jobId?: string; onClose?: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ granted: number } | null>(null);
  const [comment, setComment] = useState("");

  if (done) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-emerald-500/30 bg-zinc-900 shadow-2xl p-4 text-zinc-100">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            Teşekkürler!{" "}
            {done.granted > 0 ? (
              <strong className="text-emerald-300">+{done.granted} kredi yatırıldı.</strong>
            ) : (
              "Geri bildiriminiz alındı."
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      setDone({ granted: data?.granted || 0 });
    } catch {
      setDone({ granted: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl p-4 text-zinc-100">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm font-medium">Sonuçtan memnun musun?</div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="text-[11px] text-zinc-400 mb-3">
        4-5 yıldız → <span className="text-amber-300">+10 kredi</span>
      </div>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-zinc-600"
              }`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Yorumun (opsiyonel)..."
          rows={2}
          className="w-full rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 px-2 py-1.5 focus:outline-none focus:border-purple-500/60 mb-2"
        />
      )}
      <button
        onClick={submit}
        disabled={!rating || submitting}
        className="w-full rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold py-1.5 disabled:opacity-50"
      >
        {submitting ? "Gönderiliyor..." : "Gönder"}
      </button>
    </div>
  );
}
