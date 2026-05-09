import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { GameStatePanel } from "../Game/GameStatePanel";
import { useChatStore } from "../../stores/chatStore";

const EMPTY_MESSAGES: never[] = [];

interface Props {
  onToggleSettings: () => void;
  settingsOpen: boolean;
}

export function ChatArea({ onToggleSettings, settingsOpen }: Props) {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const chat = useChatStore((s) =>
    s.activeChatId ? s.chats.find((c) => c.id === s.activeChatId) : undefined
  );
  // Use stable EMPTY_MESSAGES sentinel so the selector returns the same
  // reference when there are no messages — otherwise a fresh `[]` on every
  // render triggers infinite re-renders in React 18.
  const messages = useChatStore((s) => {
    const list = s.activeChatId ? s.messagesByChat[s.activeChatId] : undefined;
    return list ?? EMPTY_MESSAGES;
  });
  const streaming = useChatStore((s) =>
    activeChatId ? !!s.streamingByChat[activeChatId] : false
  );

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-app-text-muted text-sm">
        Нет активного чата
      </div>
    );
  }

  const isGm = chat.gameMode === "gm";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <ChatHeader
        chat={chat}
        onToggleSettings={onToggleSettings}
        settingsOpen={settingsOpen}
      />
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <MessageList
            chatId={chat.id}
            messages={messages}
            streaming={streaming}
            chatModel={chat.model}
            isGm={isGm}
          />
          <MessageInput chat={chat} />
        </div>
        {isGm && (
          <div className="w-[300px] shrink-0 border-l border-app-border-soft bg-app-sidebar/40 backdrop-blur-md hidden xl:block">
            <GameStatePanel chat={chat} />
          </div>
        )}
      </div>
    </div>
  );
}
