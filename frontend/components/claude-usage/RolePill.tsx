import type { TeamRole } from "@/lib/admin/claudeUsage";

/** A native <select> styled as a colored pill — same "custom appearance,
 *  real functionality" approach as users-roles/FilterBar.tsx's dropdowns,
 *  just rounded-full instead of rounded-xl to read as a role badge at rest. */
export function RolePill({
  role,
  onChange,
  disabled,
}: {
  role: TeamRole;
  onChange: (role: TeamRole) => void;
  disabled?: boolean;
}) {
  const toneClass = role === "admin" ? "bg-brand-purple/10 text-brand-purple" : "bg-page text-muted";

  return (
    <select
      value={role}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as TeamRole)}
      aria-label="Role"
      className={`appearance-none rounded-full px-3 py-1 pr-6 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2'%3E%3Cpath d='M6 9.5 12 15l6-5.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 6px center",
        backgroundSize: "12px 12px",
        color: "inherit",
      }}
    >
      <option value="admin">Admin</option>
      <option value="member">Member</option>
    </select>
  );
}
