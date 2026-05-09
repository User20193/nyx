import type { GlobalSettings, Persona } from "../types";

export function buildSystemPrompt(args: {
  globalSettings: GlobalSettings;
  activePersona: Persona | null;
  chatOverride: string | null;
}): string {
  const parts: string[] = [];

  if (args.globalSettings.globalSystemPrompt.trim()) {
    parts.push(args.globalSettings.globalSystemPrompt.trim());
  }

  if (args.activePersona && args.activePersona.bio.trim()) {
    parts.push(
      `Информация о пользователе:\nИмя: ${args.activePersona.name}\n${args.activePersona.bio.trim()}`
    );
  }

  if (args.globalSettings.uncensoredEnabled) {
    parts.push(args.globalSettings.uncensoredPrompt.trim());
  }

  if (args.chatOverride && args.chatOverride.trim()) {
    parts.push(args.chatOverride.trim());
  }

  return parts.join("\n\n");
}
