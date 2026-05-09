import { useEffect } from "react";

export type Hotkey = {
  combo: string;
  handler: (e: KeyboardEvent) => void;
  /** Whether to allow the hotkey to fire when an input/textarea is focused. */
  allowInInput?: boolean;
};

function matches(combo: string, e: KeyboardEvent): boolean {
  const parts = combo.toLowerCase().split("+");
  const wantCtrl = parts.includes("ctrl") || parts.includes("cmd");
  const wantShift = parts.includes("shift");
  const wantAlt = parts.includes("alt");
  const key = parts[parts.length - 1];

  if (wantCtrl !== (e.ctrlKey || e.metaKey)) return false;
  if (wantShift !== e.shiftKey) return false;
  if (wantAlt !== e.altKey) return false;

  const k = e.key.toLowerCase();
  return k === key;
}

function isInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable
  );
}

export function useHotkeys(hotkeys: Hotkey[]) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const inInput = isInputTarget(e.target);
      for (const h of hotkeys) {
        if (matches(h.combo, e)) {
          if (inInput && !h.allowInInput) continue;
          e.preventDefault();
          h.handler(e);
          break;
        }
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [hotkeys]);
}
