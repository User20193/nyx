import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Square, ArrowDownToLine, Paperclip, Dice5 } from "lucide-react";
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
import { rollDice, formatRoll, parseSlashCommand } from "../../lib/dice";

const EMPTY_MSGS: never[] = [];

interface Props {
  chat: Chat;
}

export function MessageInput({ chat }: Props) {
  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const streaming = useChatStore((s) => !!s.streamingByChat[chat.id]);
  const apiKey = useSettingsStore((s) => s.activeApiKey);
  const messages = useChatStore((s) => s.messagesByChat[chat.id] ?? EMPTY_MSGS);
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

    // Slash commands intercepted client-side before going to the model.
    const slash = parseSlashCommand(trimmed);
    if (slash && slash.cmd === "roll") {
      const result = rollDice(slash.rest || "1d20");
      if (!result) {
        alert(
          'Не понял формулу броска. Пример: "/roll 2d6", "/roll 1d20+3", "/roll d100".'
        );
        return;
      }
      setText("");
      // Roll is a user message — model will see it and react in its next turn.
      try {
        await sendUserMessage({
          chatId: chat.id,
          userText: formatRoll(result),
          models,
        });
      } catch (e) {
        alert(
          `Не удалось отправить бросок: ${e instanceof Error ? e.message : String(e)}`
        );
      }
      return;
    }

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

  function quickRoll(expr: string) {
    setText((cur) => (cur ? cur + ` /roll ${expr}` : `/roll ${expr}`));
    setTimeout(() => taRef.current?.focus(), 0);
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
  const isGm = chat.gameMode === "gm";
  const [diceMenuOpen, setDiceMenuOpen] = useState(false);

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
            {isGm && !streaming && (
              <div className="relative">
                <button
                  onClick={() => setDiceMenuOpen((v) => !v)}
                  className="p-2 text-app-text-muted hover:text-app-accent hover:bg-app-bg rounded-full transition-colors"
                  title="Бросок кубика"
                >
                  <Dice5 size={16} />
                </button>
                {diceMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setDiceMenuOpen(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-2 z-40 bg-app-surface border border-app-border rounded-lg shadow-xl p-1 min-w-[140px]">
                      {["1d20", "2d6", "1d100", "1d6"].map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            setDiceMenuOpen(false);
                            quickRoll(d);
                          }}
                          className="w-full text-left px-3 py-1.5 text-[13px] rounded hover:bg-app-accent/15 text-app-text font-mono"
                        >
                          /roll {d}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
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
