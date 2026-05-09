import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { ModelPicker } from "./ModelPicker";
import { SamplingControls } from "./SamplingControls";
import { SystemPromptEditor } from "./SystemPromptEditor";
import { UncensoredToggle } from "./UncensoredToggle";

export function SettingsPanel() {
  const chat = useChatStore((s) => s.chats.find((c) => c.id === s.activeChatId));
  const updateChat = useChatStore((s) => s.updateChat);
  const settings = useSettingsStore();

  if (!chat) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 px-4 flex items-center border-b border-app-border">
        <div className="text-xs uppercase tracking-wider text-app-text-dim font-semibold">
          Настройки чата
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <ModelPicker
          value={chat.model}
          onChange={async (v) => {
            await updateChat({ ...chat, model: v, updatedAt: Date.now() });
          }}
        />

        <SystemPromptEditor
          value={chat.systemPromptOverride ?? ""}
          onChange={async (v) => {
            await updateChat({
              ...chat,
              systemPromptOverride: v || null,
              updatedAt: Date.now(),
            });
          }}
          placeholder="Системный промпт для этого чата (опционально)"
        />

        <SamplingControls
          sampling={chat.sampling}
          onChange={async (v) => {
            await updateChat({ ...chat, sampling: v, updatedAt: Date.now() });
          }}
        />

        <UncensoredToggle
          value={settings.global.uncensoredEnabled}
          onChange={async (v) => {
            await settings.updateGlobal({ uncensoredEnabled: v });
          }}
        />
      </div>
    </div>
  );
}
