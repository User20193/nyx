import { create } from "zustand";
import {
  defaultGlobalSettings,
  type GlobalSettings,
  type Persona,
  type ApiKey,
} from "../types";
import {
  getSetting,
  setSetting,
  listPersonas,
  createPersona as dbCreatePersona,
  updatePersona as dbUpdatePersona,
  deletePersona as dbDeletePersona,
  setActivePersona as dbSetActivePersona,
  listApiKeys,
  createApiKey as dbCreateApiKey,
  setActiveApiKey as dbSetActiveApiKey,
  deleteApiKey as dbDeleteApiKey,
} from "../lib/db";
import { newId } from "../lib/ids";

let pendingGlobalWrite: ReturnType<typeof setTimeout> | null = null;
let pendingGlobalValue: GlobalSettings | null = null;

function scheduleGlobalSave(value: GlobalSettings) {
  pendingGlobalValue = value;
  if (pendingGlobalWrite) clearTimeout(pendingGlobalWrite);
  pendingGlobalWrite = setTimeout(() => {
    if (pendingGlobalValue) {
      const v = pendingGlobalValue;
      pendingGlobalValue = null;
      pendingGlobalWrite = null;
      setSetting("global", v).catch((e) =>
        console.error("[Nyx] failed to persist global settings", e)
      );
    }
  }, 250);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (pendingGlobalValue) {
      void setSetting("global", pendingGlobalValue);
      pendingGlobalValue = null;
      if (pendingGlobalWrite) clearTimeout(pendingGlobalWrite);
    }
  });
}

interface SettingsState {
  loaded: boolean;
  global: GlobalSettings;
  personas: Persona[];
  activePersona: Persona | null;
  apiKeys: ApiKey[];
  activeApiKey: ApiKey | null;

  load: () => Promise<void>;
  updateGlobal: (patch: Partial<GlobalSettings>) => Promise<void>;

  createPersona: (name: string, bio: string) => Promise<Persona>;
  updatePersona: (p: Persona) => Promise<void>;
  deletePersona: (id: string) => Promise<void>;
  setActivePersona: (id: string | null) => Promise<void>;

  addApiKey: (
    provider: string,
    name: string,
    keyValue: string,
    baseUrl: string | null
  ) => Promise<ApiKey>;
  setActiveApiKey: (id: string) => Promise<void>;
  deleteApiKey: (id: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loaded: false,
  global: defaultGlobalSettings,
  personas: [],
  activePersona: null,
  apiKeys: [],
  activeApiKey: null,

  async load() {
    const stored = await getSetting<Partial<GlobalSettings>>("global");
    const merged: GlobalSettings = { ...defaultGlobalSettings, ...(stored ?? {}) };

    const personas = await listPersonas();
    const activePersona = personas.find((p) => p.isActive) ?? null;

    const apiKeys = await listApiKeys();
    const activeApiKey = apiKeys.find((k) => k.isActive) ?? null;

    set({
      loaded: true,
      global: merged,
      personas,
      activePersona,
      apiKeys,
      activeApiKey,
    });
  },

  async updateGlobal(patch) {
    const next = { ...get().global, ...patch };
    set({ global: next });
    scheduleGlobalSave(next);
  },

  async createPersona(name, bio) {
    const persona: Persona = {
      id: newId(),
      name,
      bio,
      isActive: false,
      createdAt: Date.now(),
    };
    await dbCreatePersona(persona);
    set({ personas: [...get().personas, persona] });
    return persona;
  },

  async updatePersona(p) {
    await dbUpdatePersona(p);
    const personas = get().personas.map((it) => (it.id === p.id ? p : it));
    const activePersona = get().activePersona?.id === p.id ? p : get().activePersona;
    set({ personas, activePersona });
  },

  async deletePersona(id) {
    await dbDeletePersona(id);
    const personas = get().personas.filter((p) => p.id !== id);
    const activePersona =
      get().activePersona?.id === id ? null : get().activePersona;
    set({ personas, activePersona });
  },

  async setActivePersona(id) {
    await dbSetActivePersona(id);
    const personas = get().personas.map((p) => ({
      ...p,
      isActive: p.id === id,
    }));
    const activePersona = id ? personas.find((p) => p.id === id) ?? null : null;
    set({ personas, activePersona });
  },

  async addApiKey(provider, name, keyValue, baseUrl) {
    const key: ApiKey = {
      id: newId(),
      provider,
      name,
      keyValue,
      baseUrl,
      isActive: get().apiKeys.length === 0,
      createdAt: Date.now(),
    };
    await dbCreateApiKey(key);
    if (key.isActive) {
      await dbSetActiveApiKey(key.id);
    }
    const apiKeys = [...get().apiKeys, key];
    set({
      apiKeys,
      activeApiKey: key.isActive ? key : get().activeApiKey,
    });
    return key;
  },

  async setActiveApiKey(id) {
    await dbSetActiveApiKey(id);
    const apiKeys = get().apiKeys.map((k) => ({ ...k, isActive: k.id === id }));
    const activeApiKey = apiKeys.find((k) => k.id === id) ?? null;
    set({ apiKeys, activeApiKey });
  },

  async deleteApiKey(id) {
    await dbDeleteApiKey(id);
    const apiKeys = get().apiKeys.filter((k) => k.id !== id);
    const activeApiKey =
      get().activeApiKey?.id === id ? apiKeys[0] ?? null : get().activeApiKey;
    if (activeApiKey && get().activeApiKey?.id !== activeApiKey.id) {
      await dbSetActiveApiKey(activeApiKey.id);
    }
    set({ apiKeys, activeApiKey });
  },
}));
