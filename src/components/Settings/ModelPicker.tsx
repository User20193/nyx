import { useMemo, useState } from "react";
import { Search, Check, Sparkles } from "lucide-react";
import { useModelStore } from "../../stores/modelStore";

interface Props {
  value: string | null;
  onChange: (id: string) => void;
}

export function ModelPicker({ value, onChange }: Props) {
  const models = useModelStore((s) => s.models);
  const loading = useModelStore((s) => s.loading);
  const error = useModelStore((s) => s.error);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
    );
  }, [models, query]);

  const current = models.find((m) => m.id === value);

  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-app-text-dim mb-2 font-semibold">
        Модель
      </label>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm hover:border-app-accent/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2 min-w-0">
          {current?.isFree && (
            <span className="text-app-success" title="Бесплатно">
              <Sparkles size={12} />
            </span>
          )}
          <span className="truncate">
            {current ? current.name : value ?? "Не выбрана"}
          </span>
        </div>
        <span className="text-app-text-muted text-xs">
          {loading ? "загрузка…" : `${models.length}`}
        </span>
      </button>

      {error && (
        <div className="mt-1 text-[11px] text-app-danger">{error}</div>
      )}

      {open && (
        <div className="mt-2 bg-app-surface border border-app-border rounded-lg overflow-hidden">
          <div className="p-2 border-b border-app-border">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-text-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск..."
                className="w-full bg-app-bg border border-app-border rounded-md pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:border-app-accent"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-app-text-muted">
                Нет моделей
              </div>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-app-bg flex items-start gap-2 ${
                    m.id === value ? "bg-app-accent/10" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {m.isFree && (
                        <Sparkles size={10} className="text-app-success" />
                      )}
                      <span className="text-xs font-medium truncate">{m.name}</span>
                    </div>
                    <div className="text-[10px] text-app-text-muted truncate">
                      {m.id} · {m.contextLength.toLocaleString("ru-RU")} ток.
                    </div>
                  </div>
                  {m.id === value && (
                    <Check size={12} className="text-app-accent mt-0.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
