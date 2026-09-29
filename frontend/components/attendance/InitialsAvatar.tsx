const PALETTE = [
  "#6D3CE0",
  "#2563EB",
  "#0D9488",
  "#DB2777",
  "#EA580C",
  "#059669",
  "#7C3AED",
  "#0891B2",
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "?";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return (first + second).toUpperCase();
}

/** A stable color per name (a simple string hash into a fixed palette), not random — the same person gets the same tile on every render/reload. */
function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length] ?? PALETTE[0]!;
}

export function InitialsAvatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: colorFor(name) }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
