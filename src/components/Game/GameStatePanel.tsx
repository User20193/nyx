import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  ListTree,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { Chat, GameState, GameStateValue } from "../../types";
import { useChatStore } from "../../stores/chatStore";
import { diffStates } from "../../lib/gameState";

interface Props {
  chat: Chat;
}

export function GameStatePanel({ chat }: Props) {
  const applyGameState = useChatStore((s) => s.applyGameState);
  const resetGameState = useChatStore((s) => s.resetGameState);

  const prevRef = useRef<GameState | null>(chat.gameState);
  const diffs = useMemo(
    () => diffStates(prevRef.current, chat.gameState),
    [chat.gameState]
  );
  // After diff is computed and rendered, snapshot the new state so the
  // next change is diffed against the now-current values. Using an effect
  // keeps render pure and avoids the cascade that triggered React #185.
  useEffect(() => {
    const t = window.setTimeout(() => {
      prevRef.current = chat.gameState;
    }, 5000);
    return () => clearTimeout(t);
  }, [chat.gameState]);

  function handleReset() {
    if (
      confirm("Сбросить стейт к начальному? История чата сохранится.")
    ) {
      void resetGameState(chat.id);
    }
  }

  if (!chat.gameState) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <ListTree size={28} className="text-app-text-muted mb-3" />
        <div className="text-sm text-app-text-dim mb-1">Стейт пуст</div>
        <div className="text-xs text-app-text-muted leading-relaxed">
          Начни игру первым сообщением — модель создаст стейт мира.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 px-4 flex items-center justify-between border-b border-app-border-soft">
        <div className="flex items-center gap-2">
          <ListTree size={14} className="text-app-accent" />
          <div className="text-xs uppercase tracking-wider text-app-text-dim font-semibold">
            Состояние мира
          </div>
        </div>
        <button
          onClick={handleReset}
          title="Сбросить к начальному"
          className="p-1.5 text-app-text-muted hover:text-app-danger hover:bg-app-surface rounded transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 text-[12.5px] font-mono">
        <StateNode
          path=""
          value={chat.gameState}
          diffs={diffs}
          onUpdate={(newState) =>
            applyGameState(chat.id, newState)
          }
          rootState={chat.gameState}
        />
      </div>

      {diffs.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-app-border-soft px-3 py-2 text-[11px] text-app-text-muted bg-app-surface/40"
        >
          <span className="font-semibold text-app-accent">
            {diffs.size}
          </span>{" "}
          изменений в этом ходе
        </motion.div>
      )}
    </div>
  );
}

function setAtPath(
  state: GameState,
  path: string,
  newVal: GameStateValue
): GameState {
  const parts = path.split(".");
  const next = JSON.parse(JSON.stringify(state)) as GameState;
  let cursor: Record<string, GameStateValue> = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const child = cursor[key];
    if (typeof child !== "object" || child === null || Array.isArray(child)) {
      return state;
    }
    cursor = child as Record<string, GameStateValue>;
  }
  cursor[parts[parts.length - 1]] = newVal;
  return next;
}

interface NodeProps {
  path: string;
  value: GameStateValue;
  diffs: Map<string, { from: GameStateValue; to: GameStateValue }>;
  onUpdate: (newState: GameState) => void;
  rootState: GameState;
}

function StateNode({ path, value, diffs, onUpdate, rootState }: NodeProps) {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return (
      <div className="space-y-1">
        {Object.entries(value).map(([k, v]) => {
          const childPath = path ? `${path}.${k}` : k;
          return (
            <BranchNode
              key={childPath}
              keyName={k}
              path={childPath}
              value={v}
              diffs={diffs}
              onUpdate={onUpdate}
              rootState={rootState}
            />
          );
        })}
      </div>
    );
  }
  return null;
}

interface BranchProps {
  keyName: string;
  path: string;
  value: GameStateValue;
  diffs: Map<string, { from: GameStateValue; to: GameStateValue }>;
  onUpdate: (newState: GameState) => void;
  rootState: GameState;
}

function BranchNode({
  keyName,
  path,
  value,
  diffs,
  onUpdate,
  rootState,
}: BranchProps) {
  const [open, setOpen] = useState(true);
  const isObject =
    typeof value === "object" && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const diff = diffs.get(path);

  if (isObject) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-app-text-dim hover:text-app-text font-semibold text-[12px]"
        >
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {keyName}
        </button>
        {open && (
          <div className="ml-3 mt-1 border-l border-app-border-soft pl-2">
            <StateNode
              path={path}
              value={value}
              diffs={diffs}
              onUpdate={onUpdate}
              rootState={rootState}
            />
          </div>
        )}
      </div>
    );
  }

  if (isArray) {
    return (
      <div className="flex items-start gap-2 py-0.5">
        <span className="text-app-text-dim shrink-0">{keyName}:</span>
        <div className="flex flex-wrap gap-1">
          {(value as GameStateValue[]).map((it, idx) => (
            <span
              key={idx}
              className="bg-app-surface/60 border border-app-border-soft rounded px-1.5 py-0.5 text-[11px] text-app-text"
            >
              {String(it)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScalarRow
      keyName={keyName}
      path={path}
      value={value}
      diff={diff}
      onUpdate={onUpdate}
      rootState={rootState}
    />
  );
}

interface ScalarProps {
  keyName: string;
  path: string;
  value: GameStateValue;
  diff: { from: GameStateValue; to: GameStateValue } | undefined;
  onUpdate: (newState: GameState) => void;
  rootState: GameState;
}

function ScalarRow({
  keyName,
  path,
  value,
  diff,
  onUpdate,
  rootState,
}: ScalarProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit() {
    let parsed: GameStateValue;
    if (typeof value === "number") {
      const n = parseFloat(draft);
      if (Number.isNaN(n)) {
        setEditing(false);
        setDraft(String(value));
        return;
      }
      parsed = n;
    } else if (typeof value === "boolean") {
      parsed = draft === "true";
    } else {
      parsed = draft;
    }
    const next = setAtPath(rootState, path, parsed);
    onUpdate(next);
    setEditing(false);
  }

  const isNumeric = typeof value === "number";
  const trend =
    diff && typeof diff.from === "number" && typeof diff.to === "number"
      ? diff.to > diff.from
        ? "up"
        : diff.to < diff.from
          ? "down"
          : null
      : null;

  return (
    <div
      className={`group flex items-center justify-between gap-2 py-0.5 px-1 rounded -mx-1 ${
        diff ? "bg-app-accent/10" : ""
      }`}
    >
      <span className="text-app-text-dim shrink-0">{keyName}:</span>
      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setEditing(false);
                setDraft(String(value));
              }
            }}
            autoFocus
            className="flex-1 bg-app-surface border border-app-accent rounded px-1.5 py-0.5 text-[12px] focus:outline-none"
          />
          <button onClick={commit} className="p-0.5 text-app-success">
            <Check size={11} />
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setDraft(String(value));
            }}
            className="p-0.5 text-app-text-muted"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <AnimatePresence>
            {trend === "up" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-app-success"
              >
                <TrendingUp size={11} />
              </motion.div>
            )}
            {trend === "down" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-app-danger"
              >
                <TrendingDown size={11} />
              </motion.div>
            )}
          </AnimatePresence>
          <span
            className={`text-app-text ${isNumeric ? "tabular-nums" : ""}`}
          >
            {String(value)}
          </span>
          <button
            onClick={() => {
              setDraft(String(value));
              setEditing(true);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-app-text-muted hover:text-app-text transition-opacity"
            title="Редактировать"
          >
            <Pencil size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
