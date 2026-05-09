import { Shield, ShieldOff } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function UncensoredToggle({ value, onChange }: Props) {
  return (
    <div className="bg-app-surface border border-app-border rounded-lg px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {value ? (
              <ShieldOff size={13} className="text-amber-500" />
            ) : (
              <Shield size={13} className="text-app-text-dim" />
            )}
            <div className="text-sm font-medium">Без цензуры</div>
          </div>
          <div className="text-[10.5px] text-app-text-muted mt-0.5 leading-snug">
            Подмешивает permissive system prompt для роль-плея, dark fantasy и взрослого контента
          </div>
        </div>
        <button
          onClick={() => onChange(!value)}
          className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors"
          style={{
            backgroundColor: value ? "var(--color-app-accent)" : "#3a4150",
          }}
          aria-pressed={value}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 700, damping: 30 }}
            className="inline-block h-4 w-4 rounded-full bg-white shadow"
            style={{
              marginTop: 2,
              marginLeft: value ? 18 : 2,
            }}
          />
        </button>
      </div>
    </div>
  );
}
