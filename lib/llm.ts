// Generic LLM chat helper — Kie.ai chat endpoint'leri (Gemini, Claude, GPT-5).
// OpenAI direkt yerine Kie kullaniyoruz cunku kullanici zaten Kie kredisi var.
//
// Ortam degiskenleri:
//   LLM_PROVIDER = "kie" (default) | "openai"
//   LLM_MODEL    = "gemini-3.1-pro" (default) | "claude-sonnet-4-6" | "gpt-5-2" | ...
//   KIE_API_KEY  = required if provider=kie
//   OPENAI_API_KEY = required if provider=openai

const KIE_BASE = "https://api.kie.ai";
const OPENAI_BASE = "https://api.openai.com/v1";
const ZAI_BASE = "https://api.z.ai/api/paas/v4";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
};

export type ChatTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
};

export type ChatRequest = {
  messages: ChatMessage[];
  tools?: ChatTool[];
  temperature?: number;
  responseFormat?: any; // OpenAI-style json_schema
  stream?: boolean;
};

export type ChatResponse = {
  content: string;
  toolCalls: Array<{ name: string; args: Record<string, unknown> }>;
};

type Provider = "kie" | "openai" | "zai";

function getProvider(): Provider {
  const p = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (p === "openai") return "openai";
  if (p === "zai" || p === "z.ai" || p === "glm") return "zai";
  if (p === "kie") return "kie";
  // Otomatik: env'lere göre — z.ai > kie > openai
  if (process.env.ZAI_API_KEY) return "zai";
  if (process.env.KIE_API_KEY) return "kie";
  return "openai";
}

function getApiKey(provider: Provider): string | undefined {
  if (provider === "zai") return process.env.ZAI_API_KEY;
  if (provider === "kie") return process.env.KIE_API_KEY;
  return process.env.OPENAI_API_KEY;
}

function getEndpoint(provider: Provider, model: string): string {
  if (provider === "zai") return `${ZAI_BASE}/chat/completions`;
  if (provider === "kie") return kieUrl(model);
  return `${OPENAI_BASE}/chat/completions`;
}

// Provider bazli fallback chain
const FALLBACKS: Record<Provider, string[]> = {
  kie: ["gemini-3-pro", "gemini-2.5-pro", "gpt-5-2", "claude-sonnet-4-6"],
  zai: ["glm-4.6", "glm-4.5-air", "glm-4.5"], // z.ai GLM modelleri
  openai: ["gpt-4o", "gpt-4o-mini"],
};

function getModel(): string {
  if (process.env.LLM_MODEL) return process.env.LLM_MODEL;
  const provider = getProvider();
  return FALLBACKS[provider][0];
}

function getModelChain(): string[] {
  const provider = getProvider();
  const primary = process.env.LLM_MODEL;
  const list = FALLBACKS[provider];
  if (primary) return [primary, ...list.filter((m) => m !== primary)];
  return list;
}

/** Model adina gore Kie endpoint URL'sini doner. */
function kieUrl(model: string): string {
  // Kie.ai market chat endpoint'leri: /<model-id>/v1/chat/completions
  return `${KIE_BASE}/${model}/v1/chat/completions`;
}

async function callOnce(
  provider: Provider,
  model: string,
  apiKey: string,
  req: ChatRequest
): Promise<{ ok: boolean; data?: any; error?: string; status?: number }> {
  const url = getEndpoint(provider, model);
  const body: any = {
    model,
    messages: req.messages,
    temperature: req.temperature ?? 0.7,
  };
  if (req.tools && req.tools.length > 0) body.tools = req.tools;
  if (req.responseFormat) body.response_format = req.responseFormat;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `${provider}/${model} HTTP ${res.status}: ${txt.slice(0, 200)}`, status: res.status };
    }
    const data = await res.json();
    // Kie body code != 200 olabilir
    const code = data?.code;
    if (code !== undefined && code !== 200 && code !== 0) {
      return {
        ok: false,
        error: `${provider}/${model} code=${code}: ${data?.msg || data?.message || "?"}`,
        status: 500,
      };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network", status: 0 };
  }
}

export async function chatCompletion(req: ChatRequest): Promise<ChatResponse> {
  const provider = getProvider();
  const apiKey = getApiKey(provider);
  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()}_API_KEY tanımlı değil`);
  }

  const chain = getModelChain();
  const errors: string[] = [];
  let data: any = null;

  for (const model of chain) {
    const result = await callOnce(provider, model, apiKey, req);
    if (result.ok) {
      data = result.data;
      break;
    }
    errors.push(result.error || "?");
    // Sadece 5xx, 429 veya Kie maintenance gibi hatalarda fallback dene
    // 4xx (bad request) için fallback anlamsız
    if (result.status && result.status >= 400 && result.status < 500 && result.status !== 429) {
      break;
    }
  }

  if (!data) {
    throw new Error(`Tüm LLM modelleri başarısız: ${errors.slice(0, 3).join(" | ")}`);
  }
  // Kie bazen data.choices, bazen data.data.choices doner — defensif
  const choice = data?.choices?.[0]?.message || data?.data?.choices?.[0]?.message;
  if (!choice) {
    throw new Error(`LLM bos yanit dondu: ${JSON.stringify(data).slice(0, 200)}`);
  }
  const content = String(choice.content || "");
  const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  if (Array.isArray(choice.tool_calls)) {
    for (const tc of choice.tool_calls) {
      try {
        const args = JSON.parse(tc.function?.arguments || "{}");
        toolCalls.push({ name: tc.function?.name || "", args });
      } catch {}
    }
  }
  return { content, toolCalls };
}

/** Streaming chat completion — SSE chunk callback'li. Fallback chain ile. */
export async function chatCompletionStream(
  req: ChatRequest,
  onChunk: (event: "token" | "tool" | "done", data: any) => void
): Promise<void> {
  const provider = getProvider();
  const apiKey = getApiKey(provider);
  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()}_API_KEY tanımlı değil`);
  }

  const chain = getModelChain();
  const errors: string[] = [];
  let res: Response | null = null;

  for (const model of chain) {
    const url = getEndpoint(provider, model);
    const body: any = {
      model,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      stream: true,
    };
    if (req.tools && req.tools.length > 0) body.tools = req.tools;

    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        errors.push(`${model} ${r.status}: ${txt.slice(0, 100)}`);
        if (r.status >= 400 && r.status < 500 && r.status !== 429) break;
        continue;
      }
      res = r;
      break;
    } catch (e) {
      errors.push(`${model} network: ${e instanceof Error ? e.message : "?"}`);
    }
  }

  if (!res || !res.body) {
    throw new Error(`Stream başarısız: ${errors.slice(0, 3).join(" | ")}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const toolBuf: Record<number, { name: string; argsStr: string }> = {};

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const chunk = JSON.parse(payload);
        const delta = chunk?.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.content) {
          onChunk("token", { text: delta.content });
        }
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolBuf[idx]) toolBuf[idx] = { name: "", argsStr: "" };
            if (tc.function?.name) toolBuf[idx].name = tc.function.name;
            if (tc.function?.arguments) toolBuf[idx].argsStr += tc.function.arguments;
          }
        }
      } catch {}
    }
  }

  // Topla tool calls
  for (const buf of Object.values(toolBuf)) {
    if (!buf.name) continue;
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(buf.argsStr);
    } catch {}
    onChunk("tool", { name: buf.name, args });
  }
  onChunk("done", {});
}

export function getActiveLLMInfo(): { provider: string; model: string } {
  return { provider: getProvider(), model: getModel() };
}
