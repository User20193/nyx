/**
 * Parse and roll a dice expression like "2d6", "1d20+3", "d100".
 * Returns { rolls, total, expression } or null if not a valid expression.
 */
export interface DiceResult {
  rolls: number[];
  total: number;
  expression: string;
  modifier: number;
  sides: number;
  count: number;
}

const DICE_RE = /^(\d*)d(\d+)\s*([+-]\s*\d+)?$/i;

export function rollDice(expr: string): DiceResult | null {
  const m = expr.trim().match(DICE_RE);
  if (!m) return null;
  const count = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  const mod = m[3] ? parseInt(m[3].replace(/\s/g, ""), 10) : 0;
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null;

  const rolls: number[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * sides) + 1;
    rolls.push(r);
    total += r;
  }
  total += mod;

  return { rolls, total, expression: expr, modifier: mod, sides, count };
}

export function formatRoll(r: DiceResult): string {
  const parts = r.rolls.join(" + ");
  const mod =
    r.modifier === 0
      ? ""
      : r.modifier > 0
        ? ` + ${r.modifier}`
        : ` − ${Math.abs(r.modifier)}`;
  return `🎲 \`${r.expression}\` → [${parts}]${mod} = **${r.total}**`;
}

/** Detect leading slash command. Returns the command and rest of text. */
export function parseSlashCommand(
  text: string
): { cmd: string; rest: string } | null {
  const m = text.match(/^\s*\/([a-zA-Z]+)\s*(.*)$/s);
  if (!m) return null;
  return { cmd: m[1].toLowerCase(), rest: m[2] };
}
