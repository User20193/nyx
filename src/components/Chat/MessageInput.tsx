import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Square, ArrowDownToLine, Paperclip } from "lucide-react";
import type { Chat } from "../../types";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useModelStore } from "../../stores/modelStore";
import {
  sendUserMessage,
  stopGeneration,
  continueAssistantMessage,
} from "../../lib/chatActions";
import { countTokens } from "../../lib/tokens";

interface Props {
  chat: Chat;
}

export function MessageInput({ chat }: Props) {
  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const streaming = useChatStore((s) => !!s.streamingByChat[chat.id]);
  const apiKey = useSettingsStore((s) => s.activeApiKey);
  const messages = useChatStore((s) => s.messagesByChat[chat.id] ?? []);
  const models = useModelStore((s) => s.models);
  const contextLimitOverride = useSettingsStore((s) => s.global.contextLimit);

  const tokensInInput = useMemo(() => countTokens(text), [text]);
  const tokensInHistory = useMemo(
    () =>
      messages.reduce((sum, m) => sum + countTokens(m.content) + 4, 0),
    [messages]
  );
  const totalTokens = tokensInHistory + tokensInInput;

  const ctxLimit = useMemo(() => {
    if (contextLimitOverride !== "auto") return contextLimitOverride;
    const m = models.find((mm) => mm.id === chat.model);
    return m?.contextLength ?? 8192;
  }, [contextLimitOverride, models, chat.model]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [text]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    if (!apiKey) {
      alert("Нет активного API-ключа. Добавь ключ в настройках.");
      return;
    }
    setText("");
    try {
      await sendUserMessage({
        chatId: chat.id,
        userText: trimmed,
        models,
      });
    } catch (e) {
      alert(`Не удалось отправить: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function readTextLike(file: File) {
    const isText =
      file.type.startsWith("text/") ||
      /\.(txt|md|json|csv|log|ts|tsx|js|jsx|py|rs|go|java|c|cpp|h|html|css|yaml|yml|toml|sh)$/i.test(
        file.name
      );
    if (!isText) return null;
    if (file.size > 200 * 1024) {
      alert(`Файл "${file.name}" слишком большой (>200 КБ)`);
      return null;
    }
    return await file.text();
  }

  async function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.files;
    if (!items || items.length === 0) return;
    const file = items[0];
    const content = await readTextLike(file);
    if (content !== null) {
      e.preventDefault();
      setText(
        (cur) => (cur ? cur + "\n\n" : "") + `--- ${file.name} ---\n${content}`
      );
    }
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    let added = "";
    for (const f of files) {
      const content = await readTextLike(f);
      if (content !== null) {
        added += `\n\n--- ${f.name} ---\n${content}`;
      }
    }
    if (added) {
      setText((cur) => (cur ? cur + added : added.trimStart()));
    }
  }

  const usedPct = ctxLimit > 0 ? Math.min(100, (totalTokens / ctxLimit) * 100) : 0;

  const lastBot = [...messages].reverse().find((m) => m.role === "assistant");
  const canContinue = !streaming && !!lastBot && lastBot.content.trim().length > 0;

  return (
    <div className="border-t border-app-border-soft bg-app-bg/50 backdrop-blur-md">
      <div className="px-5 py-3 max-w-4xl mx-auto">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative bg-app-surface/80 border rounded-2xl px-3 py-2 transition-all ${
            dragOver
              ? "border-app-accent ring-4 ring-app-accent/15"
              : "border-app-border focus-within:border-app-accent focus-within:ring-2 focus-within:ring-app-accent/15"
          }`}
        >
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-app-accent text-xs font-medium bg-app-bg/60 rounded-2xl">
              <Paperclip size={14} className="mr-1.5" />
              Отпустите файл — он добавится в сообщение
            </div>
          )}
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            rows={1}
            placeholder="Введите сообщение... (Enter — отправить, Shift+Enter — новая строка)"
            className="w-full bg-transparent border-none outline-none resize-none py-1.5 pr-12 text-[14.5px] placeholder:text-app-text-muted"
          />
          <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
            {canContinue && !streaming && (
              <button
                onClick={() =>
                  continueAssistantMessage({ chatId: chat.id, models })
                }
                className="p-2 text-app-text-muted hover:text-app-accent hover:bg-app-bg rounded-full transition-colors"
                title="Продолжить ответ"
              >
                <ArrowDownToLine size={16} />
              </button>
            )}
            {streaming ? (
              <button
                onClick={() => stopGeneration(chat.id)}
                className="p-2 bg-app-danger/15 text-app-danger hover:bg-app-danger/25 rounded-full transition-colors"
                title="Остановить"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={send}
                disabled={!text.trim()}
                className="p-2 bg-app-accent text-white hover:bg-app-accent-hover rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-md shadow-app-accent/30"
                title="Отправить (Enter)"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[10.5px] text-app-text-muted">
          <div>
            {tokensInInput > 0 && (
              <span>В сообщении: {tokensInInput.toLocaleString("ru-RU")} ток.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>
              {totalTokens.toLocaleString("ru-RU")} /{" "}
              {ctxLimit.toLocaleString("ru-RU")}
            </span>
            <div className="w-20 h-1 bg-app-surface rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usedPct > 90
                    ? "bg-app-danger"
                    : usedPct > 75
                      ? "bg-amber-500"
                      : "bg-app-accent"
                }`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
