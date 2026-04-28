// Altyazı dışa aktarma yardımcıları: SRT/VTT üretimi ve tarayıcıdan indirme.

import type { TimelineClip } from "./mocks";

// Saniyeyi SRT zaman damgasına çevirir: "HH:MM:SS,mmm"
export function formatSrtTime(s: number): string {
  const total = Math.max(0, s);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  const millis = Math.round((total - Math.floor(total)) * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

// Saniyeyi WebVTT zaman damgasına çevirir: "HH:MM:SS.mmm"
export function formatVttTime(s: number): string {
  return formatSrtTime(s).replace(",", ".");
}

// Subtitle track klipleri için SRT içeriği üretir.
export function clipsToSrt(clips: TimelineClip[]): string {
  const subs = clips
    .filter((c) => c.trackId === "subtitle")
    .sort((a, b) => a.startTime - b.startTime);
  if (subs.length === 0) return "";
  const parts = subs.map((c, i) => {
    const start = formatSrtTime(c.startTime);
    const end = formatSrtTime(c.startTime + c.duration);
    const text = (c.text ?? "").trim() || "(boş altyazı)";
    return `${i + 1}\n${start} --> ${end}\n${text}\n`;
  });
  return parts.join("\n");
}

// Subtitle track klipleri için WebVTT içeriği üretir.
export function clipsToVtt(clips: TimelineClip[]): string {
  const subs = clips
    .filter((c) => c.trackId === "subtitle")
    .sort((a, b) => a.startTime - b.startTime);
  const header = "WEBVTT\n\n";
  if (subs.length === 0) return header;
  const parts = subs.map((c, i) => {
    const start = formatVttTime(c.startTime);
    const end = formatVttTime(c.startTime + c.duration);
    const text = (c.text ?? "").trim() || "(boş altyazı)";
    return `${i + 1}\n${start} --> ${end}\n${text}\n`;
  });
  return header + parts.join("\n");
}

// İçerği Blob olarak indirir. Sadece istemci tarafında çalışır.
export function downloadAsFile(content: string, filename: string, mime: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
