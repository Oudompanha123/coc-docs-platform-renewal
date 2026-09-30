"use client";

import { useState } from "react";
import { HomeFooter } from "@/components/home/HomeFooter";
import { MemberHeader } from "@/components/home/MemberHeader";
import { NotificationsModal } from "@/components/home/NotificationsModal";
import { MyClaudeUsageSection } from "@/components/claude-usage/MyClaudeUsageSection";
import { ProfileModal } from "@/components/layout/ProfileModal";
import { useProductStats } from "@/lib/docs/useProductStats";

/**
 * `/my-claude-usage` — a real page again (ADR-052 v1.6, revising v1.5's
 * "embedded section on /home" design, on direct developer instruction).
 * Reached from the header's "Claude Usage" link as an actual navigation,
 * not a scroll-to — `MemberHeader.tsx`'s own comment on that link explains
 * why. Session gate comes from `(member)/layout.tsx` (this route lives
 * under that group), the same `RequireMemberSession` floor `/home` itself
 * uses — no separate check needed here.
 *
 * `MyClaudeUsageSection` reads only the caller's own rows from `GET
 * /api/v1/claude-usage/me` — moving it off `/home` changed nothing about
 * that. It no longer renders `DownloadConfigPanel` (removed on direct
 * developer instruction, kept only on the admin dashboard) — a plain
 * member self-minting a `push-usage.mjs` token still works via the setup
 * guide's own download link (ADR-053), just not from this page.
 *
 * `ConnectCliPanel` (the `claude-team-usage` CLI instructions and the
 * connected-machines revoke list, ADR-060) was removed from this page on
 * direct developer instruction.
 */
export default function MyClaudeUsagePage() {
  const productStats = useProductStats();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div data-shell="home" className="min-h-screen bg-white">
      <MemberHeader
        products={productStats.status === "ready" ? productStats.products : []}
        onOpenProfile={() => setShowProfile(true)}
      />

      <main>
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="animate-entrance">
            <h1 className="text-center text-3xl font-bold text-ink">Claude Usage</h1>
            <p className="mx-auto mt-3 max-w-xl text-center text-base text-muted">
              Track your Claude token usage.
            </p>
          </div>

          <div className="animate-entrance mt-10" style={{ animationDelay: "80ms" }}>
            <MyClaudeUsageSection />
          </div>
        </section>
      </main>

      <HomeFooter onOpenProfile={() => setShowProfile(true)} onOpenNotifications={() => setShowNotifications(true)} />

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
