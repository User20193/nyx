import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Message as MessageType } from "../../types";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";

interface Props {
  chatId: string;
  messages: MessageType[];
  streaming: boolean;
  chatModel: string | null;
}

export function MessageList({ chatId, messages, streaming, chatModel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);
  const visible = messages.filter((m) => m.role !== "system");
  const lastBot = [...visible].reverse().find((m) => m.role === "assistant");
  const showTyping = streaming && (!lastBot || lastBot.content.length === 0);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (visible.length !== prevLenRef.current || nearBottom) {
      el.scrollTo({ top: el.scrollHeight });
    }
    prevLenRef.current = visible.length;
  }, [visible.length, visible[visible.length - 1]?.content]);

  if (visible.length === 0 && !streaming) {
    return (
      <div className="flex-1 overflow-y-auto" ref={ref}>
        <div className="h-full flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="text-app-text-dim text-sm">
              Напиши что-нибудь, чтобы начать разговор
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" ref={ref}>
      <div className="px-5 py-6 space-y-2 max-w-4xl mx-auto">
        <AnimatePresence initial={false}>
          {visible.map((m) => (
            <Message
              key={m.id}
              chatId={chatId}
              message={m}
              chatModel={chatModel}
            />
          ))}
          {showTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex"
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
