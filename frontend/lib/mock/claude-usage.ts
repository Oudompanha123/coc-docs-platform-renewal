/** Mock data for the Claude Code Usage page. UI-only — no API yet, same
 *  convention as lib/mock/overview.ts and lib/mock/users-roles.ts.
 *
 *  Cooperative/opt-in framing (matches the reference tool this page's
 *  content is modeled on): each entry only exists here because that
 *  person's own machine chose to report its Claude Code usage. Nothing on
 *  this page reads, controls, or reports on anyone's account or machine —
 *  "Invite" and "Remove" only affect whether a person shows up in this
 *  tracking list, not their actual Claude Code access. */

export type TeamRole = "admin" | "member";
export type TrackingStatus = "active" | "invited" | "removed";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TrackingStatus;
  modelsUsed: string[];
  lastActive: string;
  inputTokens: number;
  outputTokens: number;
  /** Per-person soft-budget override, in tokens. Unset = uses DEFAULT_SOFT_BUDGET_TOKENS. */
  budgetOverrideTokens?: number;
};

export function totalTokensFor(member: Pick<TeamMember, "inputTokens" | "outputTokens">): number {
  return member.inputTokens + member.outputTokens;
}

/** Soft budget every member uses unless they have their own override — an estimate, not a hard cap. */
export const DEFAULT_SOFT_BUDGET_TOKENS = 1_200_000;

export function effectiveSoftBudgetTokens(member: Pick<TeamMember, "budgetOverrideTokens">): number {
  return member.budgetOverrideTokens ?? DEFAULT_SOFT_BUDGET_TOKENS;
}

/** Percentage of the effective soft budget this person has used this period. */
export function softBudgetPctFor(
  member: Pick<TeamMember, "inputTokens" | "outputTokens" | "budgetOverrideTokens">,
): number {
  return Math.round((totalTokensFor(member) / effectiveSoftBudgetTokens(member)) * 100);
}

/** $ per 1K tokens — a rough blended estimate across the models in use, for the "API-equivalent cost" column. Not a real invoice. */
const COST_PER_1K_TOKENS = 0.006;

export function apiCostFor(member: Pick<TeamMember, "inputTokens" | "outputTokens">): number {
  return (totalTokensFor(member) / 1000) * COST_PER_1K_TOKENS;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Sarayuth Ai",
    email: "sarayuth.ai@cocdocs.example",
    role: "admin",
    status: "active",
    modelsUsed: ["Sonnet 5", "Haiku 4.5"],
    lastActive: "Today, 11:20 AM",
    inputTokens: 812_400,
    outputTokens: 214_600,
  },
  {
    id: "2",
    name: "Longsreyly",
    email: "longsreyly@cocdocs.example",
    role: "member",
    status: "active",
    modelsUsed: ["Sonnet 5"],
    lastActive: "Today, 09:05 AM",
    inputTokens: 456_200,
    outputTokens: 128_900,
  },
  {
    id: "3",
    name: "Chamreun Odompanha Ai",
    email: "chamreun.odompanha@cocdocs.example",
    role: "member",
    status: "active",
    modelsUsed: ["Opus 5", "Sonnet 5"],
    lastActive: "Yesterday, 06:40 PM",
    inputTokens: 1_240_000,
    outputTokens: 302_500,
    /** Admin already bumped her budget once — still over it. */
    budgetOverrideTokens: 1_500_000,
  },
  {
    id: "4",
    name: "Maly Kim",
    email: "maly.kim@cocdocs.example",
    role: "member",
    status: "invited",
    modelsUsed: [],
    lastActive: "Never",
    inputTokens: 0,
    outputTokens: 0,
  },
  {
    id: "5",
    name: "Former Contractor",
    email: "contractor@cocdocs.example",
    role: "member",
    status: "removed",
    modelsUsed: ["Haiku 4.5"],
    lastActive: "Jun 10, 2025, 02:14 PM",
    inputTokens: 88_100,
    outputTokens: 21_300,
  },
];

/** The signed-in actor — matches lib/mock/overview.ts's CURRENT_USER / users-roles' CURRENT_ACCOUNT_ID convention. */
export const CURRENT_TEAM_MEMBER_ID = "1";

/** Distinct solid color per row/legend swatch — same rotating palette users-roles.ts already uses. */
export const AVATAR_PALETTE = ["#6d3ce0", "#4c6ff0", "#1f9d6b", "#e0873c", "#d94f7c"] as const;

export function avatarColorFor(index: number): string {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length] as string;
}

export type DailyUsagePoint = {
  day: string;
  /** Tokens that day, keyed by TeamMember id — only members with reported usage that day appear. */
  byMember: Record<string, number>;
};

/** One week of daily totals for the currently-active reporters (ids 1-3). */
export const DAILY_USAGE: DailyUsagePoint[] = [
  { day: "Mon", byMember: { "1": 142_000, "2": 68_000, "3": 205_000 } },
  { day: "Tue", byMember: { "1": 168_000, "2": 74_000, "3": 189_000 } },
  { day: "Wed", byMember: { "1": 121_000, "2": 52_000, "3": 231_000 } },
  { day: "Thu", byMember: { "1": 155_000, "2": 81_000, "3": 198_000 } },
  { day: "Fri", byMember: { "1": 178_000, "2": 96_000, "3": 260_000 } },
  { day: "Sat", byMember: { "1": 32_000, "2": 12_000, "3": 58_000 } },
  { day: "Sun", byMember: { "1": 18_000, "2": 9_000, "3": 40_000 } },
];
