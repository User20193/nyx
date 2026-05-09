import { useState } from "react";
import { Plus, Settings as SettingsIcon } from "lucide-react";
import { motion, Reorder } from "framer-motion";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { ChatCircle } from "./ChatCircle";
import { ChatContextMenu } from "./ChatContextMenu";
import type { Chat } from "../../types";

interface Props {
  onOpenGlobalSettings: () => void;
}

export function Sidebar({ onOpenGlobalSettings }: Props) {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const selectChat = useChatStore((s) => s.selectChat);
  const createChat = useChatStore((s) => s.createChat);
  const reorderChats = useChatStore((s) => s.reorderChats);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const defaultModel = useSettingsStore((s) => s.global.defaultModel);

  const [contextMenu, setContextMenu] = useState<{
    chat: Chat;
    x: number;
    y: number;
  } | null>(null);

  function handleDelete(chat: Chat) {
    if (confirm(`Удалить чат "${chat.name}"? Это действие нельзя отменить.`)) {
      void deleteChat(chat.id);
    }
  }

  return (
    <div className="w-[76px] bg-app-sidebar/70 backdrop-blur-xl border-r border-app-border-soft flex flex-col items-center pt-4 pb-3 relative">
      {/* Logo */}
      <div className="mb-4 select-none">
        <motion.div
          whileHover={{ scale: 1.06, rotate: -6 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="h-10 w-10 rounded-2xl flex items-center justify-center font-semibold text-app-accent text-lg"
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

      <div className="w-full h-px bg-app-border-soft mb-3" />

      <Reorder.Group
        axis="y"
        values={chats}
        onReorder={(reordered) => {
          void reorderChats(reordered.map((c) => c.id));
        }}
        className="flex-1 flex flex-col items-center gap-1 overflow-y-auto w-full no-scrollbar"
      >
        {chats.map((chat) => (
          <Reorder.Item
            key={chat.id}
            value={chat}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            className="cursor-grab active:cursor-grabbing"
            whileDrag={{ scale: 1.08, zIndex: 10 }}
          >
            <ChatCircle
              chat={chat}
              active={chat.id === activeChatId}
              onClick={() => selectChat(chat.id)}
              onDelete={() => handleDelete(chat)}
              onContextMenu={(e) => {
                setContextMenu({ chat, x: e.clientX, y: e.clientY });
              }}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => createChat(defaultModel)}
        className="mt-2 h-12 w-12 rounded-2xl bg-app-surface/80 border border-dashed border-app-border-soft text-app-text-dim hover:bg-app-accent/15 hover:text-app-accent hover:border-app-accent/40 flex items-center justify-center transition-colors backdrop-blur-md"
        title="Новый чат"
      >
        <Plus size={20} />
      </motion.button>

      <div className="w-full h-px bg-app-border-soft my-3" />

      <button
        onClick={onOpenGlobalSettings}
        className="h-10 w-10 rounded-xl text-app-text-muted hover:text-app-text hover:bg-app-surface flex items-center justify-center transition-colors"
        title="Глобальные настройки"
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
