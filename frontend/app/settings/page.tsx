import { AppShell } from "@/components/layout/AppShell";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { ProfileCard } from "@/components/settings/ProfileCard";
import { AppearanceCard } from "@/components/settings/AppearanceCard";
import { NotificationsCard } from "@/components/settings/NotificationsCard";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { SettingsIcon } from "@/components/layout/icons";
import { NOTIFICATION_PREFERENCES } from "@/lib/mock/settings";

/**
 * All four sections are always visible — no accordion/click-to-expand.
 * No max-width wrapper — matches Overview's own container (AppShell's
 * <main> is the only width constraint), so this uses the full content
 * area exactly like every other admin page instead of a narrower column.
 * Entrance animation reuses Overview's existing keyframe/utility
 * (animate-entrance, globals.css) rather than introducing a new one.
 */
export default function SettingsPage() {
  return (
    <AppShell
      pageTitle="Settings"
      pageSubtitle="Manage your profile, appearance, and notification preferences"
      titleIcon={<SettingsIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="animate-entrance">
        <SettingsCard title="Profile" description="Your name, email, and role information">
          <ProfileCard />
        </SettingsCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="animate-entrance [animation-delay:70ms]">
          <SettingsCard title="Appearance" description="Theme and color settings">
            <AppearanceCard />
          </SettingsCard>
        </div>

        <div className="animate-entrance [animation-delay:70ms]">
          <SettingsCard title="Notifications" description="Choose what you get notified about">
            <NotificationsCard data={NOTIFICATION_PREFERENCES} />
          </SettingsCard>
        </div>
      </div>

      <div className="animate-entrance mt-5 [animation-delay:140ms]">
        <SettingsCard title="Security" description="Authentication, sessions, and account controls">
          <SecurityTab />
        </SettingsCard>
      </div>
    </AppShell>
  );
}
