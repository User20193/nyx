import type { ModelInfo, SamplingSettings } from "../types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRawModel {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  description?: string;
}

export async function fetchModels(
  apiKey: string,
  baseUrl?: string | null
): Promise<ModelInfo[]> {
  const base = baseUrl || OPENROUTER_BASE;
  const res = await fetch(`${base}/models`, {
    headers: apiKey
      ? { Authorization: `Bearer ${apiKey}` }
      : {},
  });
  if (!res.ok) {
    throw new Error(`Не удалось загрузить список моделей (${res.status})`);
  }
  const json = (await res.json()) as { data: OpenRouterRawModel[] };
  return json.data.map((m) => {
    const promptPrice = parseFloat(m.pricing?.prompt ?? "0");
    const completionPrice = parseFloat(m.pricing?.completion ?? "0");
    const isFree =
      (Number.isFinite(promptPrice) && promptPrice === 0) &&
      (Number.isFinite(completionPrice) && completionPrice === 0);
    return {
      id: m.id,
      name: m.name || m.id,
      contextLength: m.context_length ?? 0,
      pricing: {
        prompt: m.pricing?.prompt ?? "0",
        completion: m.pricing?.completion ?? "0",
      },
      isFree,
      description: m.description,
    };
  });
}

export interface ChatCompletionParams {
  apiKey: string;
  baseUrl?: string | null;
  model: string;
  messages: ChatMessage[];
  sampling: SamplingSettings;
  signal?: AbortSignal;
  onChunk?: (delta: string) => void;
  onDone?: (full: string) => void;
}

export async function streamChatCompletion(
  params: ChatCompletionParams
): Promise<string> {
  const {
    apiKey,
    baseUrl,
    model,
    messages,
    sampling,
    signal,
    onChunk,
    onDone,
  } = params;

  const base = baseUrl || OPENROUTER_BASE;

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
    temperature: sampling.temperature,
    top_p: sampling.topP,
    max_tokens: sampling.maxTokens,
    presence_penalty: sampling.presencePenalty,
    frequency_penalty: sampling.frequencyPenalty,
  };
  if (sampling.topK !== undefined) {
    body.top_k = sampling.topK;
  }

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/User20193/nyx",
      "X-Title": "Nyx",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API ошибка ${res.status}: ${errText}`);
  }

  if (!res.body) {
    throw new Error("Нет тела ответа");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            onChunk?.(delta);
          }
        } catch {
          // skip non-JSON keep-alive lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  onDone?.(full);
  return full;
}

export async function nonStreamChatCompletion(
  params: Omit<ChatCompletionParams, "onChunk" | "onDone">
): Promise<string> {
  const { apiKey, baseUrl, model, messages, sampling, signal } = params;
  const base = baseUrl || OPENROUTER_BASE;

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: false,
    temperature: sampling.temperature,
    top_p: sampling.topP,
    max_tokens: sampling.maxTokens,
    presence_penalty: sampling.presencePenalty,
    frequency_penalty: sampling.frequencyPenalty,
  };

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/User20193/nyx",
      "X-Title": "Nyx",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API ошибка ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}
