import { useState } from "react";
import {
  Pencil,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { Chat } from "../../types";
import { useChatStore } from "../../stores/chatStore";
import { modelDisplayName } from "../../lib/modelDisplay";
import { ChatAvatar } from "../Sidebar/ChatAvatar";

interface Props {
  chat: Chat;
  onToggleSettings: () => void;
  settingsOpen: boolean;
}

export function ChatHeader({ chat, onToggleSettings, settingsOpen }: Props) {
  const updateChat = useChatStore((s) => s.updateChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(chat.name);

  async function save() {
    if (!name.trim()) {
      setName(chat.name);
      setEditing(false);
      return;
    }
    await updateChat({ ...chat, name: name.trim(), updatedAt: Date.now() });
    setEditing(false);
  }

  return (
    <div className="h-14 px-5 flex items-center justify-between border-b border-app-border-soft bg-app-bg/40 backdrop-blur-md">
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-full overflow-hidden ring-1 ring-white/5">
          <ChatAvatar chat={chat} size={32} />
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") {
                  setName(chat.name);
                  setEditing(false);
                }
              }}
              autoFocus
              className="bg-app-surface border border-app-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-app-accent"
            />
            <button
              onClick={save}
              className="p-1 text-app-success hover:bg-app-surface rounded"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => {
                setName(chat.name);
                setEditing(false);
              }}
              className="p-1 text-app-text-muted hover:bg-app-surface rounded"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                {chat.name}
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 text-app-text-muted hover:text-app-text hover:bg-app-surface rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Переименовать чат"
                >
                  <Pencil size={11} />
                </button>
              </div>
              <div className="text-xs text-app-text-muted truncate">
                {modelDisplayName(chat.model)}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            if (confirm(`Удалить чат "${chat.name}"?`)) {
              deleteChat(chat.id);
            }
          }}
          className="p-2 text-app-text-muted hover:text-app-danger hover:bg-app-surface rounded transition-colors"
          title="Удалить чат"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onToggleSettings}
          className="p-2 text-app-text-muted hover:text-app-text hover:bg-app-surface rounded transition-colors"
          title={settingsOpen ? "Скрыть настройки (Ctrl+B)" : "Показать настройки (Ctrl+B)"}
        >
          {settingsOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>
    </div>
  );
}
