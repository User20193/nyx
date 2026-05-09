import { create } from "zustand";
import type { Chat, Message, AvatarStyle, GameState } from "../types";
import { defaultSampling, AVATAR_STYLES } from "../types";
import { getScenario } from "../lib/scenarios";
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
  createGmChat: (
    defaultModel: string,
    scenarioId: string,
    opening: {
      name: string;
      playerRole: string;
      authorNote: string;
      initialState: GameState;
      scenarioPrompt: string | null;
    }
  ) => Promise<Chat>;
  selectChat: (id: string) => Promise<void>;
  updateChat: (chat: Chat) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  reorderChats: (orderedIds: string[]) => Promise<void>;
  applyGameState: (chatId: string, state: GameState) => Promise<void>;
  resetGameState: (chatId: string) => Promise<void>;

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
    const chat = makeNormalChat({
      defaultModel,
      position: get().chats.length,
    });
    await dbCreateChat(chat);
    set({
      chats: [...get().chats, chat],
      activeChatId: chat.id,
      messagesByChat: { ...get().messagesByChat, [chat.id]: [] },
    });
    return chat;
  },

  async createGmChat(defaultModel, scenarioId, opening) {
    const chat = makeGmChat({
      defaultModel,
      position: get().chats.length,
      scenarioId,
      ...opening,
    });
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

  async applyGameState(chatId, state) {
    const cur = get().chats.find((c) => c.id === chatId);
    if (!cur) return;
    const updated: Chat = {
      ...cur,
      gameState: state,
      updatedAt: Date.now(),
    };
    await dbUpdateChat(updated);
    set({
      chats: get().chats.map((c) => (c.id === chatId ? updated : c)),
    });
  },

  async resetGameState(chatId) {
    const cur = get().chats.find((c) => c.id === chatId);
    if (!cur || !cur.initialState) return;
    const updated: Chat = {
      ...cur,
      gameState: JSON.parse(JSON.stringify(cur.initialState)) as GameState,
      updatedAt: Date.now(),
    };
    await dbUpdateChat(updated);
    set({
      chats: get().chats.map((c) => (c.id === chatId ? updated : c)),
    });
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

function makeNormalChat(args: {
  defaultModel: string;
  position: number;
}): Chat {
  const now = Date.now();
  const id = newId();
  const style: AvatarStyle =
    AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
  return {
    id,
    name: "Новый чат",
    model: args.defaultModel,
    systemPromptOverride: null,
    position: args.position,
    sampling: { ...defaultSampling },
    avatarSeed: id + "-" + Math.random().toString(36).slice(2, 8),
    avatarStyle: style,
    gameMode: "normal",
    gameState: null,
    initialState: null,
    authorNote: null,
    scenarioId: null,
    scenarioPrompt: null,
    playerRole: null,
    createdAt: now,
    updatedAt: now,
  };
}

function makeGmChat(args: {
  defaultModel: string;
  position: number;
  scenarioId: string;
  name: string;
  playerRole: string;
  authorNote: string;
  initialState: GameState;
  scenarioPrompt: string | null;
}): Chat {
  const now = Date.now();
  const id = newId();
  const scenario = getScenario(args.scenarioId);
  // GM chats have a fixed avatar style for visual consistency,
  // but a random seed so different sessions look different.
  const style: AvatarStyle = "marble";
  return {
    id,
    name: args.name || scenario?.chatName || "GM-сценарий",
    model: args.defaultModel,
    systemPromptOverride: null,
    position: args.position,
    sampling: { ...defaultSampling, temperature: 0.85, maxTokens: 2400 },
    avatarSeed: id + "-" + Math.random().toString(36).slice(2, 8),
    avatarStyle: style,
    gameMode: "gm",
    gameState: JSON.parse(JSON.stringify(args.initialState)) as GameState,
    initialState: JSON.parse(JSON.stringify(args.initialState)) as GameState,
    authorNote: args.authorNote,
    scenarioId: args.scenarioId,
    scenarioPrompt: args.scenarioPrompt,
    playerRole: args.playerRole,
    createdAt: now,
    updatedAt: now,
  };
}
