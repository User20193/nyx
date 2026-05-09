import { create } from "zustand";
import type { Chat, Message } from "../types";
import { defaultSampling } from "../types";
import {
  listChats,
  createChat as dbCreateChat,
  updateChat as dbUpdateChat,
  deleteChat as dbDeleteChat,
  listMessages,
  createMessage as dbCreateMessage,
  updateMessageContent,
  deleteMessage as dbDeleteMessage,
  deleteMessagesAfter,
  setMessagePinned,
} from "../lib/db";
import { newId } from "../lib/ids";

interface ChatState {
  loaded: boolean;
  chats: Chat[];
  activeChatId: string | null;
  messagesByChat: Record<string, Message[]>;
  streamingByChat: Record<string, boolean>;
  abortByChat: Record<string, AbortController | null>;

  load: () => Promise<void>;

  createChat: (defaultModel: string) => Promise<Chat>;
  selectChat: (id: string) => Promise<void>;
  updateChat: (chat: Chat) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  reorderChats: (orderedIds: string[]) => Promise<void>;

  addMessage: (msg: Message) => Promise<void>;
  appendToMessage: (chatId: string, messageId: string, delta: string) => void;
  finalizeMessage: (chatId: string, messageId: string) => Promise<void>;
  updateMessage: (chatId: string, messageId: string, content: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  pinMessage: (chatId: string, messageId: string, pinned: boolean) => Promise<void>;
  truncateChatFromMessage: (chatId: string, messageId: string) => Promise<void>;

  setStreaming: (chatId: string, streaming: boolean) => void;
  setAbort: (chatId: string, ctrl: AbortController | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  loaded: false,
  chats: [],
  activeChatId: null,
  messagesByChat: {},
  streamingByChat: {},
  abortByChat: {},

  async load() {
    const chats = await listChats();
    set({ loaded: true, chats });
  },

  async createChat(defaultModel) {
    const now = Date.now();
    const position = get().chats.length;
    const chat: Chat = {
      id: newId(),
      name: "Новый чат",
      model: defaultModel,
      systemPromptOverride: null,
      position,
      sampling: { ...defaultSampling },
      createdAt: now,
      updatedAt: now,
    };
    await dbCreateChat(chat);
    set({
      chats: [...get().chats, chat],
      activeChatId: chat.id,
      messagesByChat: { ...get().messagesByChat, [chat.id]: [] },
    });
    return chat;
  },

  async selectChat(id) {
    if (!get().messagesByChat[id]) {
      const messages = await listMessages(id);
      set({
        messagesByChat: { ...get().messagesByChat, [id]: messages },
      });
    }
    set({ activeChatId: id });
  },

  async updateChat(chat) {
    await dbUpdateChat(chat);
    const chats = get().chats.map((c) => (c.id === chat.id ? chat : c));
    set({ chats });
  },

  async deleteChat(id) {
    await dbDeleteChat(id);
    const chats = get().chats.filter((c) => c.id !== id);
    const messagesByChat = { ...get().messagesByChat };
    delete messagesByChat[id];
    let activeChatId = get().activeChatId;
    if (activeChatId === id) {
      activeChatId = chats[0]?.id ?? null;
      if (activeChatId && !get().messagesByChat[activeChatId]) {
        const messages = await listMessages(activeChatId);
        messagesByChat[activeChatId] = messages;
      }
    }
    set({ chats, messagesByChat, activeChatId });
  },

  async reorderChats(orderedIds) {
    const map = new Map(get().chats.map((c) => [c.id, c]));
    const reordered: Chat[] = [];
    orderedIds.forEach((id, idx) => {
      const c = map.get(id);
      if (c) reordered.push({ ...c, position: idx });
    });
    set({ chats: reordered });
    for (const c of reordered) {
      await dbUpdateChat(c);
    }
  },

  async addMessage(msg) {
    await dbCreateMessage(msg);
    const cur = get().messagesByChat[msg.chatId] ?? [];
    set({
      messagesByChat: {
        ...get().messagesByChat,
        [msg.chatId]: [...cur, msg],
      },
    });
  },

  appendToMessage(chatId, messageId, delta) {
    const cur = get().messagesByChat[chatId] ?? [];
    const next = cur.map((m) =>
      m.id === messageId ? { ...m, content: m.content + delta } : m
    );
    set({
      messagesByChat: { ...get().messagesByChat, [chatId]: next },
    });
  },

  async finalizeMessage(chatId, messageId) {
    const cur = get().messagesByChat[chatId] ?? [];
    const m = cur.find((it) => it.id === messageId);
    if (!m) return;
    await updateMessageContent(messageId, m.content);
  },

  async updateMessage(chatId, messageId, content) {
    await updateMessageContent(messageId, content);
    const cur = get().messagesByChat[chatId] ?? [];
    const next = cur.map((m) =>
      m.id === messageId ? { ...m, content } : m
    );
    set({
      messagesByChat: { ...get().messagesByChat, [chatId]: next },
    });
  },

  async deleteMessage(chatId, messageId) {
    await dbDeleteMessage(messageId);
    const cur = get().messagesByChat[chatId] ?? [];
    const next = cur.filter((m) => m.id !== messageId);
    set({
      messagesByChat: { ...get().messagesByChat, [chatId]: next },
    });
  },

  async pinMessage(chatId, messageId, pinned) {
    await setMessagePinned(messageId, pinned);
    const cur = get().messagesByChat[chatId] ?? [];
    const next = cur.map((m) => (m.id === messageId ? { ...m, pinned } : m));
    set({
      messagesByChat: { ...get().messagesByChat, [chatId]: next },
    });
  },

  async truncateChatFromMessage(chatId, messageId) {
    const cur = get().messagesByChat[chatId] ?? [];
    const idx = cur.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    const target = cur[idx];
    await deleteMessagesAfter(chatId, target.createdAt);
    set({
      messagesByChat: {
        ...get().messagesByChat,
        [chatId]: cur.slice(0, idx),
      },
    });
  },

  setStreaming(chatId, streaming) {
    set({
      streamingByChat: { ...get().streamingByChat, [chatId]: streaming },
    });
  },

  setAbort(chatId, ctrl) {
    set({
      abortByChat: { ...get().abortByChat, [chatId]: ctrl },
    });
  },
}));
