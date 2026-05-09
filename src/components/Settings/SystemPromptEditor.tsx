import { useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}

// Buffered editor — keeps text local until blur or a 500ms idle delay so
// each keystroke doesn't trigger a DB write / store update / re-render.
// (Per-keystroke writes were measurably contributing to UI lag inside the
// settings modal.)
export function SystemPromptEditor({
  value,
  onChange,
  placeholder,
  label,
}: Props) {
  const [draft, setDraft] = useState(value);

  // Keep local draft in sync if the parent value changes underneath us
  // (e.g. switching chats / tabs / preset buttons).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Idle commit — 500ms after the user stops typing, push to parent.
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => {
      onChange(draft);
    }, 500);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);

  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-app-text-dim mb-2 font-semibold">
        {label ?? "Системный промпт"}
      </label>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onChange(draft);
        }}
        placeholder={placeholder ?? "Системный промпт"}
        rows={4}
        className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm placeholder:text-app-text-muted resize-y focus:outline-none focus:border-app-accent transition-colors"
      />
    </div>
  );
}
