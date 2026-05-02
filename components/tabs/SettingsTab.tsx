"use client";

import { useStore } from "@/lib/store";
import { KIE_MODEL_FAMILIES, CATEGORY_LABEL_TR } from "@/lib/models";
import { KIE_CATALOG, type KieCategory } from "@/lib/kie-catalog";
import { Dropdown, type DropdownGroup } from "../Dropdown";
import clsx from "clsx";

const aspects = ["1:1", "16:9", "9:16", "4:3"];

// Belirli kategoriler grubu icin Dropdown gruplari uret.
function buildGroups(cats: KieCategory[]): DropdownGroup[] {
  const groups: DropdownGroup[] = [];
  for (const c of cats) {
    const opts = KIE_CATALOG.filter((e) => e.category === c).map((e) => e.display);
    if (opts.length > 0) groups.push({ label: CATEGORY_LABEL_TR[c], options: opts });
  }
  return groups;
}

const IMAGE_GROUPS = buildGroups([
  "image", "image-edit", "image-to-image", "upscale", "background-removal", "reframe",
]);
const VIDEO_GROUPS = buildGroups([
  "video", "image-to-video", "video-extend", "video-edit", "lipsync", "video-upscale",
]);
const VOICE_GROUPS = (() => {
  const dynamic = buildGroups(["voice", "tts", "speech-to-text"]);
  if (dynamic.length === 0) {
    return [{ label: "Klasik Sesler", options: KIE_MODEL_FAMILIES.voice as string[] }];
  }
  return dynamic;
})();
const MUSIC_GROUPS = buildGroups(["music", "audio-effect"]);

export function SettingsTab() {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSetting);

  return (
    <div className="p-3 space-y-5 text-sm overflow-y-auto scrollbar-thin h-full pb-12">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">En-Boy Oranı</div>
        <div className="grid grid-cols-4 gap-1.5">
          {aspects.map((a) => (
            <button
              key={a}
              onClick={() => update("aspectRatio", a)}
              className={clsx(
                "py-1.5 rounded-md text-xs font-medium border transition-colors",
                settings.aspectRatio === a
                  ? "border-purple-500 bg-purple-500/15 text-white"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500">Global Stil</div>
          <button
            onClick={() => update("globalStyleEnabled", !settings.globalStyleEnabled)}
            className={clsx(
              "relative h-5 w-9 rounded-full transition-colors",
              settings.globalStyleEnabled ? "bg-gradient-vibe" : "bg-zinc-700"
            )}
          >
            <span
              className={clsx(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                settings.globalStyleEnabled ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
        <textarea
          value={settings.globalStyle}
          onChange={(e) => update("globalStyle", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          placeholder="Tüm sahnelerde uygulanacak görsel stil..."
        />
      </div>

      <FieldRow label={`Görsel Modeli (${KIE_MODEL_FAMILIES.image.length} model)`}>
        <Dropdown
          value={settings.imageModel}
          groups={IMAGE_GROUPS}
          onChange={(v) => update("imageModel", v)}
          size="sm"
          className="w-full"
          buttonClassName="w-full justify-between"
          searchable
        />
      </FieldRow>

      <FieldRow label={`Video Modeli (${KIE_MODEL_FAMILIES.video.length} model)`}>
        <Dropdown
          value={settings.videoModel}
          groups={VIDEO_GROUPS}
          onChange={(v) => update("videoModel", v)}
          size="sm"
          className="w-full"
          buttonClassName="w-full justify-between"
          searchable
        />
      </FieldRow>

      <FieldRow label={`Ses Modeli (${KIE_MODEL_FAMILIES.voice.length} model)`}>
        <Dropdown
          value={settings.voiceModel}
          groups={VOICE_GROUPS}
          onChange={(v) => update("voiceModel", v)}
          size="sm"
          className="w-full"
          buttonClassName="w-full justify-between"
          searchable
        />
      </FieldRow>

      <FieldRow label={`Müzik Modeli (${KIE_MODEL_FAMILIES.music.length} model)`}>
        <Dropdown
          value={settings.musicModel}
          groups={MUSIC_GROUPS}
          onChange={(v) => update("musicModel", v)}
          size="sm"
          className="w-full"
          buttonClassName="w-full justify-between"
          searchable
        />
      </FieldRow>

      <FieldRow label="Dil">
        <Dropdown
          value={settings.language}
          options={KIE_MODEL_FAMILIES.language as unknown as string[]}
          onChange={(v) => update("language", v)}
          size="sm"
          className="w-full"
          buttonClassName="w-full justify-between"
        />
      </FieldRow>

      <FieldRow label="Dalga Formu Görüntüsü">
        <Dropdown
          value={settings.waveform}
          options={KIE_MODEL_FAMILIES.waveform as unknown as string[]}
          onChange={(v) => update("waveform", v)}
          size="sm"
          className="w-full"
          buttonClassName="w-full justify-between"
        />
      </FieldRow>

      <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
        Toplam {KIE_CATALOG.length} AI modeli yüklendi.
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">{label}</div>
      {children}
    </div>
  );
}
