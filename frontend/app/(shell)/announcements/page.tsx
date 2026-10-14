"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MegaphoneIcon, PlusIcon, TrashIcon, WarningIcon } from "@/components/layout/icons";
import { AnnouncementCategoryBadge } from "@/components/announcements/AnnouncementCategoryBadge";
import { AnnouncementEditorModal } from "@/components/announcements/AnnouncementEditorModal";
import { markdownToPlainText } from "@/lib/markdown/parse";
import {
  AnnouncementConfirmModal,
  type AnnouncementAction,
} from "@/components/announcements/AnnouncementConfirmModal";
import {
  deleteAnnouncement,
  listAnnouncements,
  publishAnnouncement,
  unpublishAnnouncement,
  type AdminAnnouncement,
} from "@/lib/admin/announcements";
import { Alert } from "@/components/ui/alert";
import { SearchInput } from "@/components/ui/search-input";
import { DropdownMenuItem, DropdownMenuSeparator, RowActions } from "@/components/ui/dropdown-menu";
import { EyeOff, Pencil, Send } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * What the list filters on. "expired" is its own tab even though it is not a
 * stored status (ADR-098): an expired announcement is still `published` in
 * the table, but readers no longer see it, and an admin needs to find those.
 */
type Filter = "all" | "published" | "draft" | "expired" | "archived";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Live" },
  { key: "draft", label: "Drafts" },
  { key: "expired", label: "Expired" },
  { key: "archived", label: "Unpublished" },
];

function matchesFilter(a: AdminAnnouncement, filter: Filter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "published":
      return a.status === "published" && !a.expired;
    case "expired":
      return a.status === "published" && a.expired;
    default:
      return a.status === filter;
  }
}

/**
 * The row's state as a chip. The literal hex tones are the app's existing
 * status chips (ConnectedAccountsCard's Linked / Not linked, ProfilePopup's
 * neutral role chips), chosen because globals.css already gives each a dark
 * mode counterpart — Tailwind's emerald/amber utilities have none there and
 * stayed light-mode colours on a dark card.
 */
function StatusPill({ announcement }: { announcement: AdminAnnouncement }) {
  const [label, tone, dot] =
    announcement.status === "published"
      ? announcement.expired
        ? ["Expired", "bg-[#fffbeb] text-[#b45309]", "bg-[#b45309]"]
        : ["Live", "bg-[#e1f5ec] text-[#1f9d6b]", "bg-[#1f9d6b]"]
      : announcement.status === "draft"
        ? ["Draft", "bg-[#f3f4f6] text-[#374151]", null]
        : ["Unpublished", "bg-[#f3f4f6] text-[#374151]", null];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />}
      {label}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Administration → Announcements (ADR-098): create, edit, publish, unpublish
 * and delete the notices every signed-in user sees in their notification bell.
 *
 * <p>Admin and super_admin, the same as the sidebar item and the
 * `/api/v1/admin/**` floor behind every call here; the backend enforces it.
 */
export default function AnnouncementsPage() {
  const [items, setItems] = useState<AdminAnnouncement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  // `null` closed, `"new"` creating, or the row being edited.
  const [editing, setEditing] = useState<AdminAnnouncement | "new" | null>(null);
  const [confirming, setConfirming] = useState<{ action: AnnouncementAction; announcement: AdminAnnouncement } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listAnnouncements());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const result = {} as Record<Filter, number>;
    for (const f of FILTERS) result[f.key] = (items ?? []).filter((a) => matchesFilter(a, f.key)).length;
    return result;
  }, [items]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (items ?? []).filter(
      (a) =>
        matchesFilter(a, filter) &&
        (query === "" ||
          a.title.toLowerCase().includes(query) ||
          // The words, not the Markdown: "maintenance on friday" finds "**Maintenance** on Friday".
          markdownToPlainText(a.body).toLowerCase().includes(query)),
    );
  }, [items, filter, search]);

  function upsert(saved: AdminAnnouncement) {
    setItems((prev) => {
      const list = prev ?? [];
      return list.some((a) => a.id === saved.id)
        ? list.map((a) => (a.id === saved.id ? saved : a))
        : [saved, ...list];
    });
  }

  async function runConfirmed() {
    if (!confirming) return;
    const { action, announcement } = confirming;
    setBusy(true);
    setActionError(null);
    try {
      if (action === "delete") {
        await deleteAnnouncement(announcement.id);
        setItems((prev) => (prev ?? []).filter((a) => a.id !== announcement.id));
        setNotice("Announcement deleted.");
      } else if (action === "publish") {
        upsert(await publishAnnouncement(announcement.id));
        setNotice("Announcement published. Members have been notified.");
      } else {
        upsert(await unpublishAnnouncement(announcement.id));
        setNotice("Announcement unpublished.");
      }
      setConfirming(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      pageTitle="Announcements"
      pageSubtitle="Notices shown to every member on the user site"
      titleIcon={<MegaphoneIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Administration / <b className="font-semibold text-foreground">Announcements</b>
          </p>
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setEditing("new");
            }}
            className="flex items-center gap-2 rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            New announcement
          </button>
        </div>

        {notice && (
          <Alert variant="success" className="font-medium" onDismiss={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

        <div className="overflow-hidden rounded-xl border border-surface-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter announcements">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    filter === f.key
                      ? "bg-secondary text-foreground"
                      : "border border-surface-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {f.label}
                  {items && <span className="ml-1 opacity-70">{counts[f.key]}</span>}
                </button>
              ))}
            </div>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements"
              aria-label="Search announcements"
              containerClassName="sm:w-64"
            />
          </div>

          {loading && !items && (
            <div className="animate-pulse space-y-3 p-4" role="status" aria-label="Loading announcements">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted-surface" />
              ))}
            </div>
          )}

          {!loading && loadError && (
            <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <WarningIcon className="h-6 w-6 text-danger" />
              <p className="text-sm font-medium text-danger">{loadError}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-control border border-danger/40 px-4 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
              >
                Retry
              </button>
            </div>
          )}

          {!loadError && items && visible.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <MegaphoneIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {items.length === 0
                  ? "No announcements yet. Create one to let every member know what's new."
                  : "No announcements match this view."}
              </p>
            </div>
          )}

          {!loadError && visible.length > 0 && (
            <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Announcement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-12 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((a) => (
                    <TableRow key={a.id}>
                      {/* One line per row (ADR-104 r2.10): the title, then as much of
                          the body as fits, muted. The "Updated … by …" line went —
                          Published already says when and by whom, and three lines a
                          row made a dozen announcements a long scroll. */}
                      <TableCell className="max-w-[360px] pl-4">
                        <p className="truncate" title={a.title}>
                          <span className="font-medium text-foreground">{a.title}</span>
                          <span className="text-muted-foreground"> — {markdownToPlainText(a.body)}</span>
                        </p>
                      </TableCell>
                      <TableCell>
                        <AnnouncementCategoryBadge category={a.category} />
                      </TableCell>
                      <TableCell>
                        <StatusPill announcement={a} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {a.status === "draft" ? "—" : formatDate(a.publishedAt)}
                        {a.status !== "draft" && a.publishedByName && ` · `}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{a.expiresAt ? formatDate(a.expiresAt) : "Never"}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <RowActions label={`Actions for "${a.title}"`}>
                          <DropdownMenuItem
                            onSelect={() => {
                              setNotice(null);
                              setEditing(a);
                            }}
                          >
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          {a.status === "published" ? (
                            <DropdownMenuItem
                              onSelect={() => {
                                setActionError(null);
                                setConfirming({ action: "unpublish", announcement: a });
                              }}
                            >
                              <EyeOff /> Unpublish
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={() => {
                                setActionError(null);
                                setConfirming({ action: "publish", announcement: a });
                              }}
                            >
                              <Send /> Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              setActionError(null);
                              setConfirming({ action: "delete", announcement: a });
                            }}
                          >
                            <TrashIcon /> Delete
                          </DropdownMenuItem>
                        </RowActions>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          )}
        </div>
      </div>

      {editing && (
        <AnnouncementEditorModal
          announcement={editing === "new" ? undefined : editing}
          onClose={() => {
            setEditing(null);
            // A "Save & publish" whose publish step failed still saved a
            // draft; re-reading shows it rather than leaving the list behind.
            void load();
          }}
          onSaved={(saved, published) => {
            upsert(saved);
            setEditing(null);
            setNotice(
              published
                ? "Announcement published. Members have been notified."
                : saved.status === "published"
                  ? "Changes saved. Members see the update right away."
                  : "Draft saved.",
            );
          }}
        />
      )}

      {confirming && (
        <AnnouncementConfirmModal
          action={confirming.action}
          title={confirming.announcement.title}
          busy={busy}
          error={actionError}
          onClose={() => setConfirming(null)}
          onConfirm={() => void runConfirmed()}
        />
      )}
    </AppShell>
  );
}
