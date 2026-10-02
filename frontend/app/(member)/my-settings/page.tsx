"use client";

import { useState } from "react";
import { HomeFooter } from "@/components/home/HomeFooter";
import { MemberHeader } from "@/components/home/MemberHeader";
import { NotificationsModal } from "@/components/home/NotificationsModal";
import { ProfileModal } from "@/components/layout/ProfileModal";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { AppearanceCard } from "@/components/settings/AppearanceCard";
import { NotificationsCard } from "@/components/settings/NotificationsCard";
import { PushNotificationsCard } from "@/components/settings/PushNotificationsCard";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { AccordionSection } from "@/components/settings/AccordionSection";
import { ShieldIcon } from "@/components/auth/icons";
import { BellIcon, SunIcon } from "@/components/layout/icons";
import { useProductStats } from "@/lib/docs/useProductStats";

/**
 * `/my-settings` — the Member's own settings, opened from the header's
 * "My Settings" item. The admin `/settings` page is behind `RequireSession`,
 * which sends a plain `user` account to /welcome, so a Member gets this page
 * instead, under the `(member)` group's `RequireMemberSession` gate.
 *
 * Same cards as `/settings`, minus Profile — name and avatar are already in
 * the "My Profile" modal. Every card talks only to the caller's own account
 * (`/api/v1/auth/**`, `/api/v1/notifications/preferences`), all of which
 * sit at the `USER` floor server-side, so nothing here needs a higher role.
 */
export default function MySettingsPage() {
  const productStats = useProductStats();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(true);

  return (
    <div data-shell="home" className="min-h-screen bg-white">
      <MemberHeader
        products={productStats.status === "ready" ? productStats.products : []}
        onOpenProfile={() => setShowProfile(true)}
      />

      <main>
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="animate-entrance">
            <h1 className="text-center text-3xl font-bold text-ink">My Settings</h1>
            <p className="mx-auto mt-3 max-w-xl text-center text-base text-muted">
              Manage your appearance, notification and security preferences.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="animate-entrance [animation-delay:70ms]">
              <SettingsCard icon={SunIcon} title="Appearance" description="Theme and color settings">
                <AppearanceCard />
              </SettingsCard>
            </div>

            <div className="animate-entrance [animation-delay:70ms]">
              <SettingsCard icon={BellIcon} title="Notifications" description="Choose what you get notified about">
                <PushNotificationsCard />
                <NotificationsCard />
              </SettingsCard>
            </div>
          </div>

          <div className="animate-entrance mt-5 [animation-delay:105ms]">
            <AccordionSection
              icon={ShieldIcon}
              title="Security"
              description="Authentication, sessions, and account controls"
              isOpen={securityOpen}
              onToggle={() => setSecurityOpen((v) => !v)}
            >
              <SecurityTab />
            </AccordionSection>
          </div>
        </section>
      </main>

      <HomeFooter onOpenProfile={() => setShowProfile(true)} onOpenNotifications={() => setShowNotifications(true)} />

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
