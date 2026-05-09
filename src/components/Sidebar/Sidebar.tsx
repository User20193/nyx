import { useState } from "react";
import { Plus, Settings as SettingsIcon, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { ChatCircle } from "./ChatCircle";
import { ChatContextMenu } from "./ChatContextMenu";
import type { Chat } from "../../types";

interface Props {
  onOpenGlobalSettings: () => void;
  onOpenScenarioPicker: () => void;
}

export function Sidebar({ onOpenGlobalSettings, onOpenScenarioPicker }: Props) {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const selectChat = useChatStore((s) => s.selectChat);
  const createChat = useChatStore((s) => s.createChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const defaultModel = useSettingsStore((s) => s.global.defaultModel);

  const [contextMenu, setContextMenu] = useState<{
    chat: Chat;
    x: number;
    y: number;
  } | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  function handleDelete(chat: Chat) {
    if (confirm(`Удалить чат "${chat.name}"? Это действие нельзя отменить.`)) {
      void deleteChat(chat.id);
    }
  }

  return (
    <div className="w-[76px] bg-app-sidebar/70 backdrop-blur-xl border-r border-app-border-soft flex flex-col items-center pt-4 pb-3 relative">
      {/* Logo */}
      <div className="mb-3 select-none">
        <motion.div
          whileHover={{ scale: 1.06, rotate: -6 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="h-10 w-10 rounded-2xl flex items-center justify-center text-app-accent"
          style={{
            background:
              "linear-gradient(135deg, var(--color-app-accent-soft), transparent)",
            boxShadow: "0 0 0 1px var(--color-app-accent-soft) inset",
          }}
          title="Nyx"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </motion.div>
      </div>

      <div className="w-8 h-px bg-app-border-soft mb-3" />

      <div className="flex-1 flex flex-col items-center gap-1 overflow-y-auto w-full no-scrollbar">
        {chats.map((chat) => (
          <ChatCircle
            key={chat.id}
            chat={chat}
            active={chat.id === activeChatId}
            onClick={() => selectChat(chat.id)}
            onDelete={() => handleDelete(chat)}
            onContextMenu={(e) => {
              setContextMenu({ chat, x: e.clientX, y: e.clientY });
            }}
          />
        ))}
      </div>

      <div className="relative mt-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setCreateMenuOpen((v) => !v)}
          className="h-12 w-12 rounded-2xl bg-app-surface/80 border border-dashed border-app-border-soft text-app-text-dim hover:bg-app-accent/15 hover:text-app-accent hover:border-app-accent/40 flex items-center justify-center transition-colors backdrop-blur-md"
          title="Новый чат"
        >
          <Plus size={20} />
        </motion.button>

        <AnimatePresence>
          {createMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setCreateMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute left-full bottom-0 ml-2 z-40 bg-app-surface border border-app-border rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl p-1 min-w-[220px]"
              >
                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    void createChat(defaultModel);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-app-accent/15 text-app-text"
                >
                  <Plus size={14} className="text-app-text-muted" />
                  Обычный чат
                </button>
                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    onOpenScenarioPicker();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-app-accent/15 text-app-text"
                >
                  <Swords size={14} className="text-app-accent" />
                  Игровой режим (GM)
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="w-8 h-px bg-app-border-soft my-3" />

      <button
        onClick={onOpenGlobalSettings}
        className="h-10 w-10 rounded-xl text-app-text-muted hover:text-app-text hover:bg-app-surface flex items-center justify-center transition-colors"
        title="Глобальные настройки (Ctrl+,)"
      >
        <SettingsIcon size={18} />
      </button>

      {contextMenu && (
        <ChatContextMenu
          chat={contextMenu.chat}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
