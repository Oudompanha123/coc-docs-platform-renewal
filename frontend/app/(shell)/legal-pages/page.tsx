"use client";

import { useCallback, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ScaleIcon } from "@/components/layout/icons";
import { PrivacyLegalPageEditor } from "@/components/legal/PrivacyLegalPageEditor";
import { TermsDocumentEditor } from "@/components/legal/TermsDocumentEditor";
import { useSession } from "@/lib/auth/SessionProvider";
import { canEditLegalPages } from "@/lib/legal/permissions";

type Tab = "terms" | "privacy";

const TABS: { key: Tab; label: string }[] = [
  { key: "terms", label: "Terms of Service" },
  { key: "privacy", label: "Privacy Policy" },
];

/**
 * A thin tab shell over two unrelated editors — not two views of one shared
 * form. Terms moved to the new plain-document shape and its own editor
 * (`TermsDocumentEditor`); Privacy keeps the original highlights/CTA shape
 * and editor (`PrivacyLegalPageEditor`) completely unchanged, since its
 * public `/privacy` page still reads that same shape (see the ADR note in
 * `V75__legal_pages_revert_privacy_shape.sql`). Each editor loads/saves/
 * publishes itself; this shell only decides which one is mounted and
 * confirms before switching away from one with unsaved changes.
 */
export default function LegalPagesAdminPage() {
  const { user } = useSession();
  const canEdit = canEditLegalPages(user?.role);

  const [activeTab, setActiveTab] = useState<Tab>("terms");
  const [dirty, setDirty] = useState<Record<Tab, boolean>>({ terms: false, privacy: false });
  // Stable references, not inline arrows — each editor's own `useEffect(() =>
  // onDirtyChange?.(unsaved), [unsaved, onDirtyChange])` depends on this
  // callback's identity. An inline arrow is a new function every render, so
  // the effect would re-fire every render it caused, which re-renders this
  // page, which creates another new arrow — "Maximum update depth exceeded".
  // `setDirty` itself is react's own stable setter, so `[]` is correct here.
  const onTermsDirtyChange = useCallback((d: boolean) => setDirty((prev) => ({ ...prev, terms: d })), []);
  const onPrivacyDirtyChange = useCallback((d: boolean) => setDirty((prev) => ({ ...prev, privacy: d })), []);

  function selectTab(tab: Tab) {
    if (tab === activeTab) return;
    if (dirty[activeTab] && !window.confirm("You have unsaved changes. Switch pages without saving?")) return;
    setActiveTab(tab);
  }

  return (
    <AppShell
      pageTitle="Legal pages"
      pageSubtitle="Edit Terms of Service and Privacy Policy shown on the landing site"
      titleIcon={<ScaleIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
    >
      <div role="tablist" className="inline-flex rounded-full border border-surface-border bg-card p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === activeTab}
            onClick={() => selectTab(tab.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              tab.key === activeTab ? "bg-muted-surface font-medium text-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === "terms" ? (
          <TermsDocumentEditor canEdit={canEdit} onDirtyChange={onTermsDirtyChange} />
        ) : (
          <PrivacyLegalPageEditor canEdit={canEdit} onDirtyChange={onPrivacyDirtyChange} />
        )}
      </div>
    </AppShell>
  );
}
