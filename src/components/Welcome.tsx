import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Key, ExternalLink } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { useChatStore } from "../stores/chatStore";
import { openUrl } from "@tauri-apps/plugin-opener";

export function Welcome() {
  const [apiKey, setApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addApiKey = useSettingsStore((s) => s.addApiKey);
  const createChat = useChatStore((s) => s.createChat);
  const defaultModel = useSettingsStore((s) => s.global.defaultModel);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addApiKey(
        "openrouter",
        "OpenRouter",
        apiKey.trim(),
        "https://openrouter.ai/api/v1"
      );
      await createChat(defaultModel);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function openSignup() {
    try {
      await openUrl("https://openrouter.ai/keys");
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-full items-center justify-center px-8">
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-app-accent/15 text-app-accent">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Добро пожаловать в Nyx
          </h1>
          <p className="text-app-text-dim text-sm leading-relaxed">
            Минималистичный клиент для общения с LLM через OpenRouter
            и совместимые API.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-app-text-dim mb-2">
              API-ключ OpenRouter
            </label>
            <div className="relative">
              <Key
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted"
                size={16}
              />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                disabled={submitting}
                className="w-full rounded-lg bg-app-surface border border-app-border pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-colors"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={openSignup}
              className="mt-2 text-xs text-app-text-dim hover:text-app-accent flex items-center gap-1"
            >
              Получить бесплатный ключ на openrouter.ai
              <ExternalLink size={11} />
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-app-danger/10 border border-app-danger/30 px-3 py-2 text-xs text-app-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!apiKey.trim() || submitting}
            className="w-full rounded-lg bg-app-accent hover:bg-app-accent-hover disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? "Сохраняю..." : "Продолжить"}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-app-text-muted leading-relaxed">
          Ключ сохраняется только на этом компьютере, в локальной БД приложения.
          Никуда не отправляется.
        </p>
      </motion.div>
    </div>
  );
}
