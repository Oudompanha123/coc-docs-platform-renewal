"use client";

import { useCallback, useEffect, useState } from "react";
import { MemberHeader } from "@/components/home/MemberHeader";
import { SettingsSideMenu } from "@/components/account/SettingsSideMenu";
import { ProfileCard } from "@/components/account/ProfileCard";
import { AppearanceCard } from "@/components/account/AppearanceCard";
import { ConnectedAccountsCard, type HrmsLinkState } from "@/components/account/ConnectedAccountsCard";
import { SecurityCard } from "@/components/account/SecurityCard";
import { ClaudeUsageCard } from "@/components/account/ClaudeUsageCard";
import { SettingsToast, type SettingsToastState } from "@/components/account/SettingsToast";
import { useProductStats } from "@/lib/docs/useProductStats";
import { fetchMyAttendance } from "@/lib/me/attendance";
import { todayIso } from "@/lib/attendance/dates";

/**
 * `/account/settings` — every signed-in account's own profile, appearance,
 * notifications, Claude usage, and connected-accounts page (see
 * `RequireAccountSession` for why this isn't nested under `(member)` or
 * `(shell)`). Reached from the header's user menu ("Profile" and "Settings"
 * both land here, the former at `#account`) — see `MemberHeader.tsx`'s own
 * comment. `/my-claude-usage` permanently redirects to `#claude-usage`
 * (`next.config.ts`, ADR-094).
 *
 * An incoming `#profile` hash (the section's old id, before the ADR-094
 * rename to `#account`) is rewritten and re-scrolled on mount, so an old
 * bookmark or external link still lands in the right place.
 *
 * The HRMS link status (department + linked/not-linked) is fetched once
 * here, from `GET /api/v1/me/attendance` — there is no dedicated "my HRMS
 * link" endpoint — and handed to both the Account card (Department field)
 * and the Connected accounts card, so a single request backs both rather
 * than each card asking separately.
 *
 * Card content (Account/Appearance/Notifications/Claude usage/Connected
 * accounts/Security/Sessions) is built out incrementally; each card owns
 * its own `<section id="...">`, which is the scroll-spy anchor
 * `SettingsSideMenu` observes — Notifications and Sessions, not yet built
 * (ADR-093), still render that same placeholder shape so the anchor exists
 * either way.
 */
export default function AccountSettingsPage() {
  const productStats = useProductStats();
  const [toast, setToast] = useState<SettingsToastState>(null);
  const [hrmsLink, setHrmsLink] = useState<HrmsLinkState>({ kind: "loading" });
  const [department, setDepartment] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash !== "#profile") return;
    window.history.replaceState(null, "", "#account");
    document.getElementById("account")?.scrollIntoView({ block: "start" });
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
          <SettingsSideMenu />

          <div className="min-w-0 flex-1 space-y-[18px]">
            <ProfileCard
              department={department}
              onSaved={() => setToast({ kind: "success", message: "Profile saved." })}
              onError={(message) => setToast({ kind: "error", message })}
            />
            <AppearanceCard />
            <section
              id="notifications"
              className="scroll-mt-24 rounded-[10px] border border-border bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-bold text-dash-ink">Notifications</h2>
            </section>
            <ClaudeUsageCard />
            <ConnectedAccountsCard state={hrmsLink} />
            <SecurityCard />
            <section id="sessions" className="scroll-mt-24 rounded-[10px] border border-border bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-dash-ink">Sessions</h2>
            </section>
          </div>
        </div>
      </main>

      <SettingsToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
