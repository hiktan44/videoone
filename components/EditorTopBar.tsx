"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle, Sparkles, Download, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { AutoSaver } from "@/components/AutoSaver";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    <header className="h-14 shrink-0 border-b border-zinc-900 bg-zinc-950 px-3 flex items-center gap-3">
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
          onClick={handleExport}
          title="Projeyi JSON olarak indir"
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
        >
          <Download className="h-3.5 w-3.5" />
          JSON İndir
        </button>
        <button
          onClick={handleImportClick}
          title="JSON dosyasından proje yükle"
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
        >
          <Upload className="h-3.5 w-3.5" />
          JSON Yükle
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-300 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          {credits} kredi
        </div>
        <button className="text-xs font-semibold rounded-lg px-3 py-1.5 bg-gradient-vibe text-white">
          Yükselt
        </button>
        <button className="h-9 w-9 rounded-lg hover:bg-zinc-900 flex items-center justify-center text-zinc-400">
          <HelpCircle className="h-4 w-4" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-vibe flex items-center justify-center text-xs font-semibold ml-1">
          H
        </div>
      </div>
    </header>
  );
}
