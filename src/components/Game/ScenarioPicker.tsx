import { useState } from "react";
import { motion } from "framer-motion";
import { X, Swords, ArrowRight } from "lucide-react";
import { SCENARIOS, type Scenario } from "../../lib/scenarios";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { seedGmChatOpening } from "../../lib/chatActions";

interface Props {
  onClose: () => void;
}

export function ScenarioPicker({ onClose }: Props) {
  const defaultModel = useSettingsStore((s) => s.global.defaultModel);
  const createGmChat = useChatStore((s) => s.createGmChat);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [customRole, setCustomRole] = useState("");
  const [customWorld, setCustomWorld] = useState("");
  const [customName, setCustomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [exiting, setExiting] = useState(false);

  function close() {
    if (exiting || creating) return;
    setExiting(true);
    setTimeout(onClose, 160);
  }

  async function handleStart(s: Scenario) {
    setCreating(true);
    try {
      const isCustom = s.id === "custom";

      const playerRole =
        isCustom && customRole.trim() ? customRole.trim() : s.playerRole;
      const name =
        isCustom && customName.trim() ? customName.trim() : s.chatName;
      const scenarioPrompt =
        isCustom && customWorld.trim() ? customWorld.trim() : null;

      const chat = await createGmChat(defaultModel, s.id, {
        name,
        playerRole,
        authorNote: s.authorNote,
        initialState: s.initialState,
        scenarioPrompt,
      });

      if (s.openingScene && !isCustom) {
        await seedGmChatOpening({ chat, openingScene: s.openingScene });
      }
      onClose();
    } finally {
      setCreating(false);
    }
  }


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.15 }}
      className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 ${
        exiting ? "pointer-events-none" : ""
      }`}
      onClick={close}
    >
      <motion.div
        initial={{ scale: 0.96, y: 8 }}
        animate={{
          scale: exiting ? 0.97 : 1,
          y: exiting ? 6 : 0,
          opacity: exiting ? 0 : 1,
        }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-app-bg border border-app-border rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="h-14 px-5 flex items-center justify-between border-b border-app-border">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-app-accent"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-app-accent-soft), transparent)",
                boxShadow: "0 0 0 1px var(--color-app-accent-soft) inset",
              }}
            >
              <Swords size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold">Игровой режим</div>
              <div className="text-[11px] text-app-text-muted">
                Выбери сценарий — модель станет ведущим, ты будешь играть
              </div>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1.5 hover:bg-app-surface rounded-md text-app-text-muted hover:text-app-text"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-72 shrink-0 border-r border-app-border bg-app-sidebar/40 overflow-y-auto p-2 space-y-1">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  selected?.id === s.id
                    ? "bg-app-accent/15 border border-app-accent/40"
                    : "border border-transparent hover:bg-app-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{s.emoji}</span>
                  <div className="text-sm font-medium text-app-text">
                    {s.name}
                  </div>
                </div>
                <div className="text-[11px] text-app-text-muted mt-1 leading-snug">
                  {s.shortDescription}
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!selected && (
              <div className="h-full flex flex-col items-center justify-center text-center text-app-text-muted">
                <Swords size={32} className="mb-3 opacity-50" />
                <div className="text-sm">Выбери сценарий слева</div>
              </div>
            )}
            {selected && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-3xl leading-none">
                      {selected.emoji}
                    </span>
                    <div>
                      <div className="text-xl font-semibold">
                        {selected.name}
                      </div>
                      <div className="text-[12px] text-app-text-muted">
                        {selected.shortDescription}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-app-text-dim leading-relaxed mt-3">
                    {selected.fullDescription}
                  </div>
                </div>

                <div className="bg-app-surface/40 border border-app-border-soft rounded-lg p-3">
                  <div className="text-[11px] uppercase tracking-wider text-app-text-muted font-semibold mb-1.5">
                    Роль игрока
                  </div>
                  <div className="text-sm text-app-text">
                    {selected.playerRole}
                  </div>
                </div>

                <div className="bg-app-surface/40 border border-app-border-soft rounded-lg p-3">
                  <div className="text-[11px] uppercase tracking-wider text-app-text-muted font-semibold mb-1.5">
                    Стиль ведения
                  </div>
                  <div className="text-[13px] text-app-text-dim leading-relaxed">
                    {selected.gmStyle}
                  </div>
                </div>

                {selected.id === "custom" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-app-text-muted mb-1.5 font-semibold">
                        Название сценария
                      </label>
                      <input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Например: Восстание андроидов"
                        className="w-full bg-app-surface border border-app-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-app-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-app-text-muted mb-1.5 font-semibold">
                        Твоя роль
                      </label>
                      <input
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="Например: Президент Союза Свободных Колоний"
                        className="w-full bg-app-surface border border-app-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-app-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-app-text-muted mb-1.5 font-semibold">
                        Описание мира и завязки
                      </label>
                      <textarea
                        value={customWorld}
                        onChange={(e) => setCustomWorld(e.target.value)}
                        rows={6}
                        placeholder="Какой год, кто игроки, что произошло, какие ресурсы у тебя есть..."
                        className="w-full bg-app-surface border border-app-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-app-accent resize-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleStart(selected)}
                  disabled={
                    creating ||
                    (selected.id === "custom" && !customWorld.trim())
                  }
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-app-accent text-white font-medium hover:bg-app-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? "Создаём..." : "Начать игру"}
                  {!creating && <ArrowRight size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
