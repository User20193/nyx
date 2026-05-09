import { useEffect, useRef } from "react";

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
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

/**
 * Register keyboard hotkeys.
 *
 * The `hotkeys` array can be re-created on every render — we keep the
 * latest list in a ref and only register/unregister the listener ONCE
 * on mount. This prevents the keydown listener from being torn down
 * and re-attached on every render, which can cascade into render loops.
 */
export function useHotkeys(hotkeys: Hotkey[]) {
  const ref = useRef<Hotkey[]>(hotkeys);
  ref.current = hotkeys;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const inInput = isInputTarget(e.target);
      for (const h of ref.current) {
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
  }, []);
}
