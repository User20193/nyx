import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import {
  streamChatCompletion,
  nonStreamChatCompletion,
  type ChatMessage,
} from "./openrouter";
import { buildSystemPrompt } from "./prompts";
import { newId } from "./ids";
import type { Message, ModelInfo, SamplingSettings } from "../types";
import { defaultSampling } from "../types";
import { trimToFit, countTokens } from "./tokens";

function effectiveSampling(chatSampling: SamplingSettings | null): SamplingSettings {
  return chatSampling ?? { ...defaultSampling };
}

function pickModel(
  preferredId: string | null,
  defaultId: string,
  models: ModelInfo[]
): string {
  if (preferredId) return preferredId;
  if (models.find((m) => m.id === defaultId)) return defaultId;
  return defaultId;
}

function getContextLimitTokens(
  modelId: string,
  models: ModelInfo[],
  override: "auto" | number
): number {
  if (override !== "auto") return override;
  const m = models.find((mod) => mod.id === modelId);
  if (m?.contextLength) return m.contextLength;
  return 8192;
}

export interface SendOptions {
  chatId: string;
  userText: string;
  models: ModelInfo[];
}

export async function sendUserMessage({
  chatId,
  userText,
  models,
}: SendOptions): Promise<void> {
  const settings = useSettingsStore.getState();
  const chatStore = useChatStore.getState();
  const apiKey = settings.activeApiKey;
  if (!apiKey) throw new Error("Нет активного API-ключа");

  const chat = chatStore.chats.find((c) => c.id === chatId);
  if (!chat) throw new Error("Чат не найден");

  const now = Date.now();
  const userMsg: Message = {
    id: newId(),
    chatId,
    role: "user",
    content: userText,
    pinned: false,
    createdAt: now,
  };

  await chatStore.addMessage(userMsg);

  await runAssistantTurn({ chatId, models });

  if (settings.global.autoNameChats && chat.name === "Новый чат") {
    void autoNameChat(chatId);
  }
}

export async function runAssistantTurn(args: {
  chatId: string;
  models: ModelInfo[];
}): Promise<void> {
  const { chatId, models } = args;
  const settings = useSettingsStore.getState();
  const chatStore = useChatStore.getState();
  const apiKey = settings.activeApiKey;
  if (!apiKey) throw new Error("Нет активного API-ключа");

  const chat = chatStore.chats.find((c) => c.id === chatId);
  if (!chat) throw new Error("Чат не найден");

  const messages = chatStore.messagesByChat[chatId] ?? [];
  const visibleHistory = messages.filter((m) => m.role !== "system");

  const modelId = pickModel(chat.model, settings.global.defaultModel, models);
  const sampling = effectiveSampling(chat.sampling);

  const systemPrompt = buildSystemPrompt({
    globalSettings: settings.global,
    activePersona: settings.activePersona,
    chatOverride: chat.systemPromptOverride,
  });

  const ctxTokens = getContextLimitTokens(
    modelId,
    models,
    settings.global.contextLimit
  );
  const sysTokens = countTokens(systemPrompt);
  const trimmed = trimToFit(
    visibleHistory,
    sysTokens,
    ctxTokens,
    sampling.maxTokens + 200
  );

  const apiMessages: ChatMessage[] = [];
  if (systemPrompt) {
    apiMessages.push({ role: "system", content: systemPrompt });
  }
  for (const m of trimmed) {
    apiMessages.push({
      role: m.role === "system" ? "system" : m.role,
      content: m.content,
    });
  }

  const assistantMsg: Message = {
    id: newId(),
    chatId,
    role: "assistant",
    content: "",
    modelUsed: modelId,
    pinned: false,
    createdAt: Date.now(),
  };
  await chatStore.addMessage(assistantMsg);

  const ctrl = new AbortController();
  chatStore.setAbort(chatId, ctrl);
  chatStore.setStreaming(chatId, true);

  try {
    if (settings.global.streamingEnabled) {
      await streamChatCompletion({
        apiKey: apiKey.keyValue,
        baseUrl: apiKey.baseUrl,
        model: modelId,
        messages: apiMessages,
        sampling,
        signal: ctrl.signal,
        onChunk: (delta) => {
          useChatStore.getState().appendToMessage(chatId, assistantMsg.id, delta);
        },
      });
    } else {
      const full = await nonStreamChatCompletion({
        apiKey: apiKey.keyValue,
        baseUrl: apiKey.baseUrl,
        model: modelId,
        messages: apiMessages,
        sampling,
        signal: ctrl.signal,
      });
      useChatStore.getState().appendToMessage(chatId, assistantMsg.id, full);
    }
    await useChatStore.getState().finalizeMessage(chatId, assistantMsg.id);
  } catch (e) {
    const wasAborted = ctrl.signal.aborted;
    if (wasAborted) {
      await useChatStore.getState().finalizeMessage(chatId, assistantMsg.id);
    } else {
      const err = e instanceof Error ? e.message : String(e);
      const fallback = settings.global.fallbackModel;
      if (fallback && fallback !== modelId) {
        try {
          const ctrl2 = new AbortController();
          chatStore.setAbort(chatId, ctrl2);
          if (settings.global.streamingEnabled) {
            await streamChatCompletion({
              apiKey: apiKey.keyValue,
              baseUrl: apiKey.baseUrl,
              model: fallback,
              messages: apiMessages,
              sampling,
              signal: ctrl2.signal,
              onChunk: (delta) => {
                useChatStore
                  .getState()
                  .appendToMessage(chatId, assistantMsg.id, delta);
              },
            });
          } else {
            const full = await nonStreamChatCompletion({
              apiKey: apiKey.keyValue,
              baseUrl: apiKey.baseUrl,
              model: fallback,
              messages: apiMessages,
              sampling,
              signal: ctrl2.signal,
            });
            useChatStore
              .getState()
              .appendToMessage(chatId, assistantMsg.id, full);
          }
          await useChatStore
            .getState()
            .updateMessage(
              chatId,
              assistantMsg.id,
              (
                useChatStore
                  .getState()
                  .messagesByChat[chatId]?.find((mm) => mm.id === assistantMsg.id)
                  ?.content ?? ""
              )
            );
        } catch (e2) {
          const err2 = e2 instanceof Error ? e2.message : String(e2);
          await useChatStore
            .getState()
            .updateMessage(
              chatId,
              assistantMsg.id,
              `\u26a0\ufe0f Ошибка: ${err}\n\nFallback на ${fallback} тоже не сработал: ${err2}`
            );
        }
      } else {
        await useChatStore
          .getState()
          .updateMessage(chatId, assistantMsg.id, `\u26a0\ufe0f Ошибка: ${err}`);
      }
    }
  } finally {
    useChatStore.getState().setStreaming(chatId, false);
    useChatStore.getState().setAbort(chatId, null);
  }
}

export function stopGeneration(chatId: string): void {
  const ctrl = useChatStore.getState().abortByChat[chatId];
  if (ctrl) {
    ctrl.abort();
  }
}

export async function regenerateAssistantMessage(args: {
  chatId: string;
  messageId: string;
  models: ModelInfo[];
}): Promise<void> {
  const { chatId, messageId, models } = args;
  const chatStore = useChatStore.getState();
  const messages = chatStore.messagesByChat[chatId] ?? [];
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return;
  const target = messages[idx];
  if (target.role !== "assistant") return;
  await chatStore.truncateChatFromMessage(chatId, messageId);
  await runAssistantTurn({ chatId, models });
}

async function autoNameChat(chatId: string): Promise<void> {
  const settings = useSettingsStore.getState();
  const apiKey = settings.activeApiKey;
  if (!apiKey) return;
  const chatStore = useChatStore.getState();
  const chat = chatStore.chats.find((c) => c.id === chatId);
  if (!chat) return;
  const msgs = chatStore.messagesByChat[chatId] ?? [];
  const userMsg = msgs.find((m) => m.role === "user");
  const botMsg = msgs.find((m) => m.role === "assistant");
  if (!userMsg) return;

  const prompt = `Придумай очень короткое (3-5 слов, без кавычек, без эмодзи) название для чата на основе первого сообщения пользователя. Отвечай ТОЛЬКО названием, без пояснений.

Сообщение пользователя:
${userMsg.content.slice(0, 500)}
${botMsg ? `\nОтвет ассистента:\n${botMsg.content.slice(0, 300)}` : ""}`;

  try {
    const name = await nonStreamChatCompletion({
      apiKey: apiKey.keyValue,
      baseUrl: apiKey.baseUrl,
      model: settings.global.autoNameModel,
      messages: [{ role: "user", content: prompt }],
      sampling: { ...defaultSampling, maxTokens: 32, temperature: 0.5 },
    });
    const cleaned = name.trim().replace(/^["'«»]+|["'«»]+$/g, "").slice(0, 60);
    if (cleaned && cleaned.length >= 2) {
      await chatStore.updateChat({
        ...chat,
        name: cleaned,
        updatedAt: Date.now(),
      });
    }
  } catch {
    // ignore auto-name errors
  }
}

export async function continueAssistantMessage(args: {
  chatId: string;
  models: ModelInfo[];
}): Promise<void> {
  const { chatId, models } = args;
  const chatStore = useChatStore.getState();
  const settings = useSettingsStore.getState();
  const apiKey = settings.activeApiKey;
  if (!apiKey) throw new Error("Нет активного API-ключа");
  const chat = chatStore.chats.find((c) => c.id === chatId);
  if (!chat) return;
  const messages = chatStore.messagesByChat[chatId] ?? [];
  const last = [...messages].reverse().find((m) => m.role === "assistant");
  if (!last || !last.content.trim()) return;

  const visibleHistory = messages.filter((m) => m.role !== "system");
  const modelId = pickModel(chat.model, settings.global.defaultModel, models);
  const sampling = effectiveSampling(chat.sampling);
  const systemPrompt = buildSystemPrompt({
    globalSettings: settings.global,
    activePersona: settings.activePersona,
    chatOverride: chat.systemPromptOverride,
  });
  const ctxTokens = getContextLimitTokens(
    modelId,
    models,
    settings.global.contextLimit
  );
  const sysTokens = countTokens(systemPrompt);
  const trimmed = trimToFit(
    visibleHistory,
    sysTokens,
    ctxTokens,
    sampling.maxTokens + 200
  );

  const apiMessages: ChatMessage[] = [];
  if (systemPrompt) {
    apiMessages.push({ role: "system", content: systemPrompt });
  }
  for (const m of trimmed) {
    apiMessages.push({
      role: m.role === "system" ? "system" : m.role,
      content: m.content,
    });
  }
  apiMessages.push({
    role: "user",
    content: "Продолжи свой предыдущий ответ ровно с того места, где остановился, без повторений и без вступительных фраз.",
  });

  const ctrl = new AbortController();
  chatStore.setAbort(chatId, ctrl);
  chatStore.setStreaming(chatId, true);

  try {
    if (settings.global.streamingEnabled) {
      await streamChatCompletion({
        apiKey: apiKey.keyValue,
        baseUrl: apiKey.baseUrl,
        model: modelId,
        messages: apiMessages,
        sampling,
        signal: ctrl.signal,
        onChunk: (delta) => {
          useChatStore.getState().appendToMessage(chatId, last.id, delta);
        },
      });
    } else {
      const more = await nonStreamChatCompletion({
        apiKey: apiKey.keyValue,
        baseUrl: apiKey.baseUrl,
        model: modelId,
        messages: apiMessages,
        sampling,
        signal: ctrl.signal,
      });
      useChatStore.getState().appendToMessage(chatId, last.id, more);
    }
    await useChatStore.getState().finalizeMessage(chatId, last.id);
  } catch (e) {
    if (!ctrl.signal.aborted) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("Continue failed", err);
    }
    await useChatStore.getState().finalizeMessage(chatId, last.id);
  } finally {
    useChatStore.getState().setStreaming(chatId, false);
    useChatStore.getState().setAbort(chatId, null);
  }
}
