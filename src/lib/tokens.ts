import { encode } from "gpt-tokenizer";
import type { Message } from "../types";

export function countTokens(text: string): number {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch {
    return Math.ceil(text.length / 4);
  }
}

export function countMessagesTokens(messages: { content: string }[]): number {
  return messages.reduce((sum, m) => sum + countTokens(m.content) + 4, 0);
}

export function trimToFit<T extends Message>(
  messages: T[],
  systemTokens: number,
  maxContextTokens: number,
  reserveForResponse: number
): T[] {
  if (maxContextTokens <= 0) return messages;
  const limit = maxContextTokens - systemTokens - reserveForResponse;
  if (limit <= 0) return [];

  let total = 0;
  const kept: T[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const t = countTokens(messages[i].content) + 4;
    if (total + t > limit) break;
    kept.unshift(messages[i]);
    total += t;
  }
  return kept;
}
