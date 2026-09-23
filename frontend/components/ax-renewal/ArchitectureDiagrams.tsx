import type { AxRenewalModuleCoupling } from "@/lib/ax-renewal/api";
import type { FileLayoutEntry } from "@/lib/ax-renewal/attachStats";

/**
 * Inline SVG diagrams for the Architecture panel's "System context" and
 * "Module coupling" tabs — the two of CodeRenewalPlatform.html's four
 * diagrams that can honestly be built from data this app actually has
 * (ADR-043). Unlike the reference prototype, nothing here is hand-placed
 * demo content: every box and edge comes from a prop, and a diagram with
 * nothing to show renders nothing rather than a shape with an invented
 * label in it.
 */

const COLOR = {
  ink: "#16141f",
  muted: "#6b6b80",
  border: "#ececf2",
  page: "#eef0f8",
  purple: "#6d3ce0",
  purpleFill: "#f1ebfd",
  danger: "#d6304a",
  dangerFill: "#fbe7ea",
};

/**
 * SVG `<text>` never wraps or clips on its own — a long value in a free-text
 * field the model filled in (`stackDetected.runtime`/`framework` can be a
 * full sentence, not just "Node.js") just runs past its box and past the
 * diagram's own viewBox, where the surrounding HTML cuts it off mid-word.
 * Word-wrapping into `maxLines` here is what these two helpers are for; a
 * label that still doesn't fit past that gets an ellipsis rather than
 * spilling out regardless.
 */
function wrapText(text: string, maxCharsPerLine: number, maxLines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines - 1 && current.length > maxCharsPerLine) {
      break;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    lines.length = maxLines;
  }
  const last = lines[maxLines - 1];
  if (last && lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${last.slice(0, Math.max(0, maxCharsPerLine - 1)).trimEnd()}…`;
  }
  return lines;
}

/** For a label with no room to wrap into more than one line (a small directory box, say) — ellipsis instead of overflow. */
function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? `${text.slice(0, maxChars - 1).trimEnd()}…` : text;
}

function Box({
  x,
  y,
  width,
  height,
  title,
  subtitle,
  fill = COLOR.page,
  stroke = COLOR.border,
  strokeWidth = 1.5,
  dashed = false,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <text
        x={x + width / 2}
        y={y + (subtitle ? height / 2 - 3 : height / 2 + 4)}
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
        fill={COLOR.ink}
      >
        {truncate(title, Math.floor((width - 16) / 6.8))}
      </text>
      {subtitle && (
        <text x={x + width / 2} y={y + height / 2 + 13} textAnchor="middle" fontSize={10.5} fill={COLOR.muted}>
          {truncate(subtitle, Math.floor((width - 16) / 6))}
        </text>
      )}
    </g>
  );
}

function ArrowMarkers() {
  return (
    <defs>
      <marker id="arch-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill={COLOR.muted} />
      </marker>
      <marker id="arch-arrow-bad" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill={COLOR.danger} />
      </marker>
    </defs>
  );
}

function ArrowH({ x1, x2, y, label }: { x1: number; x2: number; y: number; label?: string }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 6} y2={y} stroke={COLOR.muted} strokeWidth={1.5} markerEnd="url(#arch-arrow)" />
      {label && (
        <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fontSize={10.5} fill={COLOR.muted} fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  );
}

export function SystemContextDiagram({
  runtime,
  framework,
  fileLayout,
  routeCount,
}: {
  runtime: string | null;
  framework: string | null;
  fileLayout: FileLayoutEntry[];
  routeCount: number;
}) {
  // Up to 5 real directories, biggest first — the same cap the reference
  // prototype's own boxes suggest, just filled with real names instead of
  // "src/routes/" · "src/controllers/" always appearing whether or not this
  // project actually has them.
  const dirs = [...fileLayout].sort((a, b) => b.fileCount - a.fileCount).slice(0, 5);
  const processLabel = [runtime, framework].filter(Boolean).join(" · ") || "Detected process";

  // `runtime`/`framework` are free-text fields a connected model can fill
  // with a full sentence, not just "Node.js" — SVG <text> never wraps on
  // its own, so an unwrapped label here runs straight past the 300px box
  // and off the diagram entirely. Wrapped into up to 3 lines instead, with
  // the box growing to fit rather than clipping.
  const processBoxWidth = 300;
  const labelFontSize = 12.5;
  const maxCharsPerLine = Math.floor((processBoxWidth - 24) / (labelFontSize * 0.58));
  const labelLines = wrapText(processLabel, maxCharsPerLine, 3);
  const labelLineHeight = 15;

  const labelTop = 36; // first line's baseline, relative to the svg
  const labelBottom = labelTop + (labelLines.length - 1) * labelLineHeight;
  const routeY = routeCount > 0 ? labelBottom + 16 : labelBottom;
  const dirsTop = routeY + 22;

  const rowHeight = 30;
  const dirsHeight = dirs.length > 0 ? dirs.length * (rowHeight + 6) - 6 : 0;
  const processHeight = Math.max(90, dirsTop - 16 + dirsHeight + 14);
  const height = processHeight + 40;

  return (
    <svg viewBox={`0 0 760 ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <ArrowMarkers />
      <Box x={24} y={processHeight / 2 - 32} width={130} height={64} title="Browser" fill="#fdf1e3" stroke="#e8c98f" />
      <ArrowH x1={154} x2={214} y={processHeight / 2} label="HTTP" />
      <rect
        x={214}
        y={16}
        width={processBoxWidth}
        height={processHeight}
        rx={6}
        fill={COLOR.page}
        stroke={COLOR.border}
        strokeWidth={1.5}
      />
      <text textAnchor="middle" fontSize={labelFontSize} fontWeight={700} fill={COLOR.ink}>
        {labelLines.map((line, i) => (
          <tspan key={i} x={364} y={labelTop + i * labelLineHeight}>
            {line}
          </tspan>
        ))}
      </text>
      {routeCount > 0 && (
        <text x={364} y={routeY} textAnchor="middle" fontSize={11} fill={COLOR.muted}>
          {routeCount} route{routeCount === 1 ? "" : "s"} detected
        </text>
      )}
      {dirs.map((d, i) => (
        <Box
          key={d.dir || "(root)"}
          x={230}
          y={dirsTop + i * (rowHeight + 6)}
          width={268}
          height={rowHeight}
          title={(d.dir ? `${d.dir}/` : "(root)") + ` — ${d.fileCount} file${d.fileCount === 1 ? "" : "s"}`}
          fill="#ffffff"
        />
      ))}
      {dirs.length === 0 && (
        <text x={364} y={dirsTop + 14} textAnchor="middle" fontSize={11} fill={COLOR.muted}>
          No directory layout available yet
        </text>
      )}
    </svg>
  );
}

/** Places `count` points evenly around a circle centered at (cx, cy) with radius r. */
function circleLayout(count: number, cx: number, cy: number, r: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

function basename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

export function ModuleCouplingDiagram({ coupling }: { coupling: AxRenewalModuleCoupling }) {
  const modules = coupling.modules ?? [];
  const edges = coupling.edges ?? [];
  const hubs = new Set(coupling.hubs ?? []);
  const cycles = new Set((coupling.cycles ?? []).map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));

  const cx = 380;
  const cy = 190;
  const r = 145;
  const points = circleLayout(modules.length, cx, cy, r);

  return (
    <svg viewBox="0 0 760 380" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      {edges.map(([a, b], i) => {
        const from = points[a];
        const to = points[b];
        if (!from || !to) return null;
        const isCycle = cycles.has(`${Math.min(a, b)}-${Math.max(a, b)}`);
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={isCycle ? COLOR.danger : COLOR.border}
            strokeWidth={isCycle ? 2 : 1.4}
          />
        );
      })}
      {modules.map((name, i) => {
        const p = points[i];
        if (!p) return null;
        const isHub = hubs.has(i);
        const label = basename(name);
        const width = Math.max(96, label.length * 6.8);
        return (
          <g key={name}>
            <title>{name}</title>
            <rect
              x={p.x - width / 2}
              y={p.y - 13}
              width={width}
              height={26}
              rx={4}
              fill={isHub ? COLOR.dangerFill : "#ffffff"}
              stroke={isHub ? COLOR.danger : COLOR.border}
              strokeWidth={1.5}
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fontSize={10.5}
              fontWeight={isHub ? 700 : 500}
              fill={isHub ? COLOR.danger : COLOR.ink}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
