import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2, Check, Edit2, Key as KeyIcon } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { useModelStore } from "../../stores/modelStore";
import { SystemPromptEditor } from "./SystemPromptEditor";
import { ModelPicker } from "./ModelPicker";

interface Props {
  onClose: () => void;
}

type Tab = "general" | "personas" | "uncensored" | "keys";

export function GlobalSettingsModal({ onClose }: Props) {
  const settings = useSettingsStore();
  const models = useModelStore((s) => s.models);
  const [tab, setTab] = useState<Tab>("general");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 6 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-app-bg border border-app-border rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="h-14 px-5 flex items-center justify-between border-b border-app-border">
          <div className="text-base font-semibold">Настройки</div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-app-surface rounded-md text-app-text-muted hover:text-app-text"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-44 border-r border-app-border bg-app-sidebar p-2 space-y-0.5">
            <TabButton current={tab} value="general" onClick={() => setTab("general")} label="Общие" />
            <TabButton current={tab} value="personas" onClick={() => setTab("personas")} label="Персоны" />
            <TabButton current={tab} value="uncensored" onClick={() => setTab("uncensored")} label="Без цензуры" />
            <TabButton current={tab} value="keys" onClick={() => setTab("keys")} label="API-ключи" />
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {tab === "general" && (
              <>
                <ModelPicker
                  value={settings.global.defaultModel}
                  onChange={(v) => settings.updateGlobal({ defaultModel: v })}
                />
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-app-text-dim mb-2 font-semibold">
                    Резервная модель (fallback)
                  </label>
                  <select
                    value={settings.global.fallbackModel ?? ""}
                    onChange={(e) =>
                      settings.updateGlobal({
                        fallbackModel: e.target.value || null,
                      })
                    }
                    className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-app-accent"
                  >
                    <option value="">— нет —</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.isFree ? "★ " : ""}
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <SystemPromptEditor
                  label="Глобальный системный промпт"
                  value={settings.global.globalSystemPrompt}
                  onChange={(v) => settings.updateGlobal({ globalSystemPrompt: v })}
                  placeholder="Применяется ко всем чатам как базовый системный промпт"
                />
                <ToggleRow
                  label="Стриминг ответов"
                  description="Показывает токены по мере генерации"
                  value={settings.global.streamingEnabled}
                  onChange={(v) => settings.updateGlobal({ streamingEnabled: v })}
                />
                <ToggleRow
                  label="Авто-имя чатов"
                  description="После первого ответа модель сама придумывает короткое название"
                  value={settings.global.autoNameChats}
                  onChange={(v) => settings.updateGlobal({ autoNameChats: v })}
                />
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-app-text-dim mb-2 font-semibold">
                    Акцентный цвет
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.global.accentColor}
                      onChange={(e) =>
                        settings.updateGlobal({ accentColor: e.target.value })
                      }
                      className="h-9 w-9 rounded cursor-pointer bg-transparent border border-app-border"
                    />
                    <input
                      type="text"
                      value={settings.global.accentColor}
                      onChange={(e) =>
                        settings.updateGlobal({ accentColor: e.target.value })
                      }
                      className="bg-app-surface border border-app-border rounded-md px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-app-accent"
                    />
                  </div>
                </div>
              </>
            )}

            {tab === "personas" && <PersonasTab />}
            {tab === "uncensored" && <UncensoredTab />}
            {tab === "keys" && <KeysTab />}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TabButton({
  current,
  value,
  onClick,
  label,
}: {
  current: Tab;
  value: Tab;
  onClick: () => void;
  label: string;
}) {
  const active = current === value;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? "bg-app-accent/15 text-app-accent"
          : "text-app-text-dim hover:bg-app-surface hover:text-app-text"
      }`}
    >
      {label}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm">{label}</div>
        {description && (
          <div className="text-[11px] text-app-text-muted mt-0.5">
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors"
        style={{
          backgroundColor: value ? "var(--color-app-accent)" : "#3a4150",
        }}
        aria-pressed={value}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          className="inline-block h-4 w-4 rounded-full bg-white shadow"
          style={{
            marginTop: 2,
            marginLeft: value ? 18 : 2,
          }}
        />
      </button>
    </div>
  );
}

function PersonasTab() {
  const settings = useSettingsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [creating, setCreating] = useState(false);

  function startEdit(id: string) {
    const p = settings.personas.find((it) => it.id === id);
    if (!p) return;
    setEditingId(id);
    setDraftName(p.name);
    setDraftBio(p.bio);
    setCreating(false);
  }

  async function saveEdit() {
    if (!editingId) return;
    const p = settings.personas.find((it) => it.id === editingId);
    if (!p) return;
    await settings.updatePersona({
      ...p,
      name: draftName.trim() || p.name,
      bio: draftBio,
    });
    setEditingId(null);
  }

  async function startCreate() {
    setCreating(true);
    setEditingId(null);
    setDraftName("");
    setDraftBio("");
  }

  async function saveCreate() {
    if (!draftName.trim()) return;
    await settings.createPersona(draftName.trim(), draftBio);
    setCreating(false);
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-app-text-muted leading-relaxed">
        Информация о тебе, которая подмешивается в системный промпт. Можно создать несколько профилей и переключаться.
      </div>

      <div className="space-y-2">
        {settings.personas.map((p) => {
          const isEditing = editingId === p.id;
          return (
            <div
              key={p.id}
              className={`bg-app-surface border rounded-lg p-3 ${
                p.isActive
                  ? "border-app-accent"
                  : "border-app-border"
              }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Имя"
                    className="w-full bg-app-bg border border-app-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-app-accent"
                  />
                  <textarea
                    value={draftBio}
                    onChange={(e) => setDraftBio(e.target.value)}
                    placeholder="Био / описание"
                    rows={3}
                    className="w-full bg-app-bg border border-app-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-app-accent resize-y"
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-xs text-app-text-muted hover:text-app-text"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 text-xs bg-app-accent text-white rounded-md hover:bg-app-accent-hover"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{p.name}</span>
                      {p.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-app-accent/15 text-app-accent rounded">
                          активна
                        </span>
                      )}
                    </div>
                    {p.bio && (
                      <div className="text-[11px] text-app-text-muted mt-1 line-clamp-2">
                        {p.bio}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() =>
                        settings.setActivePersona(p.isActive ? null : p.id)
                      }
                      className={`p-1.5 rounded ${
                        p.isActive
                          ? "text-app-accent hover:bg-app-bg"
                          : "text-app-text-muted hover:text-app-text hover:bg-app-bg"
                      }`}
                      title={p.isActive ? "Деактивировать" : "Активировать"}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => startEdit(p.id)}
                      className="p-1.5 rounded text-app-text-muted hover:text-app-text hover:bg-app-bg"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => settings.deletePersona(p.id)}
                      className="p-1.5 rounded text-app-text-muted hover:text-app-danger hover:bg-app-bg"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {creating ? (
        <div className="bg-app-surface border border-app-accent/40 rounded-lg p-3 space-y-2">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Имя (например: Программист)"
            className="w-full bg-app-bg border border-app-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-app-accent"
            autoFocus
          />
          <textarea
            value={draftBio}
            onChange={(e) => setDraftBio(e.target.value)}
            placeholder="Био — кто ты, что любишь, как с тобой общаться"
            rows={3}
            className="w-full bg-app-bg border border-app-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-app-accent resize-y"
          />
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-1 text-xs text-app-text-muted hover:text-app-text"
            >
              Отмена
            </button>
            <button
              onClick={saveCreate}
              disabled={!draftName.trim()}
              className="px-3 py-1 text-xs bg-app-accent text-white rounded-md hover:bg-app-accent-hover disabled:opacity-40"
            >
              Создать
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startCreate}
          className="w-full border border-dashed border-app-border rounded-lg px-3 py-2 text-sm text-app-text-dim hover:text-app-accent hover:border-app-accent flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus size={14} />
          Создать персону
        </button>
      )}
    </div>
  );
}

function UncensoredTab() {
  const settings = useSettingsStore();
  return (
    <div className="space-y-3">
      <ToggleRow
        label="Включить режим без цензуры"
        description="Добавляет permissive system prompt в каждый чат"
        value={settings.global.uncensoredEnabled}
        onChange={(v) => settings.updateGlobal({ uncensoredEnabled: v })}
      />
      <SystemPromptEditor
        label="Текст промпта"
        value={settings.global.uncensoredPrompt}
        onChange={(v) => settings.updateGlobal({ uncensoredPrompt: v })}
      />
      <div className="text-[11px] text-app-text-muted leading-relaxed bg-app-surface/60 border border-app-border rounded-md p-3">
        Совет: лучше всего работает с моделями типа Mistral Nemo, файнтюнами Llama и DeepSeek. Некоторые модели всё равно фильтруют контент на стороне провайдера — пробуй разные.
      </div>
    </div>
  );
}

function KeysTab() {
  const settings = useSettingsStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<"openrouter" | "openai-compat">(
    "openrouter"
  );
  const [keyValue, setKeyValue] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  async function add() {
    if (!keyValue.trim()) return;
    const finalBase =
      provider === "openrouter"
        ? "https://openrouter.ai/api/v1"
        : baseUrl.trim() || null;
    await settings.addApiKey(
      provider,
      name.trim() || (provider === "openrouter" ? "OpenRouter" : "Custom"),
      keyValue.trim(),
      finalBase
    );
    setAdding(false);
    setName("");
    setKeyValue("");
    setBaseUrl("");
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {settings.apiKeys.map((k) => (
          <div
            key={k.id}
            className={`bg-app-surface border rounded-lg p-3 ${
              k.isActive ? "border-app-accent" : "border-app-border"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <KeyIcon size={12} className="text-app-text-dim" />
                  <span className="text-sm font-medium">{k.name}</span>
                  {k.isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-app-accent/15 text-app-accent rounded">
                      активный
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-app-text-muted mt-1 truncate font-mono">
                  {k.keyValue.slice(0, 12)}…{k.keyValue.slice(-4)}
                </div>
                <div className="text-[10.5px] text-app-text-muted mt-0.5">
                  {k.provider} · {k.baseUrl || "default"}
                </div>
              </div>
              <div className="flex gap-0.5">
                {!k.isActive && (
                  <button
                    onClick={() => settings.setActiveApiKey(k.id)}
                    className="p-1.5 rounded text-app-text-muted hover:text-app-accent hover:bg-app-bg"
                    title="Сделать активным"
                  >
                    <Check size={13} />
                  </button>
                )}
                <button
                  onClick={() => settings.deleteApiKey(k.id)}
                  className="p-1.5 rounded text-app-text-muted hover:text-app-danger hover:bg-app-bg"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="bg-app-surface border border-app-accent/40 rounded-lg p-3 space-y-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as "openrouter" | "openai-compat")}
            className="w-full bg-app-bg border border-app-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-app-accent"
          >
            <option value="openrouter">OpenRouter</option>
            <option value="openai-compat">OpenAI-совместимый (свой)</option>
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя (опционально)"
            className="w-full bg-app-bg border border-app-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-app-accent"
          />
          <input
            type="password"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="API-ключ"
            className="w-full bg-app-bg border border-app-border rounded-md px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-app-accent"
          />
          {provider === "openai-compat" && (
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="Base URL (например https://api.groq.com/openai/v1)"
              className="w-full bg-app-bg border border-app-border rounded-md px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-app-accent"
            />
          )}
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1 text-xs text-app-text-muted hover:text-app-text"
            >
              Отмена
            </button>
            <button
              onClick={add}
              disabled={!keyValue.trim()}
              className="px-3 py-1 text-xs bg-app-accent text-white rounded-md hover:bg-app-accent-hover disabled:opacity-40"
            >
              Добавить
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-app-border rounded-lg px-3 py-2 text-sm text-app-text-dim hover:text-app-accent hover:border-app-accent flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus size={14} />
          Добавить ключ
        </button>
      )}
    </div>
  );
}
