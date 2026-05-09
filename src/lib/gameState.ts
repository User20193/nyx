import type { GameState, GameStateValue } from "../types";

const STATE_FENCE_RE =
  /```\s*nyx-state\s*\n([\s\S]*?)\n```/i;

const STATE_FENCE_GLOBAL_RE =
  /```\s*nyx-state\s*\n[\s\S]*?\n```/gi;

export interface ParsedState {
  state: GameState | null;
  /** Original message with the nyx-state block removed. */
  cleanedContent: string;
  /** Set if there was a block but JSON failed to parse. */
  parseError: string | null;
}

/** Strip nyx-state fenced blocks from a message and parse the LAST one. */
export function parseAndStripState(content: string): ParsedState {
  const match = content.match(STATE_FENCE_RE);
  if (!match) {
    return { state: null, cleanedContent: content, parseError: null };
  }
  const json = match[1].trim();
  let state: GameState | null = null;
  let parseError: string | null = null;
  try {
    state = JSON.parse(json) as GameState;
  } catch (e) {
    parseError = e instanceof Error ? e.message : String(e);
    state = tryRepairJson(json);
    if (state) parseError = null;
  }
  const cleaned = content.replace(STATE_FENCE_GLOBAL_RE, "").trimEnd();
  return { state, cleanedContent: cleaned, parseError };
}

/** Best-effort JSON repair for partial/streamed responses. */
function tryRepairJson(s: string): GameState | null {
  let txt = s.trim();
  if (txt.startsWith("```")) {
    txt = txt.replace(/^```(?:json|nyx-state)?\s*/i, "").replace(/```$/, "");
    txt = txt.trim();
  }
  // Trim trailing comma before } or ]
  txt = txt.replace(/,(\s*[}\]])/g, "$1");
  // If unbalanced, try to close it
  const opens = (txt.match(/[{[]/g) ?? []).length;
  const closes = (txt.match(/[}\]]/g) ?? []).length;
  if (opens > closes) {
    // naive: close with } until balanced
    txt = txt + "}".repeat(opens - closes);
  }
  try {
    return JSON.parse(txt) as GameState;
  } catch {
    return null;
  }
}

/** Strip nyx-state blocks for display only — does not parse. */
export function stripStateBlocks(content: string): string {
  return content.replace(STATE_FENCE_GLOBAL_RE, "").trimEnd();
}

/**
 * Compare two state trees and return paths whose values changed.
 * Path uses dotted notation, e.g. "ресурсы.армия".
 */
export function diffStates(
  prev: GameState | null,
  next: GameState | null
): Map<string, { from: GameStateValue; to: GameStateValue }> {
  const out = new Map<string, { from: GameStateValue; to: GameStateValue }>();
  if (!prev || !next) return out;
  walk(prev, next, "", out);
  return out;
}

function walk(
  a: GameStateValue,
  b: GameStateValue,
  path: string,
  out: Map<string, { from: GameStateValue; to: GameStateValue }>
) {
  if (
    typeof a === "object" &&
    typeof b === "object" &&
    a !== null &&
    b !== null &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const av = (a as Record<string, GameStateValue>)[k];
      const bv = (b as Record<string, GameStateValue>)[k];
      walk(av, bv, path ? `${path}.${k}` : k, out);
    }
  } else {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.set(path, { from: a, to: b });
    }
  }
}

export function compactStateJson(state: GameState | null): string {
  if (!state) return "{}";
  return JSON.stringify(state, null, 2);
}
