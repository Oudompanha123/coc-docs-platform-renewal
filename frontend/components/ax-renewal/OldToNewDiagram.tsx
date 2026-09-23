import type { AxRenewalStackLayer } from "@/lib/ax-renewal/api";
import { ArrowH, ArrowMarkers, Box, COLOR } from "./ArchitectureDiagrams";

/**
 * The Plan → Old → New diagram, following CodeRenewalPlatform.html's
 * `dgmBridge()` layout (OLD column | NEW column, a shared-database callout
 * beneath) — but every row and every label is real data entered under
 * Plan → Stack move, not that prototype's fixed nine-layer fictional
 * migration. A layer nobody has touched yet simply isn't drawn; there is no
 * placeholder box standing in for one.
 */
export function OldToNewDiagram({
  layers,
  sameDatabase,
}: {
  layers: AxRenewalStackLayer[];
  /** Only ever true because of real data the caller checked (a database plan or connection exists) — never assumed. */
  sameDatabase: boolean;
}) {
  const rows = [...layers].filter((l) => l.oldTarget || l.newTarget).sort((a, b) => a.position - b.position);
  if (rows.length === 0) return null;

  const oldX = 24;
  const newX = 476;
  const columnWidth = 260;
  const rowHeight = 46;
  const rowGap = 10;
  const topPad = 40;
  const calloutHeight = sameDatabase ? 44 : 0;
  const bottomPad = 16 + calloutHeight;
  const height = topPad + rows.length * (rowHeight + rowGap) - rowGap + bottomPad;

  return (
    <svg viewBox={`0 0 760 ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
      <ArrowMarkers />
      <text x={oldX + columnWidth / 2} y={20} textAnchor="middle" fontSize={11} fontWeight={700} fill="#9c4620">
        OLD — running today
      </text>
      <text x={newX + columnWidth / 2} y={20} textAnchor="middle" fontSize={11} fontWeight={700} fill={COLOR.purple}>
        NEW — the planned target
      </text>
      {rows.map((l, i) => {
        const y = topPad + i * (rowHeight + rowGap);
        const midY = y + rowHeight / 2;
        return (
          <g key={l.layerKey}>
            <Box
              x={oldX}
              y={y}
              width={columnWidth}
              height={rowHeight}
              title={l.layerKey}
              subtitle={l.oldTarget || "—"}
              fill="#fdf1e3"
              stroke="#e8c98f"
            />
            <ArrowH x1={oldX + columnWidth + 6} x2={newX - 6} y={midY} />
            <Box
              x={newX}
              y={y}
              width={columnWidth}
              height={rowHeight}
              title={l.layerKey}
              subtitle={l.newTarget || `stays on ${l.oldTarget || "—"}`}
              fill={COLOR.purpleFill}
              stroke={COLOR.purple}
            />
          </g>
        );
      })}
      {sameDatabase && (
        <g>
          <rect
            x={24}
            y={height - calloutHeight - 16}
            width={712}
            height={calloutHeight}
            rx={6}
            fill="#fdf3e0"
            stroke="#e8d2a6"
            strokeWidth={1.5}
          />
          <text
            x={380}
            y={height - calloutHeight - 16 + calloutHeight / 2 + 4}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill="#8a5600"
          >
            The same database, throughout — the plan is additive only, nothing dropped or copied
          </text>
        </g>
      )}
    </svg>
  );
}
