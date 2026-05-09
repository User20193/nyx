import { motion } from "framer-motion";
import type { Chat } from "../../types";
import { modelInitials, modelColor } from "../../lib/modelDisplay";

interface Props {
  chat: Chat;
  active: boolean;
  onClick: () => void;
}

export function ChatCircle({ chat, active, onClick }: Props) {
  const initials = modelInitials(chat.model);
  const color = modelColor(chat.model);

  return (
    <div className="relative flex items-center justify-center w-full h-12">
      <motion.div
        initial={false}
        animate={{
          height: active ? 28 : 8,
          opacity: active ? 1 : 0,
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute -left-0.5 w-1 rounded-r-full bg-app-accent"
      />
      <motion.button
        layout
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        animate={{
          borderRadius: active ? 14 : 24,
        }}
        transition={{ duration: 0.18 }}
        onClick={onClick}
        className="relative h-12 w-12 flex items-center justify-center font-semibold text-sm text-white shadow-md overflow-hidden"
        style={{
          backgroundColor: color,
        }}
        title={chat.name}
      >
        {initials}
      </motion.button>
    </div>
  );
}
