import Database from "@tauri-apps/plugin-sql";
import type {
  Chat,
  Message,
  Persona,
  ApiKey,
  SamplingSettings,
  AvatarStyle,
  GameMode,
  GameState,
} from "../types";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:nyx.db");
  }
  return dbInstance;
}

interface ChatRow {
  id: string;
  name: string;
  model: string | null;
  system_prompt_override: string | null;
  position: number;
  sampling_json: string | null;
  avatar_seed: string | null;
  avatar_style: string | null;
  game_mode: string | null;
  game_state: string | null;
  initial_state: string | null;
  author_note: string | null;
  scenario_id: string | null;
  scenario_prompt: string | null;
  player_role: string | null;
  created_at: number;
  updated_at: number;
}

function safeJson<T>(s: string | null | undefined): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function rowToChat(r: ChatRow): Chat {
  return {
    id: r.id,
    name: r.name,
    model: r.model,
    systemPromptOverride: r.system_prompt_override,
    position: r.position,
    sampling: safeJson<SamplingSettings>(r.sampling_json),
    avatarSeed: r.avatar_seed ?? r.id,
    avatarStyle: ((r.avatar_style as AvatarStyle) || "beam"),
    gameMode: ((r.game_mode as GameMode) || "normal"),
    gameState: safeJson<GameState>(r.game_state),
    initialState: safeJson<GameState>(r.initial_state),
    authorNote: r.author_note,
    scenarioId: r.scenario_id,
    scenarioPrompt: r.scenario_prompt,
    playerRole: r.player_role,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listChats(): Promise<Chat[]> {
  const db = await getDb();
  const rows = await db.select<ChatRow[]>(
    "SELECT * FROM chats ORDER BY position ASC, updated_at DESC"
  );
  return rows.map(rowToChat);
}

export async function createChat(chat: Chat): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO chats (
       id, name, model, system_prompt_override, position, sampling_json,
       avatar_seed, avatar_style,
       game_mode, game_state, initial_state, author_note,
       scenario_id, scenario_prompt, player_role,
       created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      chat.id,
      chat.name,
      chat.model,
      chat.systemPromptOverride,
      chat.position,
      chat.sampling ? JSON.stringify(chat.sampling) : null,
      chat.avatarSeed,
      chat.avatarStyle,
      chat.gameMode,
      chat.gameState ? JSON.stringify(chat.gameState) : null,
      chat.initialState ? JSON.stringify(chat.initialState) : null,
      chat.authorNote,
      chat.scenarioId,
      chat.scenarioPrompt,
      chat.playerRole,
      chat.createdAt,
      chat.updatedAt,
    ]
  );
}

export async function updateChat(chat: Chat): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE chats
     SET name = $1, model = $2, system_prompt_override = $3, position = $4,
         sampling_json = $5, avatar_seed = $6, avatar_style = $7,
         game_mode = $8, game_state = $9, initial_state = $10, author_note = $11,
         scenario_id = $12, scenario_prompt = $13, player_role = $14,
         updated_at = $15
     WHERE id = $16`,
    [
      chat.name,
      chat.model,
      chat.systemPromptOverride,
      chat.position,
      chat.sampling ? JSON.stringify(chat.sampling) : null,
      chat.avatarSeed,
      chat.avatarStyle,
      chat.gameMode,
      chat.gameState ? JSON.stringify(chat.gameState) : null,
      chat.initialState ? JSON.stringify(chat.initialState) : null,
      chat.authorNote,
      chat.scenarioId,
      chat.scenarioPrompt,
      chat.playerRole,
      chat.updatedAt,
      chat.id,
    ]
  );
}

export async function deleteChat(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM messages WHERE chat_id = $1", [id]);
  await db.execute("DELETE FROM chats WHERE id = $1", [id]);
}

interface MessageRow {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  model_used: string | null;
  parent_id: string | null;
  branch_id: string | null;
  pinned: number;
  created_at: number;
}

function rowToMessage(r: MessageRow): Message {
  return {
    id: r.id,
    chatId: r.chat_id,
    role: r.role as Message["role"],
    content: r.content,
    modelUsed: r.model_used,
    parentId: r.parent_id,
    branchId: r.branch_id,
    pinned: r.pinned === 1,
    createdAt: r.created_at,
  };
}

export async function listMessages(chatId: string): Promise<Message[]> {
  const db = await getDb();
  const rows = await db.select<MessageRow[]>(
    "SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
    [chatId]
  );
  return rows.map(rowToMessage);
}

export async function createMessage(m: Message): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO messages (id, chat_id, role, content, model_used, parent_id, branch_id, pinned, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      m.id,
      m.chatId,
      m.role,
      m.content,
      m.modelUsed,
      m.parentId,
      m.branchId,
      m.pinned ? 1 : 0,
      m.createdAt,
    ]
  );
}

export async function updateMessageContent(
  id: string,
  content: string
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE messages SET content = $1 WHERE id = $2", [
    content,
    id,
  ]);
}

export async function setMessagePinned(
  id: string,
  pinned: boolean
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE messages SET pinned = $1 WHERE id = $2", [
    pinned ? 1 : 0,
    id,
  ]);
}

export async function deleteMessage(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM messages WHERE id = $1", [id]);
}

export async function deleteMessagesAfter(
  chatId: string,
  createdAt: number
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "DELETE FROM messages WHERE chat_id = $1 AND created_at >= $2",
    [chatId, createdAt]
  );
}

interface PersonaRow {
  id: string;
  name: string;
  bio: string;
  is_active: number;
  created_at: number;
}

function rowToPersona(r: PersonaRow): Persona {
  return {
    id: r.id,
    name: r.name,
    bio: r.bio,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
  };
}

export async function listPersonas(): Promise<Persona[]> {
  const db = await getDb();
  const rows = await db.select<PersonaRow[]>(
    "SELECT * FROM personas ORDER BY created_at ASC"
  );
  return rows.map(rowToPersona);
}

export async function createPersona(p: Persona): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO personas (id, name, bio, is_active, created_at) VALUES ($1, $2, $3, $4, $5)",
    [p.id, p.name, p.bio, p.isActive ? 1 : 0, p.createdAt]
  );
}

export async function updatePersona(p: Persona): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE personas SET name = $1, bio = $2 WHERE id = $3",
    [p.name, p.bio, p.id]
  );
}

export async function deletePersona(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM personas WHERE id = $1", [id]);
}

export async function setActivePersona(id: string | null): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE personas SET is_active = 0", []);
  if (id) {
    await db.execute("UPDATE personas SET is_active = 1 WHERE id = $1", [id]);
  }
}

interface ApiKeyRow {
  id: string;
  provider: string;
  name: string;
  key_value: string;
  base_url: string | null;
  is_active: number;
  created_at: number;
}

function rowToApiKey(r: ApiKeyRow): ApiKey {
  return {
    id: r.id,
    provider: r.provider,
    name: r.name,
    keyValue: r.key_value,
    baseUrl: r.base_url,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
  };
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const db = await getDb();
  const rows = await db.select<ApiKeyRow[]>(
    "SELECT * FROM api_keys ORDER BY created_at ASC"
  );
  return rows.map(rowToApiKey);
}

export async function createApiKey(k: ApiKey): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO api_keys (id, provider, name, key_value, base_url, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      k.id,
      k.provider,
      k.name,
      k.keyValue,
      k.baseUrl,
      k.isActive ? 1 : 0,
      k.createdAt,
    ]
  );
}

export async function setActiveApiKey(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE api_keys SET is_active = 0", []);
  await db.execute("UPDATE api_keys SET is_active = 1 WHERE id = $1", [id]);
}

export async function deleteApiKey(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM api_keys WHERE id = $1", [id]);
}

interface SettingRow {
  key: string;
  value: string;
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const rows = await db.select<SettingRow[]>(
    "SELECT * FROM settings WHERE key = $1",
    [key]
  );
  if (rows.length === 0) return null;
  try {
    return JSON.parse(rows[0].value) as T;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  const stringValue = JSON.stringify(value);
  await db.execute(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, stringValue]
  );
}

export async function resetAllData(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM messages", []);
  await db.execute("DELETE FROM chats", []);
  await db.execute("DELETE FROM personas", []);
  await db.execute("DELETE FROM settings", []);
  await db.execute("DELETE FROM api_keys", []);
}
