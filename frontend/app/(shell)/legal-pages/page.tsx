"use client";

import { useConfirm } from "@/components/ui/confirm";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ScaleIcon } from "@/components/layout/icons";
import { LegalPageEditor } from "@/components/legal/LegalPageEditor";
import { useSession } from "@/lib/auth/SessionProvider";
import { canEditLegalPages } from "@/lib/legal/permissions";

type Tab = "terms" | "privacy";

const TABS: { key: Tab; label: string }[] = [
  { key: "terms", label: "Terms of Service" },
  { key: "privacy", label: "Privacy Policy" },
];

/**
 * A tab shell over the two legal pages (ADR-104 r2.13). Both share one shape
 * since V81 — title, byline and one Markdown body — and one editor
 * (`LegalPageEditor`), mounted once per page.
 *
 * Both editors stay mounted and the inactive one is hidden. Switching tabs
 * used to unmount the editor, so it asked "Switch pages without saving?" and,
 * on yes, threw the edits away; now switching is free and each tab keeps its
 * work, marked with a dot while unsaved.
 *
 * Leaving the page is guarded here, once, for both tabs: the browser's own
 * prompt for a reload/close, and a confirm on any in-app link — each editor
 * used to register its own, which with both mounted would ask twice.
 */
export default function LegalPagesAdminPage() {
  const { user } = useSession();
  const canEdit = canEditLegalPages(user?.role);
  const confirm = useConfirm();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("terms");
  const [dirty, setDirty] = useState<Record<Tab, boolean>>({
    terms: false,
    privacy: false,
  });
  // Stable references — each editor's `useEffect(() => onDirtyChange?.(unsaved),
  // [unsaved, onDirtyChange])` depends on this identity; an inline arrow would
  // re-fire it every render ("Maximum update depth exceeded").
  const onTermsDirtyChange = useCallback(
    (d: boolean) => setDirty((prev) => ({ ...prev, terms: d })),
    [],
  );
  const onPrivacyDirtyChange = useCallback(
    (d: boolean) => setDirty((prev) => ({ ...prev, privacy: d })),
    [],
  );
  const anyDirty = dirty.terms || dirty.privacy;

  useEffect(() => {
    if (!anyDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    // In-app navigation (a sidebar link) doesn't fire beforeunload in the App
    // Router, so same-tab link clicks are caught in the capture phase. The
    // click is always stopped, then asked about in the app's dialog; "Leave"
    // navigates. (beforeunload above must stay the browser's own prompt.)
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!anchor || anchor.target === "_blank" || !href || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      void confirm({
        title: "Leave without saving?",
        description: "You have unsaved changes on the legal pages.",
        confirmLabel: "Leave",
        cancelLabel: "Stay",
        destructive: true,
      }).then((leave) => {
        if (!leave) return;
        if (href.startsWith("/")) router.push(href);
        else window.location.assign(href);
      });
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [anyDirty, confirm, router]);

  return (
    <AppShell
      pageTitle="Legal pages"
      pageSubtitle="Edit Terms of Service and Privacy Policy shown on the landing site"
      titleIcon={
        <ScaleIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />
      }
    >
      <div className="mx-auto max-w-[960px]">
        <div
          role="tablist"
          aria-label="Legal page"
          className="inline-flex rounded-full bg-muted-surface p-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              id={`legal-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={tab.key === activeTab}
              aria-controls={`legal-panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                tab.key === activeTab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {dirty[tab.key] && (
                <span
                  className="size-1.5 rounded-full bg-amber-500"
                  aria-label="unsaved changes"
                  role="img"
                />
              )}
            </button>
          ))}
        </div>

        <div
          id="legal-panel-terms"
          role="tabpanel"
          aria-labelledby="legal-tab-terms"
          hidden={activeTab !== "terms"}
          className="mt-4"
        >
          <LegalPageEditor
            slug="terms"
            pageName="Terms of Service"
            canEdit={canEdit}
            active={activeTab === "terms"}
            onDirtyChange={onTermsDirtyChange}
          />
        </div>
        <div
          id="legal-panel-privacy"
          role="tabpanel"
          aria-labelledby="legal-tab-privacy"
          hidden={activeTab !== "privacy"}
          className="mt-4"
        >
          <LegalPageEditor
            slug="privacy"
            pageName="Privacy Policy"
            canEdit={canEdit}
            active={activeTab === "privacy"}
            onDirtyChange={onPrivacyDirtyChange}
          />
        </div>
      </div>
    </AppShell>
  );
}
