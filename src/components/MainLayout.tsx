import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar/Sidebar";
import { ChatArea } from "./Chat/ChatArea";
import { SettingsPanel } from "./Settings/SettingsPanel";
import { GlobalSettingsModal } from "./Settings/GlobalSettingsModal";
import { ScenarioPicker } from "./Game/ScenarioPicker";
import { useChatStore } from "../stores/chatStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useModelStore } from "../stores/modelStore";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "../lib/useHotkeys";

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
  const [scenarioPickerOpen, setScenarioPickerOpen] = useState(false);

  useEffect(() => {
    if (chats.length === 0) {
      void createChat(defaultModel);
    } else if (!activeChatId) {
      void selectChat(chats[0].id);
    }
    // Only re-run when ID lists actually change. createChat/selectChat are
    // stable zustand methods — including them in deps is fine but doesn't
    // trigger re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats.length, activeChatId, defaultModel]);

  useEffect(() => {
    if (activeApiKey) {
      void loadModels(activeApiKey.keyValue, activeApiKey.baseUrl);
    }
  }, [activeApiKey, loadModels]);

  useEffect(() => {
    // Defensive — accentColor must be a valid CSS color string.
    if (!accentColor || typeof accentColor !== "string") return;
    if (!/^#[0-9a-fA-F]{3,8}$|^rgb|^hsl/.test(accentColor)) return;
    document.documentElement.style.setProperty("--color-app-accent", accentColor);
    document.documentElement.style.setProperty(
      "--color-app-bubble-user",
      accentColor
    );
  }, [accentColor]);

  useHotkeys([
    {
      combo: "ctrl+,",
      handler: () => setGlobalOpen((v) => !v),
    },
    {
      combo: "ctrl+l",
      handler: () => {
        void createChat(defaultModel);
      },
    },
    {
      combo: "ctrl+g",
      handler: () => setScenarioPickerOpen(true),
    },
    {
      combo: "ctrl+b",
      handler: () => setSettingsOpen((v) => !v),
    },
    {
      combo: "escape",
      handler: () => {
        if (scenarioPickerOpen) setScenarioPickerOpen(false);
        else if (globalOpen) setGlobalOpen(false);
      },
      allowInInput: true,
    },
  ]);

  return (
    <div className="flex h-full app-bg-gradient text-app-text">
      <Sidebar
        onOpenGlobalSettings={() => setGlobalOpen(true)}
        onOpenScenarioPicker={() => setScenarioPickerOpen(true)}
      />
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
              className="border-l border-app-border-soft bg-app-sidebar/70 backdrop-blur-xl overflow-hidden"
            >
              <div className="w-[320px] h-full">
                <SettingsPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/*
        Modals manage their own fade-out internally and unmount when fully
        invisible. We deliberately don't wrap them in AnimatePresence so
        there's no chance of an exiting backdrop intercepting clicks after
        the user has dismissed it.
      */}
      {globalOpen && <GlobalSettingsModal onClose={() => setGlobalOpen(false)} />}
      {scenarioPickerOpen && (
        <ScenarioPicker onClose={() => setScenarioPickerOpen(false)} />
      )}
    </div>
  );
}
