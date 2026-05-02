// Basit i18n — TR varsayilan, EN secenek. localStorage'da tutulur.

export type Locale = "tr" | "en";

export const LOCALES: Locale[] = ["tr", "en"];

export const t = {
  tr: {
    nav: {
      features: "Özellikler",
      howItWorks: "Nasıl Çalışır",
      pricing: "Fiyatlandırma",
      faq: "SSS",
      signin: "Giriş",
      start: "Ücretsiz başla",
    },
    hero: {
      badge: "Türkiye'nin AI video stüdyosu",
      titleA: "Bir cümle yaz,",
      titleB: "sinematik video",
      titleC: "üret",
      sub: "Doğal dilde komut ver, AI sahne sahne planlasın. Veo, Sora, Kling, Suno — hepsi tek arayüzde, dakikalar içinde.",
      cta: "100 kredi hediye — hemen başla",
      ctaSecondary: "Demo izle",
      microcopy: "Kart bilgisi gerekmez · Anında üretim · Türkçe destek",
      placeholder: "Bir video fikri yaz... örn. 'İstanbul'da gün batımında 15 saniyelik tanıtım'",
      tierFast: "Hızlı",
      tierPro: "Pro",
      tierMax: "Max",
    },
    stats: {
      generations: "Üretilen video",
      users: "Kullanıcı",
      models: "AI modeli",
      uptime: "Çalışma süresi",
    },
    features: {
      title: "Profesyonel video,",
      titleAccent: "dakikalar içinde",
      sub: "Sahneleme, üretim, edit, export — hepsi otomatik.",
      list: [
        {
          title: "Sohbet ederek üret",
          desc: "Türkçe konuş, AI sahne sahne planlasın. Format, süre, ton — sorularla kişiselleştir.",
        },
        {
          title: "130+ AI modeli",
          desc: "Veo 3.1, Kling 3.0, Seedance, Sora 2, Hailuo, Runway — hepsi tek arayüzde.",
        },
        {
          title: "Karakter & ses",
          desc: "Anlatıcı, model, müşteri karakterleri yarat. ElevenLabs ile fotogerçekçi ses.",
        },
        {
          title: "Suno ile müzik",
          desc: "Sahnelerine uygun arka müzik AI ile üretilsin, otomatik senkronize olsun.",
        },
        {
          title: "Sinematik timeline",
          desc: "Klipleri sürükle-bırak, kes, geçiş ekle. Profesyonel video editörü deneyimi.",
        },
        {
          title: "Tek tık export",
          desc: "16:9, 9:16, 1:1 — sosyal medyaya göre dışa aktar. Altyazı otomatik üretilir.",
        },
      ],
    },
    howItWorks: {
      eyebrow: "Nasıl çalışır",
      title: "Üç adımda video",
      steps: [
        {
          title: "Fikir paylaş",
          desc: "Konuyu Türkçe yaz veya bir referans yükle. AI eksik bilgileri kısa sorularla tamamlar.",
        },
        {
          title: "Sahneler oluşur",
          desc: "AI sinematik bir storyboard üretir. Her sahnenin prompt'u, kamera açısı, geçişi planlanır.",
        },
        {
          title: "Edit & yayınla",
          desc: "Timeline'da klipleri ayarla, müzik & altyazı ekle, MP4 indir veya kanaldan paylaş.",
        },
      ],
    },
    models: {
      eyebrow: "Modeller",
      title: "Sektörün en iyileri",
      sub: "Her ihtiyaca uygun model — sinematik, hızlı, ekonomik.",
    },
    useCases: {
      eyebrow: "Kullanım alanları",
      title: "Her sektör, her hikaye",
      list: [
        { title: "Sosyal medya", desc: "Reels, Shorts, TikTok için 9:16 dikey videolar" },
        { title: "E-ticaret", desc: "Ürün tanıtımı, reklam, marka videoları" },
        { title: "Eğitim", desc: "Anlatıcı sesli kurs videoları, açıklayıcı animasyonlar" },
        { title: "Pazarlama", desc: "Lansman, kampanya, etkinlik videoları" },
        { title: "Müzik", desc: "Lyric video, klip görselleştirme, mood video" },
        { title: "Sinema", desc: "Storyboard, kavram tanıtımı, kısa film" },
      ],
    },
    pricing: {
      eyebrow: "Fiyatlandırma",
      title: "Basit fiyatlandırma",
      sub: "İhtiyacına göre büyüt. İstediğin zaman iptal et.",
      perks: {
        free: ["5-10 video oluşturma", "Tüm temel modeller", "Türkçe arayüz", "Watermark'sız"],
        pro: [
          "Sinematik kaliteli modeller",
          "ElevenLabs Premium ses",
          "Öncelikli üretim",
          "Karakter sistemi",
          "Sınırsız MP4 export",
        ],
        max: [
          "Veo 3.1, Sora 2 Pro, Kling 3",
          "Suno V5 müzik üretimi",
          "Brand kit & şablonlar",
          "API erişimi",
          "Premium destek",
        ],
      },
      ctaFree: "Ücretsiz başla",
      ctaPro: "Pro'ya geç",
      ctaMax: "Max'a geç",
      popular: "En popüler",
      perMonth: "/ay",
      free: "ücretsiz",
      credits: "kredi/ay",
    },
    faq: {
      eyebrow: "Yardım",
      title: "Sıkça sorulan",
      list: [
        {
          q: "Vibe Studio nasıl çalışıyor?",
          a: "Türkçe bir prompt yazıyorsun. AI sana sorularla yardım ediyor: format, süre, stil. Sonra sahne sahne video, ses ve altyazı üretip timeline'a yerleştiriyor.",
        },
        {
          q: "Hangi AI modellerini kullanıyor?",
          a: "Görsel için Flux, Seedream, Imagen 4. Video için Veo 3.1, Kling 3.0, Seedance, Sora 2, Hailuo. Ses için ElevenLabs, InWorld. Müzik için Suno V5.",
        },
        {
          q: "Krediler nasıl harcanıyor?",
          a: "Hız/kalite katmanına göre değişir: Hızlı modda dakikası ~18 kredi, Pro modda ~190, Max modda ~600. 15s tanıtım Pro modda yaklaşık 50 kredi.",
        },
        {
          q: "Türkçe destek var mı?",
          a: "Evet — arayüz Türkçe, AI Türkçe konuşuyor, altyazı Türkçe çıkıyor. Video modellerine giden prompt'lar arka planda İngilizceye çevriliyor (kalite için).",
        },
        {
          q: "Ürettiğim videolar ticari kullanılabilir mi?",
          a: "Free planda kişisel kullanım, Pro ve Max planlarında ticari kullanım hakkı dahil. Lansman, reklam, sosyal medya — her yerde kullan.",
        },
        {
          q: "Üretim süresi ne kadar?",
          a: "Sahne başına 2-15 dakika sürebilir. Sayfayı kapatabilirsin, arka planda devam eder, geldiğinde Üretim Kuyruğu'nda görürsün.",
        },
      ],
    },
    cta: {
      title: "İlk videonu",
      titleAccent: "5 dakikada",
      titleEnd: "üret",
      sub: "100 kredi ile başla, kartsız kayıt ol.",
      btn: "Ücretsiz başla",
    },
    footer: {
      tagline: "Türkçe AI video stüdyosu",
      copyright: "Tüm hakları saklıdır",
      privacy: "Gizlilik",
      terms: "Kullanım Koşulları",
      contact: "İletişim",
    },
  },
  en: {
    nav: {
      features: "Features",
      howItWorks: "How it works",
      pricing: "Pricing",
      faq: "FAQ",
      signin: "Sign in",
      start: "Start free",
    },
    hero: {
      badge: "AI video studio",
      titleA: "Write a sentence,",
      titleB: "produce cinematic",
      titleC: "video",
      sub: "Give natural-language prompts, AI plans scene by scene. Veo, Sora, Kling, Suno — all in one place, in minutes.",
      cta: "100 free credits — start now",
      ctaSecondary: "Watch demo",
      microcopy: "No credit card · Instant generation · Multilingual",
      placeholder: "Write a video idea... e.g. '15-second product launch teaser at sunset'",
      tierFast: "Fast",
      tierPro: "Pro",
      tierMax: "Max",
    },
    stats: {
      generations: "Videos created",
      users: "Active users",
      models: "AI models",
      uptime: "Uptime",
    },
    features: {
      title: "Professional video,",
      titleAccent: "in minutes",
      sub: "Storyboarding, generation, editing, export — fully automated.",
      list: [
        {
          title: "Generate by chatting",
          desc: "Talk to AI, scene-by-scene planning. Format, duration, tone — personalized via questions.",
        },
        {
          title: "130+ AI models",
          desc: "Veo 3.1, Kling 3.0, Seedance, Sora 2, Hailuo, Runway — all in one interface.",
        },
        {
          title: "Characters & voice",
          desc: "Create narrator, model, customer characters. Photorealistic voice via ElevenLabs.",
        },
        {
          title: "Music with Suno",
          desc: "AI-generated background music tailored to your scenes, auto-synced.",
        },
        {
          title: "Cinematic timeline",
          desc: "Drag-drop clips, cut, add transitions. Professional video editor experience.",
        },
        {
          title: "One-click export",
          desc: "16:9, 9:16, 1:1 — export per social platform. Captions auto-generated.",
        },
      ],
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "Video in three steps",
      steps: [
        {
          title: "Share an idea",
          desc: "Write the topic or upload a reference. AI fills in the gaps with quick questions.",
        },
        {
          title: "Scenes appear",
          desc: "AI produces a cinematic storyboard. Each scene's prompt, camera, transition is planned.",
        },
        {
          title: "Edit & publish",
          desc: "Tweak clips on the timeline, add music & captions, download MP4 or share via channel.",
        },
      ],
    },
    models: {
      eyebrow: "Models",
      title: "Industry's best",
      sub: "A model for every need — cinematic, fast, economical.",
    },
    useCases: {
      eyebrow: "Use cases",
      title: "Every industry, every story",
      list: [
        { title: "Social media", desc: "9:16 vertical videos for Reels, Shorts, TikTok" },
        { title: "E-commerce", desc: "Product showcases, ads, brand videos" },
        { title: "Education", desc: "Narrated course videos, explainer animations" },
        { title: "Marketing", desc: "Launch, campaign, event videos" },
        { title: "Music", desc: "Lyric videos, music visualization, mood reels" },
        { title: "Cinema", desc: "Storyboards, concept teasers, short films" },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Simple pricing",
      sub: "Scale as you need. Cancel anytime.",
      perks: {
        free: ["5-10 video generations", "All basic models", "Multilingual UI", "Watermark-free"],
        pro: [
          "Cinematic-quality models",
          "ElevenLabs Premium voice",
          "Priority generation",
          "Character system",
          "Unlimited MP4 export",
        ],
        max: [
          "Veo 3.1, Sora 2 Pro, Kling 3",
          "Suno V5 music generation",
          "Brand kit & templates",
          "API access",
          "Premium support",
        ],
      },
      ctaFree: "Start free",
      ctaPro: "Go Pro",
      ctaMax: "Go Max",
      popular: "Most popular",
      perMonth: "/mo",
      free: "free",
      credits: "credits/mo",
    },
    faq: {
      eyebrow: "Help",
      title: "Frequently asked",
      list: [
        {
          q: "How does Vibe Studio work?",
          a: "You write a prompt. AI helps with questions: format, duration, style. Then it generates video, audio, captions scene by scene and places them on the timeline.",
        },
        {
          q: "Which AI models do you use?",
          a: "Visual: Flux, Seedream, Imagen 4. Video: Veo 3.1, Kling 3.0, Seedance, Sora 2, Hailuo. Voice: ElevenLabs, InWorld. Music: Suno V5.",
        },
        {
          q: "How are credits spent?",
          a: "Depends on speed/quality tier: Fast ~18 credits/min, Pro ~190, Max ~600. A 15s teaser in Pro mode costs ~50 credits.",
        },
        {
          q: "Is multilingual supported?",
          a: "Yes — UI, AI chat, captions all support Turkish & English. Prompts to video models auto-translate to English (for quality).",
        },
        {
          q: "Can I use generated videos commercially?",
          a: "Free plan: personal use. Pro & Max: full commercial rights. Use them in launches, ads, social — anywhere.",
        },
        {
          q: "How long does generation take?",
          a: "2-15 minutes per scene. You can close the page — it continues in background, see results in the Generation Queue when you return.",
        },
      ],
    },
    cta: {
      title: "Make your first video",
      titleAccent: "in 5 minutes",
      titleEnd: "",
      sub: "Start with 100 free credits, no card required.",
      btn: "Start free",
    },
    footer: {
      tagline: "AI video studio",
      copyright: "All rights reserved",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
    },
  },
};

export type Translations = typeof t.tr;

export function getTranslation(locale: Locale): Translations {
  return t[locale] as Translations;
}
