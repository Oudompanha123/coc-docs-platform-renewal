/**
 * Mock data for the Overview dashboard's content — documents, workspaces,
 * activity. UI-only — no API yet.
 *
 * CURRENT_USER below still backs the Settings → Profile card and other
 * mock-only consumers, but the Topbar's own signed-in identity (name/role/
 * initials shown next to the avatar) comes from the real session
 * (`GET /api/v1/auth/me`, see `@/lib/auth/useCurrentUser`), not this
 * placeholder.
 */

export type Tone = "purple" | "green" | "orange" | "pink";

export type CurrentUser = {
  initials: string;
  name: string;
  role: string;
  tone: Tone;
  /** Added for the Settings → Profile card; every existing consumer of
   *  CURRENT_USER destructures only the fields it already used, so these
   *  are additive. */
  email: string;
  joinedDate: string;
};

export const CURRENT_USER: CurrentUser = {
  initials: "SA",
  name: "System Admin",
  role: "Super Admin",
  tone: "orange",
  email: "system.admin@cocdocs.example",
  joinedDate: "Jun 12, 2025",
};

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  timeAgo: string;
};

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", title: "New comment on Product Requirements v3", detail: "Jane Admin left a comment", timeAgo: "10m ago" },
  { id: "n2", title: "Workspace invite accepted", detail: "Maly Kim joined Engineering", timeAgo: "1h ago" },
  { id: "n3", title: "Document published", detail: "Onboarding Guide is now live", timeAgo: "3h ago" },
];

export type MessageItem = {
  id: string;
  name: string;
  initials: string;
  tone: Tone;
  preview: string;
  timeAgo: string;
};

export const MESSAGES: MessageItem[] = [
  { id: "m1", name: "Jane Admin", initials: "JA", tone: "green", preview: "Can you review the API draft today?", timeAgo: "5m ago" },
  { id: "m2", name: "Maly Kim", initials: "MK", tone: "purple", preview: "Thanks for the onboarding walkthrough!", timeAgo: "42m ago" },
  { id: "m3", name: "Sok Dara", initials: "SD", tone: "orange", preview: "Uploaded the Q3 retro notes.", timeAgo: "1h ago" },
  { id: "m4", name: "System", initials: "SY", tone: "pink", preview: "Weekly usage report is ready.", timeAgo: "4h ago" },
  { id: "m5", name: "Jane Admin", initials: "JA", tone: "green", preview: "Meeting moved to 3 PM tomorrow.", timeAgo: "1d ago" },
];

export const TOPBAR_COUNTS = {
  notifications: NOTIFICATIONS.length,
  mail: MESSAGES.length,
};

export type StatCardData = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendTone: "positive" | "neutral";
  icon: "document" | "layers" | "users" | "database";
  tone: Tone;
};

export const STAT_CARDS: StatCardData[] = [
  { id: "documents", label: "Total Documents", value: "184", trend: "+12 this week", trendTone: "positive", icon: "document", tone: "purple" },
  { id: "workspaces", label: "Active Workspaces", value: "9", trend: "+1 this month", trendTone: "positive", icon: "layers", tone: "green" },
  { id: "members", label: "Team Members", value: "27", trend: "+3 this month", trendTone: "positive", icon: "users", tone: "orange" },
  { id: "storage", label: "Storage Used", value: "6.2 GB", trend: "of 20 GB plan", trendTone: "neutral", icon: "database", tone: "pink" },
];

export type QuickActionData = {
  id: string;
  title: string;
  subtitle: string;
  icon: "plus" | "userPlus" | "plug" | "barChart";
  tone: Tone;
};

export const QUICK_ACTIONS: QuickActionData[] = [
  { id: "new-document", title: "New Document", subtitle: "Start writing", icon: "plus", tone: "purple" },
  { id: "invite-teammate", title: "Invite Teammate", subtitle: "Add to workspace", icon: "userPlus", tone: "green" },
  { id: "connect-integration", title: "Connect Integration", subtitle: "Link a tool", icon: "plug", tone: "orange" },
  { id: "view-reports", title: "View Reports", subtitle: "Usage & analytics", icon: "barChart", tone: "pink" },
];

export type DocumentStatus = "Published" | "Draft";

export type RecentDocumentData = {
  id: string;
  title: string;
  workspace: string;
  updatedAgo: string;
  status: DocumentStatus;
  initials: string;
  tone: Tone;
};

export const RECENT_DOCUMENTS: RecentDocumentData[] = [
  { id: "doc-1", title: "Product Requirements v3", workspace: "Engineering workspace", updatedAgo: "edited 2h ago", status: "Published", initials: "PD", tone: "purple" },
  { id: "doc-2", title: "Onboarding Guide", workspace: "People & Culture", updatedAgo: "edited 5h ago", status: "Published", initials: "OB", tone: "green" },
  { id: "doc-3", title: "API Reference Draft", workspace: "Engineering workspace", updatedAgo: "edited 1d ago", status: "Draft", initials: "AP", tone: "orange" },
  { id: "doc-4", title: "Q3 Retro Notes", workspace: "Leadership workspace", updatedAgo: "edited 2d ago", status: "Published", initials: "QR", tone: "purple" },
];

export type ActivityItemData = {
  id: string;
  title: string;
  detail: string;
  timeAgo: string;
};

export const RECENT_ACTIVITY: ActivityItemData[] = [
  { id: "activity-1", title: "Jane Admin published a doc", detail: "Product Requirements v3", timeAgo: "2h ago" },
  { id: "activity-2", title: "New member joined", detail: "Maly Kim added to Engineering", timeAgo: "5h ago" },
  { id: "activity-3", title: "Workspace created", detail: "Leadership workspace", timeAgo: "1d ago" },
  { id: "activity-4", title: "Comment added", detail: "API Reference Draft", timeAgo: "1d ago" },
];

export type WorkspaceMember = { initials: string; tone: Tone };

export type WorkspaceSummary = {
  id: string;
  name: string;
  documentCount: number;
  memberCount: number;
  statusTone: "green" | "amber";
  members: WorkspaceMember[];
};

export const WORKSPACES: WorkspaceSummary[] = [
  {
    id: "engineering",
    name: "Engineering",
    documentCount: 62,
    memberCount: 9,
    statusTone: "green",
    members: [
      { initials: "JD", tone: "purple" },
      { initials: "JA", tone: "green" },
      { initials: "SA", tone: "orange" },
    ],
  },
  {
    id: "people-culture",
    name: "People & Culture",
    documentCount: 28,
    memberCount: 5,
    statusTone: "green",
    members: [
      { initials: "MK", tone: "purple" },
      { initials: "JA", tone: "green" },
    ],
  },
  {
    id: "leadership",
    name: "Leadership",
    documentCount: 14,
    memberCount: 4,
    statusTone: "amber",
    members: [
      { initials: "SA", tone: "orange" },
      { initials: "JD", tone: "purple" },
    ],
  },
  {
    id: "product",
    name: "Product",
    documentCount: 41,
    memberCount: 7,
    statusTone: "green",
    members: [
      { initials: "JA", tone: "green" },
      { initials: "MK", tone: "purple" },
      { initials: "SA", tone: "orange" },
    ],
  },
];
