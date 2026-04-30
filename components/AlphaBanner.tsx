"use client";

import { AlertTriangle } from "lucide-react";

type Props = {
  text: string;
  variant?: "amber" | "blue";
};

// Faz 0: Henuz tam fonksiyonel olmayan ozelliklerin ustune kucuk bir uyari bandi gosterir.
export function AlphaBanner({ text, variant = "amber" }: Props) {
  const colors =
    variant === "blue"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-200/90"
      : "border-amber-500/30 bg-amber-500/10 text-amber-200/90";
  const iconColor = variant === "blue" ? "text-blue-400" : "text-amber-400";
  return (
    <div className={`mx-3 mt-3 rounded-lg border ${colors} px-2.5 py-2 flex items-start gap-2`}>
      <AlertTriangle className={`h-3.5 w-3.5 ${iconColor} mt-0.5 shrink-0`} />
      <div className="text-[11px] leading-snug">{text}</div>
    </div>
  );
}
