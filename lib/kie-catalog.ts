// Kie.ai gercek model katalogu (docs.kie.ai dokumantasyonundan otomatik turetildi).
// Faz 2 hotfix: tum modeller, dogru endpoint'ler, kategori gruplari.
// Kaynak: getting_started_with_kie_api dokumani (market/*, *-api/*).

export type KieFamily =
  | "jobs"
  | "veo"
  | "gpt4o"
  | "flux-kontext"
  | "suno"
  | "mj"
  | "runway"
  | "runway-aleph"
  | "udio"
  | "wav"
  | "chat"
  | "responses"
  | "other";

export type KieCategory =
  | "image"
  | "image-edit"
  | "image-to-image"
  | "upscale"
  | "background-removal"
  | "reframe"
  | "video"
  | "image-to-video"
  | "video-extend"
  | "video-edit"
  | "lipsync"
  | "video-upscale"
  | "voice"
  | "tts"
  | "speech-to-text"
  | "music"
  | "audio-effect"
  | "chat"
  | "other";

export type KieModelEntry = {
  display: string;
  family: KieFamily;
  modelId?: string;
  category: KieCategory;
  notes?: string;
};

export const KIE_CATALOG: KieModelEntry[] = [
  // --- IMAGE: Seedream ---
  { display: "Seedream V3", family: "jobs", modelId: "bytedance/seedream", category: "image" },
  { display: "Seedream V4 Text-to-Image", family: "jobs", modelId: "bytedance/seedream-v4-text-to-image", category: "image" },
  { display: "Seedream V4 Edit", family: "jobs", modelId: "bytedance/seedream-v4-edit", category: "image-edit", notes: "image-to-image gerektirir" },
  { display: "Seedream 4.5 Text-to-Image", family: "jobs", modelId: "seedream/4.5-text-to-image", category: "image" },
  { display: "Seedream 4.5 Edit", family: "jobs", modelId: "seedream/4.5-edit", category: "image-edit", notes: "image-to-image gerektirir" },
  { display: "Seedream 5 Lite Text-to-Image", family: "jobs", modelId: "seedream/5-lite-text-to-image", category: "image" },
  { display: "Seedream 5 Lite Image-to-Image", family: "jobs", modelId: "seedream/5-lite-image-to-image", category: "image-to-image", notes: "image-to-image gerektirir" },

  // --- IMAGE: Z-Image ---
  { display: "Z-Image", family: "jobs", modelId: "z-image", category: "image" },

  // --- IMAGE: Google ---
  { display: "Nano Banana 2", family: "jobs", modelId: "nano-banana-2", category: "image" },
  { display: "Imagen 4 Fast", family: "jobs", modelId: "google/imagen4-fast", category: "image" },
  { display: "Imagen 4 Ultra", family: "jobs", modelId: "google/imagen4-ultra", category: "image" },
  { display: "Imagen 4", family: "jobs", modelId: "google/imagen4", category: "image" },
  { display: "Nano Banana Edit", family: "jobs", modelId: "google/nano-banana-edit", category: "image-edit", notes: "image-to-image gerektirir" },
  { display: "Nano Banana", family: "jobs", modelId: "google/nano-banana", category: "image" },
  { display: "Nano Banana Pro Image-to-Image", family: "jobs", modelId: "nano-banana-pro", category: "image-to-image", notes: "image-to-image gerektirir" },

  // --- IMAGE: Flux 2 ---
  { display: "Flux 2 Pro Image-to-Image", family: "jobs", modelId: "flux-2/pro-image-to-image", category: "image-to-image", notes: "image-to-image gerektirir" },
  { display: "Flux 2 Pro Text-to-Image", family: "jobs", modelId: "flux-2/pro-text-to-image", category: "image" },
  { display: "Flux 2 Flex Image-to-Image", family: "jobs", modelId: "flux-2/flex-image-to-image", category: "image-to-image", notes: "image-to-image gerektirir" },
  { display: "Flux 2 Flex Text-to-Image", family: "jobs", modelId: "flux-2/flex-text-to-image", category: "image" },

  // --- IMAGE: Grok Imagine ---
  { display: "Grok Imagine Text-to-Image", family: "jobs", modelId: "grok-imagine/text-to-image", category: "image" },
  { display: "Grok Imagine Image-to-Image", family: "jobs", modelId: "grok-imagine/image-to-image", category: "image-to-image", notes: "image-to-image gerektirir" },

  // --- IMAGE: GPT Image ---
  { display: "GPT Image 1.5 Text-to-Image", family: "jobs", modelId: "gpt-image/1.5-text-to-image", category: "image" },
  { display: "GPT Image 1.5 Image-to-Image", family: "jobs", modelId: "gpt-image/1.5-image-to-image", category: "image-to-image", notes: "image-to-image gerektirir" },

  // --- IMAGE: Topaz / Recraft ---
  { display: "Topaz Image Upscale", family: "jobs", modelId: "topaz/image-upscale", category: "upscale", notes: "image input gerektirir" },
  { display: "Recraft Remove Background", family: "jobs", modelId: "recraft/remove-background", category: "background-removal", notes: "image input gerektirir" },
  { display: "Recraft Crisp Upscale", family: "jobs", modelId: "recraft/crisp-upscale", category: "upscale", notes: "image input gerektirir" },

  // --- IMAGE: Ideogram ---
  { display: "Ideogram V3 Reframe", family: "jobs", modelId: "ideogram/v3-reframe", category: "reframe", notes: "image input gerektirir" },
  { display: "Ideogram Character Edit", family: "jobs", modelId: "ideogram/character-edit", category: "image-edit", notes: "image input gerektirir" },
  { display: "Ideogram Character Remix", family: "jobs", modelId: "ideogram/character-remix", category: "image-edit", notes: "image input gerektirir" },
  { display: "Ideogram Character", family: "jobs", modelId: "ideogram/character", category: "image" },
  { display: "Ideogram V3 Text-to-Image", family: "jobs", modelId: "ideogram/v3-text-to-image", category: "image" },
  { display: "Ideogram V3 Edit", family: "jobs", modelId: "ideogram/v3-edit", category: "image-edit", notes: "image input gerektirir" },
  { display: "Ideogram V3 Remix", family: "jobs", modelId: "ideogram/v3-remix", category: "image-edit", notes: "image input gerektirir" },

  // --- IMAGE: Qwen ---
  { display: "Qwen Text-to-Image", family: "jobs", modelId: "qwen/text-to-image", category: "image" },
  { display: "Qwen Image-to-Image", family: "jobs", modelId: "qwen/image-to-image", category: "image-to-image", notes: "image-to-image gerektirir" },
  { display: "Qwen Image Edit", family: "jobs", modelId: "qwen/image-edit", category: "image-edit", notes: "image input gerektirir" },
  { display: "Qwen2 Image Edit", family: "jobs", modelId: "qwen2/image-edit", category: "image-edit", notes: "image input gerektirir" },
  { display: "Qwen2 Text-to-Image", family: "jobs", modelId: "qwen2/text-to-image", category: "image" },

  // --- IMAGE: 4o Image (ozel endpoint) ---
  { display: "GPT 4o Image", family: "gpt4o", category: "image", notes: "POST /api/v1/gpt4o-image/generate" },

  // --- IMAGE: Flux Kontext ---
  { display: "Flux Kontext Pro", family: "flux-kontext", modelId: "flux-kontext-pro", category: "image-edit", notes: "POST /api/v1/flux/kontext/generate" },
  { display: "Flux Kontext Max", family: "flux-kontext", modelId: "flux-kontext-max", category: "image-edit", notes: "POST /api/v1/flux/kontext/generate" },

  // --- IMAGE: Wan 2.7 (image) ---
  { display: "Wan 2.7 Image", family: "jobs", modelId: "wan/2-7-image", category: "image" },
  { display: "Wan 2.7 Image Pro", family: "jobs", modelId: "wan/2-7-image-pro", category: "image" },

  // --- VIDEO: Grok Imagine (aspect_ratio/duration gondermeden — kie.ts'te handle ediliyor) ---
  { display: "Grok Imagine Text-to-Video", family: "jobs", modelId: "grok-imagine/text-to-video", category: "video" },
  { display: "Grok Imagine Image-to-Video", family: "jobs", modelId: "grok-imagine/image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Grok Imagine Upscale", family: "jobs", modelId: "grok-imagine/upscale", category: "video-upscale", notes: "task_id input gerektirir" },
  { display: "Grok Imagine Extend", family: "jobs", modelId: "grok-imagine/extend", category: "video-extend", notes: "task_id input gerektirir" },

  // --- VIDEO: Kling ---
  { display: "Kling 2.6 Text-to-Video", family: "jobs", modelId: "kling-2.6/text-to-video", category: "video" },
  { display: "Kling 2.6 Image-to-Video", family: "jobs", modelId: "kling-2.6/image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Kling 2.5 Turbo Image-to-Video Pro", family: "jobs", modelId: "kling/v2-5-turbo-image-to-video-pro", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Kling 2.5 Turbo Text-to-Video Pro", family: "jobs", modelId: "kling/v2-5-turbo-text-to-video-pro", category: "video" },
  { display: "Kling AI Avatar Standard", family: "jobs", modelId: "kling/ai-avatar-standard", category: "lipsync", notes: "image + audio input gerektirir" },
  { display: "Kling AI Avatar Pro", family: "jobs", modelId: "kling/ai-avatar-pro", category: "lipsync", notes: "image + audio input gerektirir" },
  { display: "Kling 2.1 Master Image-to-Video", family: "jobs", modelId: "kling/v2-1-master-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Kling 2.1 Master Text-to-Video", family: "jobs", modelId: "kling/v2-1-master-text-to-video", category: "video" },
  { display: "Kling 2.1 Pro", family: "jobs", modelId: "kling/v2-1-pro", category: "video" },
  { display: "Kling 2.1 Standard", family: "jobs", modelId: "kling/v2-1-standard", category: "video" },
  { display: "Kling 2.6 Motion Control", family: "jobs", modelId: "kling-2.6/motion-control", category: "image-to-video", notes: "motion control video gerektirir" },
  { display: "Kling 3.0 Motion Control", family: "jobs", modelId: "kling-3.0/motion-control", category: "image-to-video", notes: "motion control video gerektirir" },
  // Kling 3.0: kling-3.0/video modelId + sound:true REQUIRED — kie.ts'te handle ediliyor
  { display: "Kling 3.0", family: "jobs", modelId: "kling-3.0", category: "video" },
  { display: "Kling 3.0 Video", family: "jobs", modelId: "kling-3.0/video", category: "video-edit", notes: "video input gerektirir" },

  // --- VIDEO: ByteDance / Seedance ---
  { display: "Seedance 2", family: "jobs", modelId: "bytedance/seedance-2", category: "video" },
  { display: "Seedance 2 Fast", family: "jobs", modelId: "bytedance/seedance-2-fast", category: "video" },
  // Seedance 1.5 Pro: duration enum "8" veya "12" — kie.ts'te handle ediliyor
  { display: "Seedance 1.5 Pro", family: "jobs", modelId: "bytedance/seedance-1.5-pro", category: "video" },
  { display: "Seedance V1 Pro Fast Image-to-Video", family: "jobs", modelId: "bytedance/v1-pro-fast-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Seedance V1 Pro Image-to-Video", family: "jobs", modelId: "bytedance/v1-pro-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Seedance V1 Pro Text-to-Video", family: "jobs", modelId: "bytedance/v1-pro-text-to-video", category: "video" },
  { display: "Seedance V1 Lite Image-to-Video", family: "jobs", modelId: "bytedance/v1-lite-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Seedance V1 Lite Text-to-Video", family: "jobs", modelId: "bytedance/v1-lite-text-to-video", category: "video" },

  // --- VIDEO: Hailuo ---
  { display: "Hailuo 2.3 Image-to-Video Pro", family: "jobs", modelId: "hailuo/2-3-image-to-video-pro", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Hailuo 2.3 Image-to-Video Standard", family: "jobs", modelId: "hailuo/2-3-image-to-video-standard", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Hailuo 02 Text-to-Video Pro", family: "jobs", modelId: "hailuo/02-text-to-video-pro", category: "video" },
  { display: "Hailuo 02 Image-to-Video Pro", family: "jobs", modelId: "hailuo/02-image-to-video-pro", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Hailuo 02 Text-to-Video Standard", family: "jobs", modelId: "hailuo/02-text-to-video-standard", category: "video" },
  { display: "Hailuo 02 Image-to-Video Standard", family: "jobs", modelId: "hailuo/02-image-to-video-standard", category: "image-to-video", notes: "image input gerektirir" },

  // --- VIDEO: Sora 2 (resolution ile body shape ozel — kie.ts'te handle ediliyor) ---
  { display: "Sora 2 Image-to-Video", family: "jobs", modelId: "sora-2-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Sora 2 Text-to-Video", family: "jobs", modelId: "sora-2-text-to-video", category: "video" },
  { display: "Sora 2 Pro Image-to-Video", family: "jobs", modelId: "sora-2-pro-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Sora 2 Pro Text-to-Video", family: "jobs", modelId: "sora-2-pro-text-to-video", category: "video" },
  { display: "Sora Watermark Remover", family: "jobs", modelId: "sora-watermark-remover", category: "video-edit", notes: "video input gerektirir" },
  { display: "Sora 2 Pro Storyboard", family: "jobs", modelId: "sora-2-pro-storyboard", category: "video", notes: "shots dizisi gerektirir" },
  { display: "Sora 2 Characters", family: "jobs", modelId: "sora-2-characters", category: "image-to-video", notes: "character video gerektirir" },
  { display: "Sora 2 Characters Pro", family: "jobs", modelId: "sora-2-characters-pro", category: "image-to-video", notes: "character video gerektirir" },

  // --- VIDEO: Wan ---
  { display: "Wan 2.2 A14B Image-to-Video Turbo", family: "jobs", modelId: "wan/2-2-a14b-image-to-video-turbo", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Wan 2.2 A14B Speech-to-Video Turbo", family: "jobs", modelId: "wan/2-2-a14b-speech-to-video-turbo", category: "lipsync", notes: "speech audio gerektirir" },
  { display: "Wan 2.2 A14B Text-to-Video Turbo", family: "jobs", modelId: "wan/2-2-a14b-text-to-video-turbo", category: "video" },
  { display: "Wan 2.2 Animate Move", family: "jobs", modelId: "wan/2-2-animate-move", category: "video-edit", notes: "video input gerektirir" },
  { display: "Wan 2.2 Animate Replace", family: "jobs", modelId: "wan/2-2-animate-replace", category: "video-edit", notes: "video input gerektirir" },
  { display: "Wan 2.6 Image-to-Video", family: "jobs", modelId: "wan/2-6-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Wan 2.6 Text-to-Video", family: "jobs", modelId: "wan/2-6-text-to-video", category: "video" },
  { display: "Wan 2.6 Video-to-Video", family: "jobs", modelId: "wan/2-6-video-to-video", category: "video-edit", notes: "video input gerektirir" },
  { display: "Wan 2.6 Flash Image-to-Video", family: "jobs", modelId: "wan/2-6-flash-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Wan 2.6 Flash Video-to-Video", family: "jobs", modelId: "wan/2-6-flash-video-to-video", category: "video-edit", notes: "video input gerektirir" },
  { display: "Wan 2.5 Image-to-Video", family: "jobs", modelId: "wan/2-5-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Wan 2.5 Text-to-Video", family: "jobs", modelId: "wan/2-5-text-to-video", category: "video" },
  { display: "Wan 2.7 Text-to-Video", family: "jobs", modelId: "wan/2-7-text-to-video", category: "video" },
  { display: "Wan 2.7 Image-to-Video", family: "jobs", modelId: "wan/2-7-image-to-video", category: "image-to-video", notes: "image input gerektirir" },
  { display: "Wan 2.7 VideoEdit", family: "jobs", modelId: "wan/2-7-videoedit", category: "video-edit", notes: "video input gerektirir" },
  { display: "Wan 2.7 R2V", family: "jobs", modelId: "wan/2-7-r2v", category: "video", notes: "reference image gerektirir" },

  // --- VIDEO: Topaz ---
  { display: "Topaz Video Upscale", family: "jobs", modelId: "topaz/video-upscale", category: "video-upscale", notes: "video input gerektirir" },

  // --- LIPSYNC: Infinitalk ---
  { display: "Infinitalk From Audio", family: "jobs", modelId: "infinitalk/from-audio", category: "lipsync", notes: "audio + image input gerektirir" },

  // --- VIDEO: Runway ---
  { display: "Runway Generate (5s)", family: "runway", modelId: "runway-duration-5-generate", category: "video", notes: "POST /api/v1/runway/generate" },
  { display: "Runway Extend Video", family: "runway", category: "video-extend", notes: "POST /api/v1/runway/extend, taskId gerektirir" },
  { display: "Runway Aleph Video-to-Video", family: "runway-aleph", category: "video-edit", notes: "POST /api/v1/aleph/generate, video input gerektirir" },

  // --- VIDEO: Veo 3 ---
  { display: "Veo 3.1 Fast", family: "veo", modelId: "veo3_fast", category: "video", notes: "POST /api/v1/veo/generate" },
  { display: "Veo 3.1 Extend", family: "veo", modelId: "fast", category: "video-extend", notes: "POST /api/v1/veo/extend, taskId gerektirir" },

  // --- AUDIO: ElevenLabs ---
  { display: "ElevenLabs Audio Isolation", family: "jobs", modelId: "elevenlabs/audio-isolation", category: "audio-effect", notes: "audio input gerektirir" },
  { display: "ElevenLabs Sound Effect V2", family: "jobs", modelId: "elevenlabs/sound-effect-v2", category: "audio-effect" },
  { display: "ElevenLabs Speech-to-Text", family: "jobs", modelId: "elevenlabs/speech-to-text", category: "speech-to-text", notes: "audio input gerektirir" },
  { display: "ElevenLabs Text-to-Dialogue V3", family: "jobs", modelId: "elevenlabs/text-to-dialogue-v3", category: "tts" },
  { display: "ElevenLabs TTS Multilingual V2", family: "jobs", modelId: "elevenlabs/text-to-speech-multilingual-v2", category: "tts" },
  { display: "ElevenLabs TTS Turbo 2.5", family: "jobs", modelId: "elevenlabs/text-to-speech-turbo-2-5", category: "tts" },

  // --- CHAT / LLM ---
  { display: "GPT-5-2", family: "chat", modelId: "gpt-5-2", category: "chat", notes: "POST /gpt-5-2/v1/chat/completions" },
  { display: "GPT-5-4", family: "responses", modelId: "gpt-5-4", category: "chat", notes: "POST /codex/v1/responses" },
  { display: "Claude Haiku 4.5", family: "chat", modelId: "claude-haiku-4-5", category: "chat" },
  { display: "Claude Opus 4.5", family: "chat", modelId: "claude-opus-4-5", category: "chat" },
  { display: "Claude Opus 4.6", family: "chat", modelId: "claude-opus-4-6", category: "chat" },
  { display: "Claude Sonnet 4.5", family: "chat", modelId: "claude-sonnet-4-5", category: "chat" },
  { display: "Claude Sonnet 4.6", family: "chat", modelId: "claude-sonnet-4-6", category: "chat" },
  { display: "Gemini 2.5 Pro", family: "chat", modelId: "gemini-2.5-pro", category: "chat" },
  { display: "Gemini 3 Pro", family: "chat", modelId: "gemini-3-pro", category: "chat" },
  { display: "Gemini 3.1 Pro", family: "chat", modelId: "gemini-3.1-pro", category: "chat" },
  { display: "Gemini 2.5 Flash", family: "chat", modelId: "gemini-2.5-flash", category: "chat" },
  { display: "Gemini 3 Flash", family: "chat", modelId: "gemini-2.5-flash", category: "chat", notes: "gemini-3-flash dokumanindan" },
  { display: "Gemini 3 Flash V1Beta", family: "chat", modelId: "gemini-2.5-flash", category: "chat", notes: "gemini-3-flash-v1beta dokumanindan" },
  { display: "GPT Codex", family: "responses", modelId: "gpt-5.1-codex", category: "chat" },

  // --- MUSIC: Suno ---
  { display: "Suno V4 Generate Music", family: "suno", modelId: "V4", category: "music", notes: "POST /api/v1/generate" },
  { display: "Suno V4 Extend Music", family: "suno", modelId: "V4", category: "music", notes: "POST /api/v1/generate/extend, audioId gerektirir" },
  { display: "Suno V4 Upload & Cover Audio", family: "suno", modelId: "V4", category: "music", notes: "POST /api/v1/generate/upload-cover" },
  { display: "Suno V4 Upload & Extend Audio", family: "suno", modelId: "V4", category: "music", notes: "POST /api/v1/generate/upload-extend" },
  { display: "Suno V4.5 Plus Add Instrumental", family: "suno", modelId: "V4_5PLUS", category: "music", notes: "POST /api/v1/generate/add-instrumental" },
  { display: "Suno V4.5 Plus Add Vocals", family: "suno", modelId: "V4_5PLUS", category: "music", notes: "POST /api/v1/generate/add-vocals" },
  { display: "Suno Boost Music Style", family: "suno", category: "music", notes: "POST /api/v1/style/generate" },
  { display: "Suno Cover", family: "suno", category: "music", notes: "POST /api/v1/suno/cover/generate" },
  { display: "Suno Replace Section", family: "suno", category: "music", notes: "POST /api/v1/generate/replace-section" },
  { display: "Suno Generate Persona", family: "suno", category: "music", notes: "POST /api/v1/generate/generate-persona" },
  { display: "Suno Generate Mashup", family: "suno", category: "music", notes: "POST /api/v1/generate/mashup" },
  { display: "Suno Generate Lyrics", family: "suno", category: "music", notes: "POST /api/v1/lyrics" },
  { display: "Suno Convert to WAV", family: "wav", category: "music", notes: "POST /api/v1/wav/generate" },
  { display: "Suno Separate Vocals", family: "suno", category: "audio-effect", notes: "POST /api/v1/vocal-removal/generate" },
  { display: "Suno Generate MIDI", family: "suno", category: "music", notes: "POST /api/v1/midi/generate" },
  { display: "Suno Create Music Video", family: "suno", category: "video", notes: "POST /api/v1/mp4/generate" },
  { display: "Suno V5 Generate Sounds", family: "suno", modelId: "V5", category: "audio-effect", notes: "POST /api/v1/generate/sounds" },
];

// Yardimci fonksiyonlar -----------------------------------------------------

export function groupByCategory(): Record<KieCategory, KieModelEntry[]> {
  const acc = {} as Record<KieCategory, KieModelEntry[]>;
  for (const entry of KIE_CATALOG) {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
  }
  return acc;
}

export function findEntry(display: string): KieModelEntry | undefined {
  return KIE_CATALOG.find((entry) => entry.display === display);
}

export function findByModelId(modelId: string): KieModelEntry | undefined {
  return KIE_CATALOG.find((entry) => entry.modelId === modelId);
}

export function listFamilies(): KieFamily[] {
  return Array.from(new Set(KIE_CATALOG.map((entry) => entry.family)));
}
