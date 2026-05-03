// Dahili (built-in) örnek şablonlar — kullanıcı şablonu yoksa galeriyi doldurur.
// Şablonu açtığında editöre kopya proje olarak yüklenir.

import type { Project } from "./mocks";

export type BuiltinTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  gradient: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  // Editör'e dökülecek "starter" prompt — kullanıcı düzenleyebilir
  starterPrompt: string;
  duration: number;
  aspectRatio: string;
  videoModel?: string;
  globalStyle?: string;
};

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    id: "tpl-product-launch",
    name: "Ürün Lansmanı",
    category: "Pazarlama",
    description: "Yeni ürünün dramatik tanıtımı — sinematik close-up + hızlı kesimler.",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    starterPrompt:
      "Lüks bir ürünün stüdyo çekimi. Dönen platform üzerinde yumuşak ışıkla aydınlatılmış. Cinematic 4K, shallow depth of field, premium feel.",
    duration: 30,
    aspectRatio: "16:9",
    videoModel: "Veo 3.1 Fast",
    globalStyle: "cinematic 4k, premium product photography, soft studio lighting, shallow depth of field",
  },
  {
    id: "tpl-instagram-reel",
    name: "Instagram Reel",
    category: "Sosyal Medya",
    description: "Dikey 9:16 format — enerjik, hızlı geçişli sosyal medya videosu.",
    gradient: "from-fuchsia-500 via-pink-500 to-rose-500",
    starterPrompt:
      "Genç bir kadın güzel bir kafede laptop ile çalışıyor, cam dış mekan, yumuşak gün ışığı, akıcı kamera hareketi.",
    duration: 15,
    aspectRatio: "9:16",
    videoModel: "Kling 3.0 Pro",
    globalStyle: "vibrant, energetic, social media ready, vertical 9:16, modern",
  },
  {
    id: "tpl-tiktok-trend",
    name: "TikTok Trend",
    category: "Sosyal Medya",
    description: "9:16 hızlı kesimler, dikkat çekici açılış — tüketim hızlı izleyici için.",
    gradient: "from-cyan-400 via-blue-500 to-purple-600",
    starterPrompt:
      "Renkli neon ışıklı şehir gece sokağı, hareketli kalabalık, kameranın yanından geçen ışık çizgileri, ritmik geçişler.",
    duration: 15,
    aspectRatio: "9:16",
    videoModel: "Kling 3.0 Pro",
    globalStyle: "neon, cyberpunk, fast cuts, trending, vibrant colors",
  },
  {
    id: "tpl-istanbul-tour",
    name: "İstanbul Tanıtım",
    category: "Seyahat",
    description: "Şehir manzaraları, drone çekimleri ve tarihi yapılar — turistik tanıtım filmi.",
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    starterPrompt:
      "İstanbul Boğaz manzarası gün batımında. Kız Kulesi siluetinden başlayıp drone ile Galata Köprüsü'ne uzanan plan. Sıcak altın ışık, sinematik renk gradesi.",
    duration: 60,
    aspectRatio: "16:9",
    videoModel: "Veo 3.1 Fast",
    globalStyle: "cinematic travel documentary, golden hour, drone shots, warm color grading, atmospheric",
  },
  {
    id: "tpl-restaurant-menu",
    name: "Restoran Menüsü",
    category: "Yemek & İçecek",
    description: "Yemek close-up'ları, buhar efektleri, iştah açıcı sunumlar.",
    gradient: "from-amber-600 via-red-500 to-orange-600",
    starterPrompt:
      "Sıcak Türk kahvesi fincanı, yanında lokum. Yavaş çekimde buhar yükseliyor. Sıcak ışık, sığ alan derinliği, food photography.",
    duration: 20,
    aspectRatio: "1:1",
    videoModel: "Kling 3.0 Pro",
    globalStyle: "appetizing food photography, warm lighting, steam, slow motion, premium restaurant",
  },
  {
    id: "tpl-fashion-lookbook",
    name: "Moda Lookbook",
    category: "Moda",
    description: "Modelin podyum yürüyüşü tarzı — stil odaklı, dramatik aydınlatma.",
    gradient: "from-purple-600 via-pink-500 to-fuchsia-500",
    starterPrompt:
      "Modaevin podyum çekimi, bir model siyah tasarım elbise ile yürüyor. Dramatik üst aydınlatma, beyaz arka plan, slow motion saç hareketi.",
    duration: 30,
    aspectRatio: "9:16",
    videoModel: "Kling 3.0 Pro",
    globalStyle: "high fashion editorial, dramatic lighting, slow motion, minimalist background, vogue style",
  },
  {
    id: "tpl-realestate",
    name: "Emlak Sunumu",
    category: "Emlak",
    description: "Lüks konutların iç + dış mekan turu — sakin, profesyonel.",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    starterPrompt:
      "Modern lüks villanın iç mekan turu. Geniş açılı kamera salondan başlayıp panoramik denizi gören cam terasa kadar akıcı şekilde ilerliyor. Doğal ışık, sıcak altın saat.",
    duration: 60,
    aspectRatio: "16:9",
    videoModel: "Veo 3.1 Fast",
    globalStyle: "real estate photography, wide angle, smooth camera movement, natural lighting, luxury",
  },
  {
    id: "tpl-startup-pitch",
    name: "Startup Pitch Intro",
    category: "İş",
    description: "Yatırımcı sunumunun başlangıç videosu — temiz, profesyonel.",
    gradient: "from-indigo-500 via-blue-600 to-cyan-500",
    starterPrompt:
      "Modern bir ofiste ekip toplantısı. Beyaz tahtada strateji çizimi, post-it notlar, dizüstü bilgisayarlar. Doğal ışık, sade renkler, profesyonel atmosfer.",
    duration: 30,
    aspectRatio: "16:9",
    videoModel: "Veo 3.1 Fast",
    globalStyle: "corporate, professional, clean, modern office, natural lighting, minimal",
  },
  {
    id: "tpl-music-video",
    name: "Müzik Klibi",
    category: "Sanat",
    description: "Sanatçı portresi + hareket — performans hissi, sinematik renk.",
    gradient: "from-rose-500 via-purple-600 to-indigo-600",
    starterPrompt:
      "Genç müzisyen sahnede mikrofon önünde, arka planda mor neon ışık, dumanın içinde duygusal ifade, yavaş çekim.",
    duration: 45,
    aspectRatio: "9:16",
    videoModel: "Kling 3.0 Pro",
    globalStyle: "music video, neon lighting, smoke, slow motion, emotional, cinematic",
  },
  {
    id: "tpl-fitness",
    name: "Fitness Motivasyon",
    category: "Spor",
    description: "Hızlı kesimler, kas gerginliği, ilham verici antrenman montajı.",
    gradient: "from-orange-500 via-red-500 to-rose-600",
    starterPrompt:
      "Spor salonunda atlet ağır halter kaldırıyor. Ter, kas gerginliği, dramatik gölgeler. Yan açıdan close-up, motivasyonel.",
    duration: 30,
    aspectRatio: "9:16",
    videoModel: "Kling 3.0 Pro",
    globalStyle: "intense workout, dramatic shadows, sweat, motivational, dark gym, athletic",
  },
  {
    id: "tpl-education",
    name: "Eğitim İçeriği",
    category: "Eğitim",
    description: "Konuyu anlatan profesyonel sunum tarzı — temiz arka plan.",
    gradient: "from-sky-500 via-cyan-500 to-emerald-500",
    starterPrompt:
      "Aydınlık modern bir sınıf ortamında öğretmen tahta önünde konu anlatıyor. Dikkat çekici grafik animasyonları havada beliriyor.",
    duration: 60,
    aspectRatio: "16:9",
    videoModel: "Veo 3.1 Fast",
    globalStyle: "educational, clean, professional, modern classroom, bright lighting, animated graphics",
  },
  {
    id: "tpl-nature-doc",
    name: "Doğa Belgeseli",
    category: "Belgesel",
    description: "Yaban hayatı close-up'ları + epik manzaralar — David Attenborough tarzı.",
    gradient: "from-green-600 via-emerald-500 to-teal-500",
    starterPrompt:
      "Sis kaplı dağ ormanında bir kartal süzülüyor. Drone takibi, sabah güneşinin altın ışığı, epik manzara.",
    duration: 60,
    aspectRatio: "16:9",
    videoModel: "Veo 3.1 Fast",
    globalStyle: "nature documentary, epic cinematography, golden hour, drone shots, atmospheric, BBC style",
  },
];

export function templateToProject(tpl: BuiltinTemplate): Omit<Project, "id"> {
  const now = Date.now();
  return {
    name: tpl.name,
    createdAt: now,
    updatedAt: now,
    gradient: tpl.gradient,
    thumbnailUrl: tpl.thumbnailUrl,
    previewUrl: tpl.previewUrl,
    clips: [],
    characters: [],
    chatMessages: [
      {
        id: `m-${now}`,
        author: "ai",
        text: `Şablon yüklendi: **${tpl.name}**\n\nÖneri prompt:\n_${tpl.starterPrompt}_\n\n"Senaryo Sihirbazı" ile sahnelere bölmek veya direkt üretim yapmak için sohbete yazın.`,
        time: "şimdi",
      },
    ],
    mediaItems: [],
    settings: {
      imageModel: "Seedream 4.5 Text-to-Image",
      videoModel: tpl.videoModel || "Veo 3.1 Fast",
      voiceModel: "InWorld 1.5 Max",
      musicModel: "Suno V4.5",
      language: "Türkçe",
      aspectRatio: tpl.aspectRatio,
      videoDuration: tpl.duration,
      videoResolution: "720p",
      waveform: "Sadece Aktif",
      globalStyleEnabled: true,
      globalStyle: tpl.globalStyle || "",
      captionsEnabled: true,
    },
  };
}

export function templateCategories(): string[] {
  return Array.from(new Set(BUILTIN_TEMPLATES.map((t) => t.category)));
}
