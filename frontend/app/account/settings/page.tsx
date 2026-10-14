"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MemberHeader } from "@/components/home/MemberHeader";
import { SettingsSideMenu } from "@/components/account/SettingsSideMenu";
import { SettingsTabPanels } from "@/components/account/SettingsTabPanels";
import { ProfileCard } from "@/components/account/ProfileCard";
import { PasswordSecurityCard } from "@/components/account/PasswordSecurityCard";
import { AppearanceCard } from "@/components/account/AppearanceCard";
import { NotificationsCard } from "@/components/account/NotificationsCard";
import { ConnectedAccountsCard, type HrmsLinkState } from "@/components/account/ConnectedAccountsCard";
import { SecurityCard } from "@/components/account/SecurityCard";
import { SessionsCard } from "@/components/account/SessionsCard";
import { ClaudeUsageCard } from "@/components/account/ClaudeUsageCard";
import { AttendanceCard } from "@/components/account/AttendanceCard";
import { SettingsToast, type SettingsToastState } from "@/components/account/SettingsToast";
import { useProductStats } from "@/lib/docs/useProductStats";
import { fetchMyAttendance } from "@/lib/me/attendance";
import { todayIso } from "@/lib/attendance/dates";
import { useSession } from "@/lib/auth/SessionProvider";
import {
  DEFAULT_SETTINGS_SECTION,
  getVisibleSettingsSections,
  resolveSettingsSectionFromHash,
  type SettingsSectionId,
} from "@/lib/account/settingsSections";

/**
 * `/account/settings` — every signed-in account's own profile, appearance,
 * notifications, Claude usage, and connected-accounts page (see
 * `RequireAccountSession` for why this isn't nested under `(member)` or
 * `(shell)`). Reached from the header's user menu ("Profile" and "Settings"
 * both land here, the former at `#account`) — see `MemberHeader.tsx`'s own
 * comment. `/my-claude-usage` permanently redirects to `#claude-usage`
 * (`next.config.ts`, ADR-094).
 *
 * Sections are tabs, not stacked cards: exactly one is visible at a time
 * (`SettingsTabPanels`), selected by `SettingsSideMenu` (a real
 * `role="tablist"`) and kept in sync with the URL hash. Every section stays
 * mounted regardless of which is shown, so switching tabs never loses
 * unsaved state (an in-progress Account edit, the Claude Usage period
 * dropdown). An incoming `#profile` hash (the section's old id, before the
 * ADR-094 rename to `#account`) is rewritten on mount, same as an unknown or
 * role-hidden hash falling back to Account — see `resolveSettingsSectionFromHash`.
 *
 * The HRMS link status (department + linked/not-linked) is fetched once
 * here, from `GET /api/v1/me/attendance` — there is no dedicated "my HRMS
 * link" endpoint — and handed to both the Account card (Department field)
 * and the Connected accounts card, so a single request backs both rather
 * than each card asking separately.
 */
export default function AccountSettingsPage() {
  const productStats = useProductStats();
  const { user } = useSession();
  const canSeeClaudeUsage = user?.role === "user" || user?.role === "admin" || user?.role === "super_admin";
  const visibleSections = getVisibleSettingsSections(canSeeClaudeUsage);

  const [toast, setToast] = useState<SettingsToastState>(null);
  const [hrmsLink, setHrmsLink] = useState<HrmsLinkState>({ kind: "loading" });
  const [department, setDepartment] = useState<string | null>(null);
  const [active, setActive] = useState<SettingsSectionId>(DEFAULT_SETTINGS_SECTION);
  const contentRef = useRef<HTMLDivElement>(null);

  // A tab switch never scrolls the page on its own — but if the just-
  // switched-to content area isn't on screen (e.g. the previous panel was
  // tall, the user scrolled down to read it, and the new one is shorter),
  // leaving the scroll position alone would strand the viewport over blank
  // space below the now-shorter page. Only that case gets corrected, and
  // instantly (no smooth scroll) — a visible jump there would be its own
  // kind of distracting.
  const revealContentTopIfHidden = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.top <= window.innerHeight * 0.75;
    if (!isVisible) el.scrollIntoView({ block: "start", behavior: "auto" });
  }, []);

  const activate = useCallback(
    (id: SettingsSectionId) => {
      setActive(id);
      window.history.replaceState(null, "", `#${id}`);
      revealContentTopIfHidden();
    },
    [revealContentTopIfHidden],
  );

  useEffect(() => {
    const resolved = resolveSettingsSectionFromHash(window.location.hash, visibleSections);
    setActive(resolved);
    window.history.replaceState(null, "", `#${resolved}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount only, to read the hash the page loaded with.
  }, []);

  const loadHrmsLink = useCallback(() => {
    setHrmsLink({ kind: "loading" });
    fetchMyAttendance(todayIso())
      .then((report) => {
        setDepartment(report.viewerLinked && report.department ? report.department : null);
        setHrmsLink(
          report.viewerLinked
            ? { kind: "linked", employeeName: report.rows[0]?.name ?? null }
            : { kind: "not-linked" },
        );
      })
      .catch((err: unknown) => {
        setDepartment(null);
        setHrmsLink({
          kind: "error",
          message: err instanceof Error ? err.message : "Couldn't load your HRMS link status.",
        });
      });
  }, []);

  useEffect(() => {
    loadHrmsLink();
  }, [loadHrmsLink]);

  return (
    <div data-shell="home" className="min-h-screen bg-white">
      <MemberHeader products={productStats.status === "ready" ? productStats.products : []} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="animate-entrance">
          <p className="text-sm text-muted">
            Account / <span className="font-semibold text-ink">Settings</span>
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-ink">Settings</h1>
          <p className="mt-1 text-sm text-muted">Manage your account, appearance, and notifications.</p>
        </div>

        <div className="mt-8 flex flex-col gap-[18px] md:flex-row md:items-start">
          <SettingsSideMenu active={active} onActivate={activate} />

          <div ref={contentRef} data-testid="settings-content" className="min-w-0 flex-1">
            <SettingsTabPanels
              active={active}
              panels={[
                {
                  id: "account",
                  content: (
                    <ProfileCard
                      department={department}
                      onSaved={() => setToast({ kind: "success", message: "Profile saved." })}
                      onError={(message) => setToast({ kind: "error", message })}
                    />
                  ),
                },
                { id: "appearance", content: <AppearanceCard /> },
                { id: "notifications", content: <NotificationsCard /> },
                ...(canSeeClaudeUsage
                  ? [{ id: "claude-usage" as const, content: <ClaudeUsageCard /> }]
                  : []),
                { id: "attendance", content: <AttendanceCard /> },
                { id: "connected-accounts", content: <ConnectedAccountsCard state={hrmsLink} /> },
                { id: "security", content: <SecurityCard /> },
                { id: "password-2fa", content: <PasswordSecurityCard /> },
                { id: "sessions", content: <SessionsCard /> },
              ]}
            />
          </div>
        </div>
      </main>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
