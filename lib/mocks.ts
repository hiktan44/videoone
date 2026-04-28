// Veri tipleri ve başlangıç verileri.
// Faz 2'de timeline saniye-bazlı, projeler tam içerik tutar.

export type TrackId = "video" | "audio" | "subtitle";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
};

export type Character = {
  id: string;
  name: string;
  description: string;
  voiceModel: string;
  initials: string;
  color: string;
};

export type MediaItem = {
  id: string;
  kind: "image" | "video" | "audio" | "speech";
  title: string;
  duration: string;
  gradient: string;
  sourceUrl?: string;
};

export type TimelineClip = {
  id: string;
  trackId: TrackId;
  label: string;
  startTime: number; // saniye
  duration: number; // saniye
  gradient?: string;
  sourceUrl?: string; // gerçek asset URL'si (Kie.ai sonucu)
  thumbnailUrl?: string;
  text?: string; // altyazı içeriği (subtitle track için)
};

export type Settings = {
  imageModel: string;
  videoModel: string;
  voiceModel: string;
  musicModel: string;
  language: string;
  aspectRatio: string;
  videoDuration: number; // saniye (3-15 arasi, model destegine bagli)
  videoResolution: string; // "720p" | "1080p" | "4K"
  waveform: string;
  globalStyleEnabled: boolean;
  globalStyle: string;
  captionsEnabled: boolean;
};

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  gradient: string;
  // tam içerik
  clips: TimelineClip[];
  characters: Character[];
  chatMessages: ChatMessage[];
  mediaItems: MediaItem[];
  settings: Settings;
  // Türetilen
  updatedLabel?: string;
};

// --- Başlangıç (mock) verileri ---

export const MOCK_CHAT: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content:
      "İstanbul'da gün batımında çekilmiş 15 saniyelik kısa bir tanıtım videosu hazırla.",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Harika bir fikir! Boğaz manzaralı, sıcak tonlarda bir storyboard hazırladım. 4 sahneye böldüm ve anlatıcı sesi ekledim. Önizlemeyi sağ tarafta görebilirsiniz.",
    meta: "42 saniye çalıştı · 2 dakika önce",
  },
  {
    id: "m3",
    role: "user",
    content: "Müzik biraz daha enerjik olabilir mi?",
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Müziği elektronik altyapılı, 110 BPM tempolu bir parça ile değiştirdim. Sahne geçişlerini de ritme uyacak şekilde güncelledim.",
    meta: "18 saniye çalıştı · 1 dakika önce",
  },
  {
    id: "m5",
    role: "user",
    content: "Son sahneye logoyu ekleyebilir misin?",
  },
];

export const MOCK_CHARACTERS: Character[] = [
  { id: "c1", name: "Anlatıcı", description: "Sıcak, profesyonel erkek anlatıcı", voiceModel: "InWorld 1.5 Max", initials: "AN", color: "from-purple-500 to-pink-500" },
  { id: "c2", name: "Moda Tasarımcısı", description: "Genç, dinamik kadın karakter", voiceModel: "Eleven Labs V3", initials: "MT", color: "from-rose-500 to-orange-500" },
  { id: "c3", name: "AI Model", description: "Foto-gerçekçi sanal model", voiceModel: "Eleven Labs Turbo", initials: "AI", color: "from-blue-500 to-cyan-500" },
  { id: "c4", name: "E-ticaret Müşterisi", description: "Memnun müşteri yorumu için karakter", voiceModel: "InWorld 1.5 Max", initials: "EM", color: "from-emerald-500 to-teal-500" },
];

export const MOCK_MEDIA: MediaItem[] = [
  { id: "md1", kind: "video", title: "Sahne 1 - Açılış", duration: "11s", gradient: "from-purple-500 to-pink-500" },
  { id: "md2", kind: "video", title: "Sahne 2 - Ürün", duration: "9s", gradient: "from-blue-500 to-indigo-500" },
  { id: "md3", kind: "image", title: "Logo Görseli", duration: "—", gradient: "from-amber-500 to-rose-500" },
  { id: "md4", kind: "speech", title: "Anlatıcı - Giriş", duration: "8s", gradient: "from-emerald-500 to-teal-500" },
  { id: "md5", kind: "audio", title: "Arkaplan Müziği", duration: "16s", gradient: "from-fuchsia-500 to-purple-500" },
  { id: "md6", kind: "video", title: "Sahne 3 - Kapanış", duration: "12s", gradient: "from-sky-500 to-blue-500" },
];

// Saniye bazlı timeline klipleri.
export const MOCK_CLIPS: TimelineClip[] = [
  { id: "tc1", trackId: "video", label: "Sahne 1", startTime: 0, duration: 4.5, gradient: "from-purple-500 to-pink-500" },
  { id: "tc2", trackId: "video", label: "Sahne 2", startTime: 4.5, duration: 3.5, gradient: "from-blue-500 to-indigo-500" },
  { id: "tc3", trackId: "video", label: "Sahne 3", startTime: 8.0, duration: 5.0, gradient: "from-emerald-500 to-teal-500" },
  { id: "tc4", trackId: "video", label: "Kapanış", startTime: 13.0, duration: 3.0, gradient: "from-amber-500 to-rose-500" },
  // Audio
  { id: "ta1", trackId: "audio", label: "Arkaplan Müzik", startTime: 0, duration: 16.0, gradient: "from-fuchsia-500 to-purple-500" },
  // Altyazılar
  { id: "ts1", trackId: "subtitle", label: "Altyazı", startTime: 0, duration: 4.5, text: "İstanbul'da yeni bir gün başlıyor", gradient: "from-blue-400 to-blue-600" },
  { id: "ts2", trackId: "subtitle", label: "Altyazı", startTime: 4.5, duration: 3.5, text: "Şehrin kalbi atıyor", gradient: "from-blue-400 to-blue-600" },
  { id: "ts3", trackId: "subtitle", label: "Altyazı", startTime: 8.0, duration: 5.0, text: "Boğaz'da gün batımı", gradient: "from-blue-400 to-blue-600" },
  { id: "ts4", trackId: "subtitle", label: "Altyazı", startTime: 13.0, duration: 3.0, text: "Vibe Studio ile keşfet", gradient: "from-blue-400 to-blue-600" },
];

export function defaultSettings(): Settings {
  // Varsayilan modelleri kataloga gore models.ts secer; burada baslangic degeri konur.
  return {
    imageModel: "Seedream 4.5 Text-to-Image",
    videoModel: "Google Veo 3.1 Fast",
    voiceModel: "InWorld 1.5 Max",
    musicModel: "Suno V4.5",
    language: "Türkçe",
    aspectRatio: "16:9",
    videoDuration: 5,
    videoResolution: "1080p",
    waveform: "Sadece Aktif",
    globalStyleEnabled: false,
    globalStyle: "Sinematik tonlar, sıcak ışıklandırma, Türk kültürüne uygun estetik.",
    captionsEnabled: true,
  };
}

export function makeSampleProject(name = "Yeni Vibe Projesi"): Project {
  const now = Date.now();
  return {
    id: `p${now}`,
    name,
    createdAt: now,
    updatedAt: now,
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    clips: structuredClone(MOCK_CLIPS),
    characters: structuredClone(MOCK_CHARACTERS),
    chatMessages: structuredClone(MOCK_CHAT),
    mediaItems: structuredClone(MOCK_MEDIA),
    settings: defaultSettings(),
  };
}

export const SAMPLE_PROJECTS_META: { name: string; gradient: string; ageMs: number }[] = [
  { name: "Sonbahar Moda Tanıtımı", gradient: "from-purple-500 via-pink-500 to-orange-400", ageMs: 5 * 60 * 1000 },
  { name: "Yeni Ürün Lansmanı", gradient: "from-blue-500 via-indigo-500 to-purple-500", ageMs: 60 * 60 * 1000 },
  { name: "İstanbul Şehir Turu", gradient: "from-emerald-500 via-teal-500 to-cyan-500", ageMs: 24 * 60 * 60 * 1000 },
  { name: "Restoran Menü Videosu", gradient: "from-amber-500 via-rose-500 to-pink-500", ageMs: 2 * 24 * 60 * 60 * 1000 },
  { name: "Eğitim İçeriği - Bölüm 3", gradient: "from-fuchsia-500 via-purple-500 to-indigo-500", ageMs: 3 * 24 * 60 * 60 * 1000 },
  { name: "Sosyal Medya Reels", gradient: "from-sky-500 via-blue-500 to-violet-500", ageMs: 7 * 24 * 60 * 60 * 1000 },
];

export function relativeLabel(updatedAt: number): string {
  const diff = Date.now() - updatedAt;
  const m = Math.round(diff / 60000);
  if (m < 1) return "Az önce düzenlendi";
  if (m < 60) return `${m} dakika önce düzenlendi`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} saat önce düzenlendi`;
  const d = Math.round(h / 24);
  if (d === 1) return "Dün düzenlendi";
  if (d < 7) return `${d} gün önce düzenlendi`;
  const w = Math.round(d / 7);
  return `${w} hafta önce düzenlendi`;
}
