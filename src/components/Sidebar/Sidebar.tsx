import { Plus, Settings as SettingsIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { ChatCircle } from "./ChatCircle";

interface Props {
  onOpenGlobalSettings: () => void;
}

export function Sidebar({ onOpenGlobalSettings }: Props) {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const selectChat = useChatStore((s) => s.selectChat);
  const createChat = useChatStore((s) => s.createChat);
  const defaultModel = useSettingsStore((s) => s.global.defaultModel);

  return (
    <div className="w-[72px] bg-app-sidebar border-r border-app-border flex flex-col items-center py-3">
      <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto w-full no-scrollbar">
        <AnimatePresence initial={false}>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
            >
              <ChatCircle
                chat={chat}
                active={chat.id === activeChatId}
                onClick={() => selectChat(chat.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => createChat(defaultModel)}
          className="mt-2 h-12 w-12 rounded-2xl bg-app-surface border border-dashed border-app-border-soft text-app-text-dim hover:bg-app-accent/15 hover:text-app-accent hover:border-app-accent/40 flex items-center justify-center transition-colors"
          title="Новый чат"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      <button
        onClick={onOpenGlobalSettings}
        className="mt-3 h-10 w-10 rounded-xl text-app-text-muted hover:text-app-text hover:bg-app-surface flex items-center justify-center transition-colors"
        title="Глобальные настройки"
      >
        <SettingsIcon size={18} />
      </button>
    </div>
  );
}
