"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchDashboard, type BudgetStatus, type ClaudeUsageMember } from "@/lib/admin/claudeUsage";
import { fetchMyUsage, type MyClaudeUsageDashboard } from "@/lib/claudeUsage/myUsage";
import { useSession } from "@/lib/auth/SessionProvider";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fill } from "@/lib/i18n/translations";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(n);
}

function BudgetBar({ pct, status }: { pct: number; status: BudgetStatus }) {
  const clamped = Math.min(pct, 100);
  const color = status === "red" ? "bg-red-500" : status === "amber" ? "bg-amber-400" : "bg-brand-purple";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function UsageSnapshotPanel() {
  const { user } = useSession();
  const { t } = useLanguage();
  const [me, setMe] = useState<ClaudeUsageMember | null | "none" | "error">(null);
  const [mine, setMine] = useState<MyClaudeUsageDashboard | "loading" | "error">("loading");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    if (!isAdmin) return;
    fetchDashboard("week")
      .then((dash) => {
        const row = dash.members.find(
          (m) => m.email.toLowerCase() === (user?.email ?? "").toLowerCase()
        );
        setMe(row ?? "none");
      })
      .catch(() => setMe("error"));
  }, [isAdmin, user?.email]);

  // Non-admin: the caller's own real usage (ADR-047), not a filtered read of
  // the team dashboard admins get below — GET /api/v1/claude-usage/me is the
  // one endpoint a plain user may call, since it is scoped server-side to
  // the signed-in session and can never be asked for anyone else's usage.
  useEffect(() => {
    if (isAdmin) return;
    fetchMyUsage()
      .then(setMine)
      .catch(() => setMine("error"));
  }, [isAdmin]);

  if (!isAdmin) {
    if (mine === "loading") {
      return (
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      );
    }

    if (mine === "error") {
      return (
        <Link
          href="/claude-usage"
          className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
        >
          <div>
            <h3 className="text-base font-semibold text-brand-purple">{t.panels.myUsage}</h3>
            <p className="mt-1 text-sm text-muted">{t.panels.loadError}</p>
          </div>
          <span className="mt-4 text-sm font-semibold text-brand-purple">{t.panels.openMyUsage}</span>
        </Link>
      );
    }

    if (mine.lastUpdated === null) {
      return (
        <Link
          href="/claude-usage"
          className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
        >
          <div>
            <h3 className="text-base font-semibold text-brand-purple">{t.panels.myUsage}</h3>
            <p className="mt-1 text-sm text-muted">{t.panels.noPersonalUsage}</p>
          </div>
          <span className="mt-4 text-sm font-semibold text-brand-purple">{t.panels.openMyUsage}</span>
        </Link>
      );
    }

    return (
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-brand-purple">{t.panels.myUsage}</h3>
            <span className="rounded-full bg-brand-purple/10 px-2.5 py-0.5 text-xs font-semibold text-brand-purple capitalize">
              {t.panels.today}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-page p-3">
            <p className="text-xs text-muted">{t.panels.tokens}</p>
            <p className="mt-0.5 text-lg font-bold text-ink">{fmt(mine.todayTotalTokens)}</p>
          </div>

          {mine.todayTotalTokens === 0 && (
            <p className="mt-3 text-xs text-muted">{t.panels.noPersonalUsage}</p>
          )}
        </div>

        <Link href="/claude-usage" className="mt-4 text-sm font-semibold text-brand-purple hover:underline">
          {t.panels.openMyUsage}
        </Link>
      </div>
    );
  }

  // Loading
  if (me === null) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  // Not on roster or error
  if (me === "none" || me === "error") {
    return (
      <Link
        href="/claude-usage"
        className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
      >
        <div>
          <h3 className="text-base font-semibold text-brand-purple">{t.panels.usageTitle}</h3>
          <p className="mt-1 text-sm text-muted">
            {me === "none" ? t.panels.notOnRoster : t.panels.loadError}
          </p>
        </div>
        <span className="mt-4 text-sm font-semibold text-brand-purple">{t.panels.openUsage}</span>
      </Link>
    );
  }

  // Real data. `budgetPct` already IS the percentage (e.g. 45 for 45%) --
  // never multiply it by 100 again.
  const pct = me.budgetPct;
  const pctColor = me.budgetStatus === "red" ? "text-red-500" : me.budgetStatus === "amber" ? "text-amber-500" : "text-brand-purple";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-brand-purple">{t.panels.myUsage}</h3>
          <span className="rounded-full bg-brand-purple/10 px-2.5 py-0.5 text-xs font-semibold text-brand-purple capitalize">
            {t.panels.thisWeek}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-page p-3">
            <p className="text-xs text-muted">{t.panels.tokens}</p>
            <p className="mt-0.5 text-lg font-bold text-ink">{fmt(me.totalTokens)}</p>
          </div>
          <div className="rounded-xl bg-page p-3">
            <p className="text-xs text-muted">{t.panels.costEst}</p>
            <p className="mt-0.5 text-lg font-bold text-ink">${me.costUsd.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-page p-3">
            <p className="text-xs text-muted">{t.panels.budget}</p>
            <p className={`mt-0.5 text-lg font-bold ${pctColor}`}>{pct}%</p>
          </div>
        </div>

        {me.totalTokens > 0 && (
          <div className="mt-3">
            <BudgetBar pct={pct} status={me.budgetStatus} />
            <p className="mt-1 text-xs text-muted">
              {fill(t.panels.tokensUsed, { used: fmt(me.totalTokens), total: fmt(me.effectiveBudgetTokens) })}
            </p>
          </div>
        )}

        {me.modelsUsed.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {me.modelsUsed.map((m) => (
              <span key={m} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                {m}
              </span>
            ))}
          </div>
        )}

        {me.totalTokens === 0 && (
          <p className="mt-3 text-xs text-muted">{t.panels.noUsage}</p>
        )}
      </div>

      <Link
        href="/claude-usage"
        className="mt-4 text-sm font-semibold text-brand-purple hover:underline"
      >
        {t.panels.openDashboard}
      </Link>
    </div>
  );
}
