import Avatar from "boring-avatars";
import type { AvatarStyle, Chat } from "../../types";

const PALETTES: string[][] = [
  ["#5b8def", "#7c8df1", "#a78cf3", "#dab4f5", "#f1c0ff"],
  ["#ff6b6b", "#ff9472", "#ffd166", "#06d6a0", "#118ab2"],
  ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"],
  ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"],
  ["#0d3b66", "#faf0ca", "#f4d35e", "#ee964b", "#f95738"],
  ["#7400b8", "#5e60ce", "#48bfe3", "#56cfe1", "#80ffdb"],
  ["#22223b", "#4a4e69", "#9a8c98", "#c9ada7", "#f2e9e4"],
  ["#001219", "#005f73", "#0a9396", "#94d2bd", "#e9d8a6"],
  ["#3a0ca3", "#7209b7", "#f72585", "#4cc9f0", "#4361ee"],
  ["#240046", "#5a189a", "#9d4edd", "#c77dff", "#e0aaff"],
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function paletteForSeed(seed: string): string[] {
  return PALETTES[hashString(seed) % PALETTES.length];
}

interface Props {
  chat: Chat;
  size?: number;
  square?: boolean;
}

export function ChatAvatar({ chat, size = 48, square = false }: Props) {
  const colors = paletteForSeed(chat.avatarSeed);
  const variant = chat.avatarStyle as AvatarStyle;
  return (
    <Avatar
      size={size}
      name={chat.avatarSeed}
      variant={variant}
      colors={colors}
      square={square}
    />
  );
}
