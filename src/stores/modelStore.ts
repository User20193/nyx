import { create } from "zustand";
import type { ModelInfo } from "../types";
import { fetchModels } from "../lib/openrouter";

interface ModelState {
  models: ModelInfo[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number;
  load: (apiKey: string, baseUrl: string | null, force?: boolean) => Promise<void>;
}

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  loading: false,
  error: null,
  lastFetchedAt: 0,

  async load(apiKey, baseUrl, force) {
    const now = Date.now();
    if (
      !force &&
      get().models.length > 0 &&
      now - get().lastFetchedAt < CACHE_TTL_MS
    ) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const models = await fetchModels(apiKey, baseUrl);
      models.sort((a, b) => {
        if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      set({ models, loading: false, lastFetchedAt: now });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
