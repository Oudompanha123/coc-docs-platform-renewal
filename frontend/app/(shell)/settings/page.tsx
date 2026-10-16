"use client";

import { useEffect, useState } from "react";
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
import { BellIcon, PersonIcon, SettingsIcon, SunIcon, WarningIcon } from "@/components/layout/icons";
import { cn } from "@/lib/utils";

// Hoisted rather than created inline in the JSX below: AppShell's effect
// that publishes the header to ShellContext is keyed on this element's
// identity, and an inline JSX literal is a new object every render (e.g.
// every time the Security accordion opens/closes), re-firing that effect
// for no reason. A stable reference means it fires only when the page
// actually mounts.
const SETTINGS_TITLE_ICON = <SettingsIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />;

const SECTIONS = [
  { id: "profile", label: "Profile", icon: PersonIcon },
  { id: "appearance", label: "Appearance", icon: SunIcon },
  { id: "notifications", label: "Notifications", icon: BellIcon },
  { id: "security", label: "Security", icon: ShieldIcon },
  { id: "danger-zone", label: "Danger zone", icon: WarningIcon },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * The admin Settings page, in the design system's settings layout
 * (`patterns/dashboard-pages-settings`, ADR-104 r2.9): a section menu on the
 * left, one readable column of sections on the right. It replaced a stack of
 * full-width and side-by-side cards, where the page's own structure was
 * invisible until you scrolled through all of it.
 *
 * Every section stays mounted, and the menu scrolls to it rather than
 * switching panels — so an unsaved profile edit, an open TOTP setup or the
 * Security accordion's state all survive moving around the page. The menu
 * marks whichever section is nearest the top of the scroll area.
 *
 * All sections are real data (see each card's own component); this page only
 * arranges them.
 */
export default function SettingsPage() {
  const [securityOpen, setSecurityOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("profile");

  // Scroll-spy. The shell scrolls <main>, not the window, but an observer
  // rooted on the viewport still sees sections move through it. The bottom
  // margin narrows the "current" band to the top 40% of the screen, so the
  // section you are reading wins over the one peeking in below it.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        setActiveSection(topmost.target.id as SectionId);
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function goTo(id: SectionId) {
    setActiveSection(id);
    if (id === "security") setSecurityOpen(true);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AppShell
      pageTitle="Settings"
      pageSubtitle="Manage your profile, appearance, and notification preferences"
      titleIcon={SETTINGS_TITLE_ICON}
    >
      <div className="animate-entrance mx-auto grid max-w-5xl gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        {/* Below lg it is a scrolling row of chips above the content; at lg
            it becomes the sticky left column. `self-start` is what lets a
            grid item stick — stretched to the row's height it has nowhere to
            move. */}
        <nav aria-label="Settings sections" className="lg:sticky lg:top-0 lg:self-start">
          <ul className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={active ? "true" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(id);
                    }}
                    className={cn(
                      "flex h-9 items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-muted-surface font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      id === "danger-zone" && !active && "hover:text-destructive",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 max-w-3xl space-y-6">
          <section id="profile" className="scroll-mt-6">
            <SettingsCard icon={PersonIcon} title="Profile" description="Your name, email, and role information">
              <ProfileCard />
            </SettingsCard>
          </section>

          <section id="appearance" className="scroll-mt-6">
            <SettingsCard icon={SunIcon} title="Appearance" description="Theme and language">
              <AppearanceCard />
            </SettingsCard>
          </section>

          <section id="notifications" className="scroll-mt-6">
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
                  report comes from. */}
              <MailCredentialCard />
            </SettingsCard>
          </section>

          <section id="security" className="scroll-mt-6">
            <AccordionSection
              icon={ShieldIcon}
              title="Security"
              description="Authentication, sessions, and account controls"
              isOpen={securityOpen}
              onToggle={() => setSecurityOpen((v) => !v)}
            >
              <SecurityTab />
            </AccordionSection>
          </section>

          <section id="danger-zone" className="scroll-mt-6">
            <DangerZoneCard />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
