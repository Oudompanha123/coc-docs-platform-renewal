"use client";

import { useEffect } from "react";

export type SettingsToastState = { kind: "success" | "error"; message: string } | null;

/**
 * A small, self-dismissing toast for `/account/settings`'s own save flows.
 * This app has no toast system anywhere else — every other save flow uses
 * an inline success/error line next to the control instead — so this is
 * page-scoped rather than a new cross-cutting primitive, built to satisfy
 * this task's own "success toast on save; error toast on failure" wording.
 */
export function SettingsToast({ toast, onDismiss }: { toast: SettingsToastState; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
        toast.kind === "success" ? "bg-[#1f9d6b]" : "bg-danger"
      }`}
    >
      {toast.message}
    </div>
  );
}
