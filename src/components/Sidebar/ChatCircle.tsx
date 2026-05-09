import { motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";
import type { Chat } from "../../types";
import { ChatAvatar } from "./ChatAvatar";

interface Props {
  chat: Chat;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function ChatCircle({
  chat,
  active,
  onClick,
  onDelete,
  onContextMenu,
}: Props) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center w-full h-14"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e);
      }}
    >
      {/* Active pill */}
      <motion.div
        initial={false}
        animate={{
          height: active ? 36 : hover ? 14 : 0,
          opacity: active ? 1 : hover ? 0.5 : 0,
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute -left-0.5 w-1 rounded-r-full"
        style={{ background: "var(--color-app-accent)" }}
      />

      {/* Glow halo */}
      <motion.div
        initial={false}
        animate={{
          opacity: active ? 0.55 : hover ? 0.25 : 0,
          scale: active ? 1.05 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="absolute h-12 w-12 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--color-app-accent) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      <motion.button
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        animate={{
          borderRadius: active ? 16 : 24,
        }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className="relative h-12 w-12 overflow-hidden ring-1 ring-white/5 shadow-lg"
        title={chat.name}
        style={{
          boxShadow: active
            ? "0 4px 14px rgba(0,0,0,0.35), 0 0 0 2px var(--color-app-accent-soft)"
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <ChatAvatar chat={chat} size={48} />
      </motion.button>

      {/* Hover X delete */}
      <motion.button
        initial={false}
        animate={{
          opacity: hover ? 1 : 0,
          scale: hover ? 1 : 0.6,
          pointerEvents: hover ? "auto" : "none",
        }}
        transition={{ duration: 0.15 }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-0 right-1 h-5 w-5 rounded-full bg-app-danger text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        title="Удалить чат"
        style={{ pointerEvents: hover ? "auto" : "none" }}
      >
        <X size={11} strokeWidth={3} />
      </motion.button>
    </div>
  );
}
