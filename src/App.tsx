import { useEffect, useState } from "react";
import { Welcome } from "./components/Welcome";
import { MainLayout } from "./components/MainLayout";
import { useSettingsStore } from "./stores/settingsStore";
import { useChatStore } from "./stores/chatStore";
import { AnimatePresence, motion } from "framer-motion";

export default function App() {
  const [bootError, setBootError] = useState<string | null>(null);
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
        await loadSettings();
        await loadChats();
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : String(e));
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
      <div className="flex h-screen items-center justify-center text-center px-8">
        <div className="max-w-md">
          <div className="text-2xl font-semibold mb-2 text-app-danger">
            Ошибка инициализации
          </div>
          <div className="text-app-text-dim text-sm whitespace-pre-wrap font-mono">
            {bootError}
          </div>
        </div>
      </div>
    );
  }

  if (!bootDone || !settingsLoaded || !chatsLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-app-text-dim text-sm">Загрузка...</div>
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
