interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}

export function SystemPromptEditor({
  value,
  onChange,
  placeholder,
  label,
}: Props) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-app-text-dim mb-2 font-semibold">
        {label ?? "Системный промпт"}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Системный промпт"}
        rows={4}
        className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm placeholder:text-app-text-muted resize-y focus:outline-none focus:border-app-accent transition-colors"
      />
    </div>
  );
}
