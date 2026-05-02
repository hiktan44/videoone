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

function getProvider(): "kie" | "openai" {
  const p = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (p === "openai") return "openai";
  // Kie default cunku kullanici zaten Kie kredisi
  return process.env.KIE_API_KEY ? "kie" : "openai";
}

function getModel(): string {
  return process.env.LLM_MODEL || "gemini-3.1-pro";
}

/** Model adina gore Kie endpoint URL'sini doner. */
function kieUrl(model: string): string {
  // Kie.ai market chat endpoint'leri: /<model-id>/v1/chat/completions
  return `${KIE_BASE}/${model}/v1/chat/completions`;
}

export async function chatCompletion(req: ChatRequest): Promise<ChatResponse> {
  const provider = getProvider();
  const model = getModel();

  const apiKey = provider === "kie" ? process.env.KIE_API_KEY : process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      provider === "kie"
        ? "KIE_API_KEY tanimli degil"
        : "OPENAI_API_KEY tanimli degil"
    );
  }
  const url = provider === "kie" ? kieUrl(model) : `${OPENAI_BASE}/chat/completions`;

  const body: any = {
    model,
    messages: req.messages,
    temperature: req.temperature ?? 0.7,
  };
  if (req.tools && req.tools.length > 0) body.tools = req.tools;
  if (req.responseFormat) body.response_format = req.responseFormat;

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
    throw new Error(`LLM ${provider}/${model} HTTP ${res.status}: ${txt.slice(0, 300)}`);
  }

  const data = await res.json();
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

/** Streaming chat completion — SSE chunk callback'li. */
export async function chatCompletionStream(
  req: ChatRequest,
  onChunk: (event: "token" | "tool" | "done", data: any) => void
): Promise<void> {
  const provider = getProvider();
  const model = getModel();
  const apiKey = provider === "kie" ? process.env.KIE_API_KEY : process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      provider === "kie" ? "KIE_API_KEY tanimli degil" : "OPENAI_API_KEY tanimli degil"
    );
  }
  const url = provider === "kie" ? kieUrl(model) : `${OPENAI_BASE}/chat/completions`;

  const body: any = {
    model,
    messages: req.messages,
    temperature: req.temperature ?? 0.7,
    stream: true,
  };
  if (req.tools && req.tools.length > 0) body.tools = req.tools;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    throw new Error(`LLM stream ${res.status}: ${txt.slice(0, 200)}`);
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
