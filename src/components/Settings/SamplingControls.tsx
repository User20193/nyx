import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { SamplingSettings } from "../../types";
import { defaultSampling } from "../../types";

interface Props {
  sampling: SamplingSettings | null;
  onChange: (s: SamplingSettings) => void;
}

export function SamplingControls({ sampling, onChange }: Props) {
  const value: SamplingSettings = sampling ?? { ...defaultSampling };
  const [open, setOpen] = useState(true);

  function patch<K extends keyof SamplingSettings>(
    key: K,
    val: SamplingSettings[K]
  ) {
    onChange({ ...value, [key]: val });
  }

  function applyPreset(preset: "creative" | "balanced" | "precise") {
    if (preset === "creative") {
      onChange({
        ...value,
        temperature: 1.1,
        topP: 0.95,
        presencePenalty: 0.4,
        frequencyPenalty: 0.4,
      });
    } else if (preset === "precise") {
      onChange({
        ...value,
        temperature: 0.3,
        topP: 0.9,
        presencePenalty: 0,
        frequencyPenalty: 0,
      });
    } else {
      onChange({
        ...value,
        temperature: 0.8,
        topP: 0.95,
        presencePenalty: 0,
        frequencyPenalty: 0,
      });
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-[11px] uppercase tracking-wider text-app-text-dim mb-2 font-semibold"
      >
        Сэмплинг
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <div className="space-y-3">
          <div className="flex gap-1">
            <button
              onClick={() => applyPreset("creative")}
              className="flex-1 text-[10.5px] py-1 rounded-md bg-app-surface border border-app-border hover:border-app-accent text-app-text-dim hover:text-app-text transition-colors"
            >
              Creative
            </button>
            <button
              onClick={() => applyPreset("balanced")}
              className="flex-1 text-[10.5px] py-1 rounded-md bg-app-surface border border-app-border hover:border-app-accent text-app-text-dim hover:text-app-text transition-colors"
            >
              Balanced
            </button>
            <button
              onClick={() => applyPreset("precise")}
              className="flex-1 text-[10.5px] py-1 rounded-md bg-app-surface border border-app-border hover:border-app-accent text-app-text-dim hover:text-app-text transition-colors"
            >
              Precise
            </button>
          </div>

          <Slider
            label="Temperature"
            value={value.temperature}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => patch("temperature", v)}
          />
          <Slider
            label="Top P"
            value={value.topP}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => patch("topP", v)}
          />
          <Slider
            label="Max tokens"
            value={value.maxTokens}
            min={64}
            max={16384}
            step={64}
            onChange={(v) => patch("maxTokens", Math.round(v))}
            integer
          />
          <Slider
            label="Presence penalty"
            value={value.presencePenalty}
            min={-2}
            max={2}
            step={0.05}
            onChange={(v) => patch("presencePenalty", v)}
          />
          <Slider
            label="Frequency penalty"
            value={value.frequencyPenalty}
            min={-2}
            max={2}
            step={0.05}
            onChange={(v) => patch("frequencyPenalty", v)}
          />
        </div>
      )}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  integer?: boolean;
}

function Slider({ label, value, min, max, step, onChange, integer }: SliderProps) {
  // Local draft updates as the user drags. We only commit upstream
  // (which writes to DB) once the user releases the slider — otherwise
  // a single drag fires hundreds of writes and stalls the UI.
  const [draft, setDraft] = useState<number>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    if (draft !== value) onChange(draft);
  }

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-app-text-dim">{label}</span>
        <span className="font-mono text-app-text">
          {integer ? Math.round(draft) : draft.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(e) => setDraft(parseFloat(e.target.value))}
        onMouseUp={commit}
        onTouchEnd={commit}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        className="w-full accent-[var(--color-app-accent)]"
      />
    </div>
  );
}
