// OpenAI Chat Completions tool tanımlamaları.
// Faz 2: Conversational onboarding + storyboard üretim tetikleme.

import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const CHAT_SYSTEM_PROMPT = `Sen Vibe Studio'nun Türkçe konuşan AI video asistanısın. Kullanıcıya kısa, dostça ve profesyonel cevaplar veriyorsun.

GÖREVİN:
1. Kullanıcı bir video fikri verdiğinde, eksik bilgileri öğrenmek için kısa sorular sor (her seferinde TEK soru):
   - Platform/format (16:9 yatay / 9:16 dikey / 1:1 kare)
   - Video süresi (15s, 30s, 60s veya özel)
   - Görsel stil (sinematik, animasyon, belgesel, reklam, ürün tanıtımı vb.)
   - Hedef kitle (genel, profesyonel, genç vb.)
   - Ton (ciddi, eğlenceli, duygusal, kurumsal)

2. Tüm gerekli bilgiler toplandığında "propose_storyboard" aracını çağır — kullanıcıya özet sun ve onay iste.

3. Kullanıcı "Evet, üret" dediğinde "start_generation" aracını çağır.

4. Üretim sırasında veya sonrasında düzenleme isteklerini ("3. sahneyi yeniden üret", "müziği değiştir") "regenerate_scene" veya "update_setting" araçlarıyla işle.

KURALLAR:
- Cevapların kısa olsun (1-3 cümle)
- Quick reply seçenekleri sunarken her zaman "select_quick_reply" aracını kullan
- Her sorunun yanında 3-4 öneri chip'i bulunsun
- Türkçe konuş, ama AI video modellerine giderken İngilizce prompt üret`;

export const CHAT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "select_quick_reply",
      description: "Kullanıcıya hızlı seçim chip'leri sunar (ör. format/süre/stil).",
      parameters: {
        type: "object",
        properties: {
          question_id: {
            type: "string",
            enum: ["platform", "duration", "style", "audience", "tone", "confirm"],
            description: "Hangi soru için chip'ler",
          },
          chips: {
            type: "array",
            items: { type: "string" },
            description: "Chip metinleri (3-5 adet)",
          },
        },
        required: ["question_id", "chips"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_storyboard",
      description:
        "Kullanıcıdan tüm gereken bilgi toplandığında, sahne taslağı önerir ve onay ister. Bu sadece özet — gerçek üretimi 'start_generation' tetikler.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Konu (Türkçe)" },
          totalDurationSec: { type: "integer", minimum: 10, maximum: 600 },
          aspectRatio: { type: "string", enum: ["16:9", "9:16", "1:1", "4:3"] },
          style: { type: "string", description: "Görsel stil özeti" },
          audience: { type: "string" },
          tone: { type: "string" },
          sceneCount: { type: "integer", minimum: 3, maximum: 20 },
        },
        required: ["topic", "totalDurationSec", "aspectRatio", "style", "sceneCount"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_generation",
      description:
        "Kullanıcı 'Evet, üret' onayı verdikten sonra video üretimini başlatır. ScenarioWizard'ı tetikler.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string" },
          totalDurationSec: { type: "integer" },
          aspectRatio: { type: "string" },
          style: { type: "string" },
        },
        required: ["topic", "totalDurationSec", "aspectRatio"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "regenerate_scene",
      description: "Belirli bir sahneyi yeniden üretir (kullanıcı talebine göre).",
      parameters: {
        type: "object",
        properties: {
          sceneIndex: { type: "integer", minimum: 1 },
          newPrompt: { type: "string" },
          reason: { type: "string", description: "Neden yeniden üretiliyor (kullanıcı isteği özeti)" },
        },
        required: ["sceneIndex", "newPrompt"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_setting",
      description: "Proje ayarını günceller (müzik, ses tonu, hız vb.).",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            enum: ["music", "voice", "pace", "language", "globalStyle"],
          },
          value: { type: "string" },
        },
        required: ["key", "value"],
        additionalProperties: false,
      },
    },
  },
];

/** Tool çağrısı sonucu — assistant mesajına eklenir. */
export type ToolCallSummary = {
  name: string;
  args: Record<string, unknown>;
};
