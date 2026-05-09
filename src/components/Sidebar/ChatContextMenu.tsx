import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trash2, Shuffle, Edit2, Sparkles } from "lucide-react";
import type { Chat } from "../../types";
import { AVATAR_STYLES } from "../../types";
import { useChatStore } from "../../stores/chatStore";

interface Props {
  chat: Chat;
  x: number;
  y: number;
  onClose: () => void;
}

export function ChatContextMenu({ chat, x, y, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const updateChat = useChatStore((s) => s.updateChat);
  const deleteChat = useChatStore((s) => s.deleteChat);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function escHandler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    setTimeout(() => {
      document.addEventListener("mousedown", handler);
      document.addEventListener("keydown", escHandler);
    }, 0);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [onClose]);

  function rename() {
    const next = prompt("Новое название чата:", chat.name);
    if (next && next.trim()) {
      void updateChat({ ...chat, name: next.trim(), updatedAt: Date.now() });
    }
    onClose();
  }

  function shuffle() {
    void updateChat({
      ...chat,
      avatarSeed:
        chat.id + "-" + Math.random().toString(36).slice(2, 10),
      updatedAt: Date.now(),
    });
    onClose();
  }

  function nextStyle() {
    const idx = AVATAR_STYLES.indexOf(chat.avatarStyle);
    const next = AVATAR_STYLES[(idx + 1) % AVATAR_STYLES.length];
    void updateChat({ ...chat, avatarStyle: next, updatedAt: Date.now() });
    onClose();
  }

  function remove() {
    if (confirm(`Удалить чат "${chat.name}"?`)) {
      void deleteChat(chat.id);
    }
    onClose();
  }

  // Clamp menu inside viewport
  const menuW = 220;
  const menuH = 180;
  const left = Math.min(x, window.innerWidth - menuW - 8);
  const top = Math.min(y, window.innerHeight - menuH - 8);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
      className="fixed z-50 rounded-xl border border-app-border bg-app-bg/95 backdrop-blur-md shadow-2xl py-1.5 text-sm overflow-hidden"
      style={{ left, top, width: menuW }}
    >
      <MenuItem icon={<Edit2 size={14} />} onClick={rename}>
        Переименовать
      </MenuItem>
      <MenuItem icon={<Shuffle size={14} />} onClick={shuffle}>
        Сменить аватар
      </MenuItem>
      <MenuItem icon={<Sparkles size={14} />} onClick={nextStyle}>
        Стиль: {chat.avatarStyle}
      </MenuItem>
      <div className="h-px bg-app-border-soft my-1" />
      <MenuItem
        icon={<Trash2 size={14} />}
        onClick={remove}
        danger
      >
        Удалить чат
      </MenuItem>
    </motion.div>
  );
}

function MenuItem({
  icon,
  onClick,
  children,
  danger,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-app-surface text-left transition-colors ${
        danger ? "text-app-danger" : "text-app-text"
      }`}
    >
      <span className={danger ? "text-app-danger" : "text-app-text-dim"}>
        {icon}
      </span>
      {children}
    </button>
  );
}
