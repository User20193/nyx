import { useMemo } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChatStore } from "../../stores/chatStore";

interface Props {
  onToggleSettings: () => void;
  settingsOpen: boolean;
}

export function ChatArea({ onToggleSettings, settingsOpen }: Props) {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const chat = useChatStore((s) =>
    s.chats.find((c) => c.id === s.activeChatId)
  );
  const messages = useChatStore((s) =>
    activeChatId ? s.messagesByChat[activeChatId] ?? [] : []
  );
  const streaming = useChatStore((s) =>
    activeChatId ? !!s.streamingByChat[activeChatId] : false
  );

  const memoizedMessages = useMemo(() => messages, [messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-app-text-muted text-sm">
        Нет активного чата
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-app-bg">
      <ChatHeader
        chat={chat}
        onToggleSettings={onToggleSettings}
        settingsOpen={settingsOpen}
      />
      <MessageList
        chatId={chat.id}
        messages={memoizedMessages}
        streaming={streaming}
        chatModel={chat.model}
      />
      <MessageInput chat={chat} />
    </div>
  );
}
