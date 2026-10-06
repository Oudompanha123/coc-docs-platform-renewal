"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { ProfileCard } from "@/components/settings/ProfileCard";
import { AppearanceCard } from "@/components/settings/AppearanceCard";
import { NotificationsCard } from "@/components/settings/NotificationsCard";
import { PushNotificationsCard } from "@/components/settings/PushNotificationsCard";
import { MailCredentialCard } from "@/components/settings/MailCredentialCard";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { AccordionSection } from "@/components/settings/AccordionSection";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";
import { ShieldIcon } from "@/components/auth/icons";
import { BellIcon, PersonIcon, SettingsIcon, SunIcon } from "@/components/layout/icons";

// Hoisted rather than created inline in the JSX below: AppShell's effect
// that publishes the header to ShellContext is keyed on this element's
// identity, and an inline JSX literal is a new object every render (e.g.
// every time the Security accordion opens/closes), re-firing that effect
// for no reason. A stable reference means it fires only when the page
// actually mounts.
const SETTINGS_TITLE_ICON = <SettingsIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />;

/**
 * All sections are real data (see each card's own component) — this page
 * only arranges them. Security is the one accordion, reusing
 * AccordionSection (previously built, unused) rather than a new
 * expand/collapse pattern.
 *
 * No max-width wrapper — matches Overview's own container (AppShell's
 * <main> is the only width constraint). Entrance animation reuses
 * Overview's existing keyframe/utility (animate-entrance, globals.css).
 */
export default function SettingsPage() {
  const [securityOpen, setSecurityOpen] = useState(true);

  return (
    <AppShell
      pageTitle="Settings"
      pageSubtitle="Manage your profile, appearance, and notification preferences"
      titleIcon={SETTINGS_TITLE_ICON}
    >
      <div className="animate-entrance">
        <SettingsCard icon={PersonIcon} title="Profile" description="Your name, email, and role information">
          <ProfileCard />
        </SettingsCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="animate-entrance [animation-delay:70ms]">
          <SettingsCard icon={SunIcon} title="Appearance" description="Theme and color settings">
            <AppearanceCard />
          </SettingsCard>
        </div>

        <div className="animate-entrance [animation-delay:70ms]">
          <SettingsCard icon={BellIcon} title="Notifications" description="Choose what you get notified about">
            {/* The browser-permission toggle. Dropped from this page in
                900b81f while its import stayed, which is what failed the
                build — and a deliberate removal would have taken both. It is
                the only control that asks for notification permission, so
                without it nothing can be enabled at all (ADR-025). */}
            <PushNotificationsCard />
            <NotificationsCard />
            {/* Opting in to sending your own attendance mail from your own
                address, and to this app reading your inbox for it (ADR-063,
                ADR-084). Here rather than under Security because it is a
                notification preference in practice -- it decides who your
                report comes from -- and because Security is an accordion that
                is easy to never open. */}
            <MailCredentialCard />
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

      <div className="animate-entrance mt-5 [animation-delay:210ms]">
        <DangerZoneCard />
      </div>
    </AppShell>
  );
}
