import { useState, useEffect } from "react";
import { Swords, BookOpen } from "lucide-react";
import type { Chat } from "../../types";
import { useChatStore } from "../../stores/chatStore";
import { getScenario } from "../../lib/scenarios";

interface Props {
  chat: Chat;
}

export function GameSettings({ chat }: Props) {
  const updateChat = useChatStore((s) => s.updateChat);
  const [authorNote, setAuthorNote] = useState(chat.authorNote ?? "");
  const [playerRole, setPlayerRole] = useState(chat.playerRole ?? "");

  // Sync local draft with chat changes (e.g. selecting a different chat).
  useEffect(() => {
    setAuthorNote(chat.authorNote ?? "");
    setPlayerRole(chat.playerRole ?? "");
  }, [chat.id, chat.authorNote, chat.playerRole]);

  async function commitAuthor() {
    if (authorNote === (chat.authorNote ?? "")) return;
    await updateChat({
      ...chat,
      authorNote: authorNote || null,
      updatedAt: Date.now(),
    });
  }

  async function commitRole() {
    if (playerRole === (chat.playerRole ?? "")) return;
    await updateChat({
      ...chat,
      playerRole: playerRole || null,
      updatedAt: Date.now(),
    });
  }

  const scenario = chat.scenarioId ? getScenario(chat.scenarioId) : null;

  return (
    <div className="space-y-4">
      <div className="bg-app-accent/10 border border-app-accent/20 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Swords size={13} className="text-app-accent" />
          <div className="text-[11px] uppercase tracking-wider text-app-accent font-semibold">
            Игровой режим (GM)
          </div>
        </div>
        {scenario ? (
          <div className="text-[12.5px] text-app-text">
            <span className="mr-1">{scenario.emoji}</span>
            {scenario.name}
          </div>
        ) : (
          <div className="text-[12.5px] text-app-text-dim italic">
            Свой сценарий
          </div>
        )}
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-wider text-app-text-dim mb-2 font-semibold">
          Роль игрока
        </label>
        <input
          value={playerRole}
          onChange={(e) => setPlayerRole(e.target.value)}
          onBlur={commitRole}
          placeholder="Кого ты играешь"
          className="w-full bg-app-surface border border-app-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-app-accent"
        />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-app-text-dim mb-2 font-semibold">
          <BookOpen size={11} />
          Заметка автора
        </label>
        <textarea
          value={authorNote}
          onChange={(e) => setAuthorNote(e.target.value)}
          onBlur={commitAuthor}
          rows={5}
          placeholder="Влияет на каждый ход — например: «Будь жёстким. Не подыгрывай. Последствия катастрофичны.»"
          className="w-full bg-app-surface border border-app-border rounded-md px-3 py-2 text-[12.5px] focus:outline-none focus:border-app-accent resize-none leading-relaxed"
        />
        <div className="text-[10.5px] text-app-text-muted mt-1.5 leading-snug">
          Идёт в самый конец промпта на каждый запрос — самая
          влиятельная позиция для модели.
        </div>
      </div>
    </div>
  );
}
