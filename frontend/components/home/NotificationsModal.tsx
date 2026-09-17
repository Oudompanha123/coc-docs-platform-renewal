"use client";

import { Modal } from "@/components/users-roles/Modal";
import { PushNotificationsCard } from "@/components/settings/PushNotificationsCard";

/**
 * The Member page's "Notifications" action — reuses the one real,
 * self-service notification control (browser push permission, ADR-025)
 * rather than Settings → Notifications' per-type toggles, which are
 * mock/local-state only per that card's own comment. Not a route: `/settings`
 * itself sits inside the admin shell (`RequireSession`, admin+ only), so a
 * plain Member reaching this page can't navigate there — this is a modal for
 * the same reason `ProfileModal` is.
 */
export function NotificationsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Notifications" onClose={onClose}>
      <PushNotificationsCard />
    </Modal>
  );
}
