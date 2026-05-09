import type { Chat, GameState, GlobalSettings, Persona } from "../types";
import { compactStateJson } from "./gameState";
import { getScenario } from "./scenarios";

export function buildSystemPrompt(args: {
  globalSettings: GlobalSettings;
  activePersona: Persona | null;
  chatOverride: string | null;
}): string {
  const parts: string[] = [];

  if (args.globalSettings.globalSystemPrompt.trim()) {
    parts.push(args.globalSettings.globalSystemPrompt.trim());
  }

  if (args.activePersona && args.activePersona.bio.trim()) {
    parts.push(
      `Информация о пользователе:\nИмя: ${args.activePersona.name}\n${args.activePersona.bio.trim()}`
    );
  }

  if (args.globalSettings.uncensoredEnabled) {
    parts.push(args.globalSettings.uncensoredPrompt.trim());
  }

  if (args.chatOverride && args.chatOverride.trim()) {
    parts.push(args.chatOverride.trim());
  }

  return parts.join("\n\n");
}

export function buildGmSystemPrompt(args: {
  chat: Chat;
  globalSettings: GlobalSettings;
  activePersona: Persona | null;
}): string {
  const scenario = args.chat.scenarioId
    ? getScenario(args.chat.scenarioId)
    : null;

  const parts: string[] = [];

  parts.push(`# ВЕДУЩИЙ ВОЕННО-ПОЛИТИЧЕСКОЙ ИГРЫ

Ты — Game Master текстовой стратегической ролевой игры. Ты не персонаж и не помощник: ты беспристрастный нарратор и арбитр последствий.

## ОСНОВНЫЕ ПРАВИЛА

1. **Не подыгрывай игроку.** Реалистично проводи последствия каждого решения. Ошибки наказываются. Удачные ходы — поощряются. Глупые ходы — катастрофичны.
2. **Время идёт.** Каждое действие занимает время (часы/дни/недели по сеттингу). Указывай это в стейте и в нарративе.
3. **Мир живой.** Другие акторы (союзники, враги, нейтралы, пресса, население) реагируют на действия игрока. Прописывай их реакции явно — заголовки газет, шифровки, разговоры в кулуарах.
4. **Цифры меняются.** Войска гибнут, бюджеты тратятся, ресурсы расходуются. Обновляй стейт каждый ход.
5. **Длина нарратива** — 3-7 абзацев. Кратко, ярко, без воды. Если игрок задал короткий вопрос — короче ответ.

## ФОРМАТ ОТВЕТА — СТРОГО ОБЯЗАТЕЛЬНЫЙ

Каждый твой ответ состоит из ДВУХ частей:

**Часть 1 — нарратив.** Описание происходящего на русском языке. Прямая речь персонажей в кавычках или с тире, как в художественной прозе.

**Часть 2 — обновлённый стейт.** В САМОМ КОНЦЕ ответа, в fenced-блоке с языком \`nyx-state\`. Включай ВЕСЬ стейт целиком — все поля, даже неизменившиеся. JSON должен быть валидным.

### Пример правильного ответа:

Хрущёв молча сжимает в кулаке донесение. За окном Кремля сгущаются ранние сумерки.

— Малиновский, поднимайте Группу советских войск в Германии по третьему уровню. Не первому, нет — третий, скрытно. Громыко, готовьте проект ноты, но без угроз — деловой тон.

Министры расходятся. Через шесть часов U-2 будет сбит над Кубой — но не нашими, а кубинскими ПВО. Кастро действует на свой страх и риск.

\`\`\`nyx-state
{
  "контекст": {
    "год": 1962,
    "день_кризиса": 3,
    "defcon_США": 4
  },
  "ресурсы": {
    "ракеты_Кубе": 42,
    "воины_на_Кубе": 41000
  },
  "события_дня": ["U-2 сбит над Кубой кубинской ПВО", "Группа в ГСВГ — скрытная боеготовность"]
}
\`\`\`

## ВАЖНЫЕ МОМЕНТЫ

- Стейт ВСЕГДА в конце, ВСЕГДА в \`nyx-state\`-блоке. Если забудешь — игра сломается.
- Если игрок написал \`[ooc: ...]\` или \`[OOC: ...]\` — это вне-игровая команда. Отвечай вне роли, кратко. Стейт можно не обновлять, но всё равно включи его (тот же, что был).
- Если игрок бросил кубики (\`🎲 ... = N\`) — учти результат в нарративе. Высокий бросок = удача, низкий = провал.
- Не пиши "стейт обновлён" в нарративе — это служебка, парсер сам обработает.
`);

  if (scenario) {
    parts.push(`## СЕТТИНГ И КОНТЕКСТ

**Сценарий:** ${scenario.name} — ${scenario.shortDescription}

${scenario.worldPrompt}

**Стиль ведения:** ${scenario.gmStyle}

**Роль игрока:** ${args.chat.playerRole || scenario.playerRole}`);
  } else if (args.chat.scenarioPrompt) {
    parts.push(`## СЕТТИНГ И КОНТЕКСТ\n\n${args.chat.scenarioPrompt}`);
    if (args.chat.playerRole) {
      parts.push(`**Роль игрока:** ${args.chat.playerRole}`);
    }
  }

  // Persona
  if (args.activePersona && args.activePersona.bio.trim()) {
    parts.push(
      `## О ИГРОКЕ (вне игры)\n\nИмя пользователя: ${args.activePersona.name}\n${args.activePersona.bio.trim()}`
    );
  }

  // Uncensored prompt — applies in GM mode too if enabled
  if (args.globalSettings.uncensoredEnabled) {
    parts.push(`## КОНТЕНТ\n\n${args.globalSettings.uncensoredPrompt.trim()}`);
  }

  // Chat-level override
  if (args.chat.systemPromptOverride && args.chat.systemPromptOverride.trim()) {
    parts.push(
      `## ДОПОЛНИТЕЛЬНЫЕ УКАЗАНИЯ\n\n${args.chat.systemPromptOverride.trim()}`
    );
  }

  // Author's note — always at END (most influential position)
  if (args.chat.authorNote && args.chat.authorNote.trim()) {
    parts.push(
      `## ЗАМЕТКА АВТОРА (всегда учитывай в каждом ответе)\n\n${args.chat.authorNote.trim()}`
    );
  }

  return parts.join("\n\n");
}

/**
 * Inject the *current* game state as a system message right before the
 * model generates its next reply. This way the model always has fresh
 * state, even if older messages have been trimmed.
 */
export function buildCurrentStateInjection(state: GameState | null): string {
  if (!state) return "";
  return `## ТЕКУЩИЙ СТЕЙТ (актуальный, обнови его в своём ответе)

\`\`\`json
${compactStateJson(state)}
\`\`\``;
}
