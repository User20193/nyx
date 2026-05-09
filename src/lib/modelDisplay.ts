const COLORS = [
  "#5b8def",
  "#a78bfa",
  "#34d399",
  "#fb7185",
  "#f59e0b",
  "#22d3ee",
  "#f472b6",
  "#84cc16",
  "#60a5fa",
  "#c084fc",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function modelColor(model: string | null | undefined): string {
  if (!model) return "#3a4150";
  return COLORS[hash(model) % COLORS.length];
}

export function modelInitials(model: string | null | undefined): string {
  if (!model) return "?";
  const afterSlash = model.includes("/") ? model.split("/")[1] : model;
  const cleaned = afterSlash.replace(/[:_-]/g, " ");
  const parts = cleaned
    .split(" ")
    .filter((p) => /[a-z]/i.test(p))
    .slice(0, 2);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function modelDisplayName(model: string | null | undefined): string {
  if (!model) return "Без модели";
  const after = model.includes("/") ? model.split("/")[1] : model;
  const cleaned = after.replace(/:free$/, "").replace(/[-_]/g, " ");
  return cleaned
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
