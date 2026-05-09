import { useEffect, useState } from "react";
import { Welcome } from "./components/Welcome";
import { MainLayout } from "./components/MainLayout";
import { useSettingsStore } from "./stores/settingsStore";
import { useChatStore } from "./stores/chatStore";
import { AnimatePresence, motion } from "framer-motion";
import { resetAllData } from "./lib/db";

export default function App() {
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootStage, setBootStage] = useState<string>("инициализация");
  const [bootDone, setBootDone] = useState(false);

  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.load);
  const activeApiKey = useSettingsStore((s) => s.activeApiKey);

  const chatsLoaded = useChatStore((s) => s.loaded);
  const loadChats = useChatStore((s) => s.load);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setBootStage("загрузка настроек");
        await loadSettings();
        if (cancelled) return;
        setBootStage("загрузка чатов");
        await loadChats();
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? `${e.message}\n\n${e.stack ?? ""}` : String(e);
          console.error("[Nyx] Boot error:", e);
          setBootError(msg);
        }
      } finally {
        if (!cancelled) setBootDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSettings, loadChats]);

  if (bootError) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#0e1014",
          color: "#e8eaed",
        }}
      >
        <div style={{ maxWidth: 600, width: "100%" }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#ef4444",
              marginBottom: 12,
            }}
          >
            Ошибка инициализации
          </div>
          <div style={{ fontSize: 13, color: "#9aa0a6", marginBottom: 12 }}>
            На этапе: {bootStage}
          </div>
          <pre
            style={{
              fontFamily: '"JetBrains Mono", Consolas, monospace',
              fontSize: 12,
              color: "#ef4444",
              background: "#0a0c0f",
              padding: 12,
              borderRadius: 8,
              overflow: "auto",
              maxHeight: 400,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {bootError}
          </pre>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => location.reload()}
              style={{
                padding: "8px 16px",
                background: "#5b8def",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Перезагрузить
            </button>
            <button
              type="button"
              onClick={async () => {
                if (
                  !confirm(
                    "Удалить все данные (чаты, ключи, настройки)? Это нельзя отменить."
                  )
                )
                  return;
                try {
                  await resetAllData();
                  location.reload();
                } catch (e) {
                  alert("Не удалось сбросить: " + (e as Error).message);
                }
              }}
              style={{
                padding: "8px 16px",
                background: "transparent",
                color: "#ef4444",
                border: "1px solid #ef4444",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Сбросить все данные
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bootDone || !settingsLoaded || !chatsLoaded) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#0e1014",
          color: "#9aa0a6",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: "2px solid #22262e",
            borderTopColor: "#5b8def",
            borderRadius: "50%",
            animation: "boot-spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: 14 }}>Загрузка: {bootStage}</div>
      </div>
    );
  }

  const showWelcome = !activeApiKey;

  return (
    <AnimatePresence mode="wait">
      {showWelcome ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-screen"
        >
          <Welcome />
        </motion.div>
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-screen"
        >
          <MainLayout />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
