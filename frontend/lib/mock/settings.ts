/** Mock data for the Settings page. UI-only — no API yet, same convention as lib/mock/overview.ts. */

export type ActiveSession = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

export const ACTIVE_SESSIONS: ActiveSession[] = [
  { id: "1", device: "Chrome on Windows", location: "Phnom Penh, Cambodia", lastActive: "Active now", isCurrent: true },
  { id: "2", device: "Safari on iPhone", location: "Phnom Penh, Cambodia", lastActive: "2 hours ago", isCurrent: false },
  { id: "3", device: "Firefox on macOS", location: "Siem Reap, Cambodia", lastActive: "3 days ago", isCurrent: false },
];
