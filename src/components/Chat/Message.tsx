import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Pencil, RotateCw, Trash2, Pin, GitBranch, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Message as MessageType } from "../../types";
import { useChatStore } from "../../stores/chatStore";
import { modelDisplayName } from "../../lib/modelDisplay";
import { regenerateAssistantMessage } from "../../lib/chatActions";
import { useSettingsStore } from "../../stores/settingsStore";
import { useModelStore } from "../../stores/modelStore";

interface Props {
  chatId: string;
  message: MessageType;
  chatModel: string | null;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function Message({ chatId, message, chatModel }: Props) {
  const isUser = message.role === "user";
  const updateMessage = useChatStore((s) => s.updateMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const pinMessage = useChatStore((s) => s.pinMessage);
  const truncateChatFromMessage = useChatStore((s) => s.truncateChatFromMessage);
  const settings = useSettingsStore();
  const models = useModelStore((s) => s.models);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  async function saveEdit() {
    if (draft.trim() === message.content.trim() || !draft.trim()) {
      setEditing(false);
      setDraft(message.content);
      return;
    }
    await updateMessage(chatId, message.id, draft.trim());
    setEditing(false);
  }

  async function regenerate() {
    if (!settings.activeApiKey) return;
    await regenerateAssistantMessage({
      chatId,
      messageId: message.id,
      models,
    });
  }

  async function branchHere() {
    await truncateChatFromMessage(chatId, message.id);
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      // ignore
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={`group flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && (
          <div className="text-[11px] text-app-text-muted mb-1 ml-1">
            {modelDisplayName(message.modelUsed ?? chatModel)}
          </div>
        )}

        <div
          className={`relative rounded-2xl px-4 py-2.5 ${
            isUser
              ? "bg-app-bubble-user text-white rounded-br-sm"
              : "bg-app-bubble-bot text-app-text rounded-bl-sm"
          }`}
        >
          {message.pinned && (
            <Pin
              size={10}
              className="absolute -top-1.5 -left-1.5 text-app-accent fill-app-accent rotate-45"
            />
          )}

          {editing ? (
            <div className="flex flex-col gap-2 min-w-[280px]">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={Math.min(8, draft.split("\n").length + 1)}
                className="bg-transparent text-inherit border-none outline-none resize-none w-full"
                autoFocus
              />
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraft(message.content);
                  }}
                  className="p-1 hover:bg-black/20 rounded text-xs"
                >
                  <X size={12} />
                </button>
                <button
                  onClick={saveEdit}
                  className="p-1 hover:bg-black/20 rounded text-xs"
                >
                  <Check size={12} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {isUser ? (
                <div className="message-content whitespace-pre-wrap text-[14.5px]">
                  {message.content}
                </div>
              ) : (
                <div className="message-content text-[14.5px]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              <div
                className={`text-[10px] mt-1 ${
                  isUser ? "text-white/60 text-right" : "text-app-text-muted"
                }`}
              >
                {formatTime(message.createdAt)}
              </div>
            </>
          )}
        </div>

        {!editing && (
          <div
            className={`flex gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              isUser ? "flex-row-reverse" : ""
            }`}
          >
            <button
              onClick={copyText}
              className="p-1 text-app-text-muted hover:text-app-text hover:bg-app-surface rounded"
              title="Копировать"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-app-text-muted hover:text-app-text hover:bg-app-surface rounded"
              title="Редактировать"
            >
              <Pencil size={12} />
            </button>
            {!isUser && (
              <button
                onClick={regenerate}
                className="p-1 text-app-text-muted hover:text-app-text hover:bg-app-surface rounded"
                title="Регенерировать"
              >
                <RotateCw size={12} />
              </button>
            )}
            <button
              onClick={() => pinMessage(chatId, message.id, !message.pinned)}
              className={`p-1 hover:bg-app-surface rounded ${
                message.pinned
                  ? "text-app-accent"
                  : "text-app-text-muted hover:text-app-text"
              }`}
              title={message.pinned ? "Открепить" : "Закрепить"}
            >
              <Pin size={12} />
            </button>
            <button
              onClick={branchHere}
              className="p-1 text-app-text-muted hover:text-app-text hover:bg-app-surface rounded"
              title="Удалить это и все последующие сообщения"
            >
              <GitBranch size={12} />
            </button>
            <button
              onClick={() => deleteMessage(chatId, message.id)}
              className="p-1 text-app-text-muted hover:text-app-danger hover:bg-app-surface rounded"
              title="Удалить"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
