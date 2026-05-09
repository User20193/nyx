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
    <div className="relative flex h-full items-center justify-center px-8 overflow-hidden app-bg-gradient">
      {/* Aurora blobs */}
      <div
        aria-hidden
        className="aurora-1 absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(91,141,239,0.35) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="aurora-2 absolute -bottom-32 -right-32 h-[480px] w-[480px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(167,140,243,0.30) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="aurora-3 absolute top-1/3 right-1/4 h-[280px] w-[280px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,107,0.20) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-md z-10"
      >
        <div className="rounded-3xl border border-white/[0.06] bg-app-surface/40 backdrop-blur-2xl p-8 shadow-2xl shadow-black/40">
          <div className="mb-7 text-center">
            <motion.div
              initial={{ scale: 0.6, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 240 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,141,239,0.25), rgba(167,140,243,0.18))",
                boxShadow:
                  "0 8px 32px rgba(91,141,239,0.30), 0 0 0 1px rgba(91,141,239,0.20) inset",
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a8c4ff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              Добро пожаловать в Nyx
            </h1>
            <p className="text-app-text-dim text-sm leading-relaxed">
              Минималистичный клиент для общения с LLM
              <br />
              через OpenRouter и совместимые API
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-app-text-dim mb-2 font-semibold">
                API-ключ OpenRouter
              </label>
              <div className="relative group">
                <Key
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-app-accent transition-colors"
                  size={16}
                />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  disabled={submitting}
                  className="w-full rounded-xl bg-app-surface/80 border border-app-border pl-10 pr-3 py-3 text-sm focus:outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/30 transition-all"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={openSignup}
                className="mt-2 text-xs text-app-text-dim hover:text-app-accent flex items-center gap-1 transition-colors"
              >
                Получить бесплатный ключ на openrouter.ai
                <ExternalLink size={11} />
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-app-danger/10 border border-app-danger/30 px-3 py-2 text-xs text-app-danger"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!apiKey.trim() || submitting}
              className="w-full rounded-xl bg-app-accent hover:bg-app-accent-hover disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3 text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-app-accent/30"
            >
              {submitting ? "Сохраняю..." : "Продолжить"}
              {!submitting && <ArrowRight size={16} />}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-[11px] text-app-text-muted leading-relaxed">
            Ключ хранится локально в БД приложения.
            <br />
            Никуда не отправляется.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
