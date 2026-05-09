import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar/Sidebar";
import { ChatArea } from "./Chat/ChatArea";
import { SettingsPanel } from "./Settings/SettingsPanel";
import { GlobalSettingsModal } from "./Settings/GlobalSettingsModal";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useModelStore } from "../stores/modelStore";
import { motion, AnimatePresence } from "framer-motion";

export function MainLayout() {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const selectChat = useChatStore((s) => s.selectChat);
  const createChat = useChatStore((s) => s.createChat);
  const defaultModel = useSettingsStore((s) => s.global.defaultModel);
  const activeApiKey = useSettingsStore((s) => s.activeApiKey);
  const accentColor = useSettingsStore((s) => s.global.accentColor);
  const loadModels = useModelStore((s) => s.load);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [globalOpen, setGlobalOpen] = useState(false);

  useEffect(() => {
    if (chats.length === 0) {
      void createChat(defaultModel);
    } else if (!activeChatId) {
      void selectChat(chats[0].id);
    }
  }, [chats, activeChatId, createChat, selectChat, defaultModel]);

  useEffect(() => {
    if (activeApiKey) {
      void loadModels(activeApiKey.keyValue, activeApiKey.baseUrl);
    }
  }, [activeApiKey, loadModels]);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-app-accent", accentColor);
    document.documentElement.style.setProperty(
      "--color-app-bubble-user",
      accentColor
    );
  }, [accentColor]);

  return (
    <div className="flex h-full bg-app-bg text-app-text">
      <Sidebar onOpenGlobalSettings={() => setGlobalOpen(true)} />
      <div className="flex-1 flex min-w-0">
        <ChatArea
          onToggleSettings={() => setSettingsOpen((v) => !v)}
          settingsOpen={settingsOpen}
        />
        <AnimatePresence initial={false}>
          {settingsOpen && (
            <motion.div
              key="settings"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="border-l border-app-border bg-app-sidebar overflow-hidden"
            >
              <div className="w-[320px] h-full">
                <SettingsPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {globalOpen && <GlobalSettingsModal onClose={() => setGlobalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
