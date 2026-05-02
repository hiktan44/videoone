"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, HelpCircle, Sparkles, Download, Upload, Film, Globe, Loader2, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { AutoSaver } from "@/components/AutoSaver";
import { ExportModal } from "@/components/ExportModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  exportProjectAsJson,
  importProjectFromJson,
  upsertProject,
} from "@/lib/persistence";

export function EditorTopBar() {
  const router = useRouter();
  const name = useStore((s) => s.currentProjectName);
  const setName = useStore((s) => s.setCurrentProjectName);
  const credits = useStore((s) => s.credits);
  const exportCurrentAsProject = useStore((s) => s.exportCurrentAsProject);
  const [editing, setEditing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ ok: boolean; url?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const projectId = useStore((s) => s.projectId);

  const handlePublish = async () => {
    if (!projectId) {
      setPublishStatus({ ok: false });
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      });
      const data = await res.json();
      if (res.ok && data.publicUrl) {
        const fullUrl = window.location.origin + data.publicUrl;
        setPublishStatus({ ok: true, url: fullUrl });
        try {
          await navigator.clipboard.writeText(fullUrl);
        } catch {}
      } else {
        setPublishStatus({ ok: false });
        alert(data.error || "Yayınlama başarısız");
      }
    } catch (e) {
      setPublishStatus({ ok: false });
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishStatus(null), 4000);
    }
  };

  const handleExport = () => {
    try {
      const project = exportCurrentAsProject();
      const json = exportProjectAsJson(project);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (project.name || "vibe-projesi")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      a.download = `${safeName || "vibe-projesi"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.alert("JSON indirme başarısız oldu.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // Aynı dosya tekrar seçilebilsin
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importProjectFromJson(text);
      upsertProject(imported);
      router.push(`/editor/${imported.id}`);
    } catch (err) {
      window.alert("JSON okunamadı veya geçersiz bir proje dosyası.");
    }
  };

  return (
    <>
    <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    <header className="h-14 shrink-0 border-b border-ink-800 bg-ink-950 px-3 flex items-center gap-3">
      <Link
        href="/"
        className="h-9 w-9 rounded-lg hover:bg-zinc-900 flex items-center justify-center text-zinc-400"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="text-sm font-bold tracking-tight">
        <span className="text-gradient">Vibe Studio</span>
      </div>

      <div className="flex-1 flex items-center justify-center gap-3">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            className="bg-zinc-900 border border-zinc-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-[280px] text-center"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-zinc-200 hover:bg-zinc-900 px-3 py-1.5 rounded-lg max-w-[480px] truncate"
            title="Proje adını değiştirmek için tıklayın"
          >
            {name}
          </button>
        )}
        <AutoSaver />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePublish}
          disabled={publishing}
          title={publishStatus?.ok ? "Link kopyalandı" : "Public kanala yayınla"}
          className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 transition-colors disabled:opacity-50"
        >
          {publishing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : publishStatus?.ok ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Globe className="h-3.5 w-3.5" />
          )}
          {publishStatus?.ok ? "Link kopyalandı" : "Yayınla"}
        </button>
        <button
          onClick={() => setExportOpen(true)}
          title="MP4 olarak dışa aktar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-ink-950 transition-colors shadow-glow-amber"
        >
          <Film className="h-3.5 w-3.5" strokeWidth={2.5} />
          Export MP4
        </button>
        <button
          onClick={handleExport}
          title="Projeyi JSON olarak indir"
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-ink-300 hover:text-ink-50 px-2.5 py-1.5 rounded-lg bg-ink-900 border border-ink-700 hover:border-ink-600"
        >
          <Download className="h-3.5 w-3.5" />
          JSON
        </button>
        <button
          onClick={handleImportClick}
          title="JSON dosyasından proje yükle"
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-ink-300 hover:text-ink-50 px-2.5 py-1.5 rounded-lg bg-ink-900 border border-ink-700 hover:border-ink-600"
        >
          <Upload className="h-3.5 w-3.5" />
          Yükle
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-300 font-medium px-2.5 py-1.5 rounded-lg bg-ink-900 border border-ink-700">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          {credits}
        </div>
        <Link
          href="/pricing"
          className="text-xs font-semibold rounded-lg px-3 py-1.5 bg-gradient-amber text-ink-950 hover:opacity-90 transition-opacity"
        >
          Yükselt
        </Link>
        <ThemeToggle />
        <button className="h-9 w-9 rounded-lg hover:bg-ink-900 flex items-center justify-center text-ink-400">
          <HelpCircle className="h-4 w-4" />
        </button>
        <UserButton />
      </div>
    </header>
    </>
  );
}
