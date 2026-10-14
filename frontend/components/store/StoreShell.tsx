"use client";

import { useState, type ReactNode } from "react";
import { MemberHeader } from "@/components/home/MemberHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { NotificationsModal } from "@/components/home/NotificationsModal";
import { ProfileModal } from "@/components/layout/ProfileModal";
import { useProductStats } from "@/lib/docs/useProductStats";

/**
 * The `/home` header and footer around a Store page — the listing and each
 * app's page share it, so both read as part of the member site.
 */
export function StoreShell({ children }: { children: ReactNode }) {
  const productStats = useProductStats();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div data-shell="home" className="min-h-screen bg-white">
      <MemberHeader
        products={productStats.status === "ready" ? productStats.products : []}
        onOpenProfile={() => setShowProfile(true)}
      />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">{children}</main>
      <HomeFooter onOpenProfile={() => setShowProfile(true)} onOpenNotifications={() => setShowNotifications(true)} />
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
