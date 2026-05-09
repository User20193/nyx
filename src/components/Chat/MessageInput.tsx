import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Square, ArrowDownToLine } from "lucide-react";
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
  const taRef = useRef<HTMLTextAreaElement>(null);
  const streaming = useChatStore(
    (s) => !!s.streamingByChat[chat.id]
  );
  const apiKey = useSettingsStore((s) => s.activeApiKey);
  const messages = useChatStore((s) => s.messagesByChat[chat.id] ?? []);
  const models = useModelStore((s) => s.models);
  const contextLimitOverride = useSettingsStore(
    (s) => s.global.contextLimit
  );

  const tokensInInput = useMemo(() => countTokens(text), [text]);
  const tokensInHistory = useMemo(
    () =>
      messages.reduce(
        (sum, m) => sum + countTokens(m.content) + 4,
        0
      ),
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

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.files;
    if (!items || items.length === 0) return;
    const txtFile = Array.from(items).find(
      (f) => f.type.startsWith("text/") || /\.(txt|md|json|csv|log)$/i.test(f.name)
    );
    if (txtFile) {
      e.preventDefault();
      txtFile.text().then((content) => {
        setText((cur) =>
          (cur ? cur + "\n\n" : "") + `--- ${txtFile.name} ---\n${content}`
        );
      });
    }
  }

  const usedPct = ctxLimit > 0 ? Math.min(100, (totalTokens / ctxLimit) * 100) : 0;

  const lastBot = [...messages].reverse().find((m) => m.role === "assistant");
  const canContinue = !streaming && !!lastBot && lastBot.content.trim().length > 0;

  return (
    <div className="border-t border-app-border bg-app-bg">
      <div className="px-5 py-3 max-w-4xl mx-auto">
        <div className="relative bg-app-surface border border-app-border rounded-2xl px-3 py-2 focus-within:border-app-accent transition-colors">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            rows={1}
            placeholder="Введите сообщение..."
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
                className="p-2 bg-app-accent text-white hover:bg-app-accent-hover rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
