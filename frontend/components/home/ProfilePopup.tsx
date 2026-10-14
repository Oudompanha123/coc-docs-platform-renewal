"use client";

import { avatarSrc } from "@/lib/account/avatarSrc";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/SessionProvider";
import { removeAvatar, uploadAvatar } from "@/lib/auth/api";
import { fetchMyAttendance } from "@/lib/me/attendance";
import { todayIso } from "@/lib/attendance/dates";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import {
  CameraIcon,
  ClockIcon,
  ExternalLinkIcon,
  GearIcon,
  HomeIcon,
  LinkIcon,
  MailIcon,
  ReturnIcon,
  XIcon,
} from "@/components/layout/icons";
import type { HrmsLinkState } from "@/components/account/ConnectedAccountsCard";
import type { Role } from "@/lib/auth/api";

// Advisory only, matching every other client-side check in this codebase
// (CONST-TECH-07) and `ProfileModal`'s own identical pair — the backend's
// S3AvatarStorage re-decodes the bytes and is what actually decides.
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/**
 * Role chip style (table B of the mockup). `reviewer`/`lead` aren't in the
 * mockup's 4 example roles — both are AX Renewal staff roles alongside
 * `developer` (ADR-039), so they get `developer`'s tint rather than a color
 * nobody specified. `guest` never reaches this popup (no session), but
 * falls back to `user`'s neutral tint rather than being left undefined.
 */
const ROLE_CHIPS: Record<Role, { label: string; className: string }> = {
  guest: { label: "Guest", className: "bg-[#f3f4f6] text-[#374151]" },
  user: { label: "User", className: "bg-[#f3f4f6] text-[#374151]" },
  developer: { label: "Developer", className: "bg-[#ecfdf5] text-[#047857]" },
  reviewer: { label: "Reviewer", className: "bg-[#ecfdf5] text-[#047857]" },
  lead: { label: "Lead", className: "bg-[#ecfdf5] text-[#047857]" },
  admin: { label: "Admin", className: "bg-[#e0e7ff] text-[#4338ca]" },
  super_admin: { label: "Super Admin", className: "bg-[#5b4fe8] text-white" },
};

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]!.charAt(0);
  const second = words.length > 1 ? words[1]!.charAt(0) : "";
  return (first + second).toUpperCase();
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** `Today, 13:32` for today, `30 Sep 2026, 13:32` otherwise; null (hide the
 *  row) for no data or an unparsable date. Exported for direct unit tests.
 *
 *  <p>Built from `Date` getters with a fixed month-name table rather than
 *  `toLocaleDateString` — `Intl`'s own "short month" varies by locale (en-GB
 *  gives "Sept" for September, not "Sep"), which would make this row read
 *  differently depending on the browser's locale instead of matching the
 *  mockup exactly everywhere. */
export function formatLastSignIn(iso: string | null, now: Date = new Date()): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${time}`;
}

/** Same `admin`/`super_admin` floor `SettingsSideMenu`'s own Open Dashboard
 *  check uses (ADR-094's "replicated, not inherited" pattern) — this task's
 *  own constraint is that it must be the *same* check, not a shared import,
 *  so this one line is kept byte-for-byte identical to that one rather than
 *  factored into a helper neither file is allowed to introduce. */
export function canOpenDashboard(role: Role | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The profile popup opened from the header's user menu → Profile
 * (MemberHeader.tsx). Read-only except for the avatar — the same upload/
 * remove pair the older, editable `ProfileModal` (HomeFooter's separate
 * "Profile" link, the admin Topbar, the docs shell) exposes, since a photo
 * is the one thing people expect to be able to change from wherever their
 * own picture is shown. Everything else here (display name, password,
 * notifications) stays exclusive to that other surface and to the Account
 * section of `/account/settings`, which is where this popup's own "Open
 * settings" button lands.
 *
 * <p>Department and HRMS KOSIGN link status come from the same
 * `GET /api/v1/me/attendance` call `/account/settings` itself uses — there is
 * no dedicated "my HRMS link" endpoint, so this fetches it again itself
 * rather than depending on that page having already loaded.
 */
export function ProfilePopup({ onClose }: { onClose: () => void }) {
  const { user, refresh } = useSession();
  const [hrmsLink, setHrmsLink] = useState<HrmsLinkState>({ kind: "loading" });
  const [department, setDepartment] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset now, not after the upload settles, so choosing the same file
    // again later still fires this handler.
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setAvatarError("Photos must be PNG, JPEG, or WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("That photo is too large — please choose one under 2 MB.");
      return;
    }

    setAvatarBusy(true);
    setAvatarError(null);
    try {
      await uploadAvatar(file);
      await refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't upload that photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      await removeAvatar();
      await refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't remove that photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  useEffect(() => {
    fetchMyAttendance(todayIso())
      .then((report) => {
        setDepartment(report.viewerLinked && report.department ? report.department : null);
        setHrmsLink(
          report.viewerLinked
            ? { kind: "linked", employeeName: report.rows[0]?.name ?? null }
            : { kind: "not-linked" },
        );
      })
      .catch((err: unknown) => {
        setDepartment(null);
        setHrmsLink({
          kind: "error",
          message: err instanceof Error ? err.message : "Couldn't load your HRMS link status.",
        });
      });
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const container = dialogRef.current;
      if (!container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const name = user?.displayName ?? "";
  const initials = name ? initialsOf(name) : "?";
  const roleChip = user?.role ? ROLE_CHIPS[user.role] : null;
  const lastSignIn = formatLastSignIn(user?.lastSignInAt ?? null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-popup-name"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-surface-border bg-popover text-popover-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* A profile card in the design system's shape (ADR-104 r2.9): a
            centred round avatar on a faint band, not the 320px full-bleed
            photo it replaced, which turned a details card into a poster and
            cropped most uploads badly. Clicking the avatar still uploads —
            the camera shows on hover — and upload/remove are unchanged. */}
        <div aria-hidden="true" className="h-16 bg-muted-surface" />
        <label
          className={`group relative mx-auto -mt-10 block size-20 overflow-hidden rounded-full ring-4 ring-popover ${avatarBusy ? "cursor-wait" : "cursor-pointer"}`}
        >
          {user?.avatarUrl && !avatarLoadFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- the host is whichever the identity provider or S3AvatarStorage chose, same reasoning as UserAvatar's own <img>.
            <img
              src={avatarSrc(user.avatarUrl) ?? undefined}
              alt={name}
              referrerPolicy="no-referrer"
              onError={() => setAvatarLoadFailed(true)}
              className={`h-full w-full object-cover ${avatarBusy ? "opacity-60" : ""}`}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center text-2xl font-semibold text-white ${AVATAR_GRADIENTS.purple} ${avatarBusy ? "opacity-60" : ""}`}
              aria-hidden="true"
            >
              {initials}
            </div>
          )}
          <span
            className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
              avatarBusy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <CameraIcon className="size-5 text-white" />
          </span>
          <input
            type="file"
            aria-label="Upload profile photo"
            accept={Array.from(ALLOWED_AVATAR_TYPES).join(",")}
            className="sr-only"
            disabled={avatarBusy}
            onChange={(e) => void handleAvatarChange(e)}
          />
        </label>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XIcon className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center px-6 pb-6">
          {user?.avatarUrl && (
            <button
              type="button"
              onClick={() => void handleRemoveAvatar()}
              disabled={avatarBusy}
              className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline disabled:cursor-not-allowed"
            >
              Remove photo
            </button>
          )}
          {avatarError && <p className="mt-1 text-xs text-danger">{avatarError}</p>}

          <h2 id="profile-popup-name" className="mt-3 text-lg font-semibold text-foreground">
            {name}
          </h2>
          {roleChip && (
            <span
              className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleChip.className}`}
            >
              {roleChip.label}
            </span>
          )}

          <dl className="mt-4 w-full rounded-xl border border-surface-border px-3 py-1 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-surface-border py-2.5 last:border-0">
              <dt className="flex items-center gap-2.5 text-muted-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted-surface">
                  <MailIcon className="h-3.5 w-3.5" />
                </span>
                Email
              </dt>
              <dd className="min-w-0 truncate text-right font-medium text-foreground" title={user?.email ?? undefined}>
                {user?.email ?? "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-surface-border py-2.5 last:border-0">
              <dt className="flex items-center gap-2.5 text-muted-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted-surface">
                  <HomeIcon className="h-3.5 w-3.5" />
                </span>
                Department
              </dt>
              <dd className="min-w-0 truncate text-right font-medium text-foreground">{department ?? "—"}</dd>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-surface-border py-2.5 last:border-0">
              <dt className="flex items-center gap-2.5 text-muted-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted-surface">
                  <LinkIcon className="h-3.5 w-3.5" />
                </span>
                HRMS KOSIGN
              </dt>
              <dd>
                {hrmsLink.kind === "linked" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    Linked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                    Not linked
                  </span>
                )}
              </dd>
            </div>

            {lastSignIn && (
              <div className="flex items-center justify-between gap-3 py-2.5 last:border-0">
                <dt className="flex items-center gap-2.5 text-muted-foreground">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted-surface">
                    <ClockIcon className="h-3.5 w-3.5" />
                  </span>
                  Last sign-in
                </dt>
                <dd className="font-medium text-foreground">{lastSignIn}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex w-full flex-col gap-2">
            {hrmsLink.kind === "not-linked" && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                Ask an admin to link your HRMS account to see attendance.
              </p>
            )}

            <Button asChild size="lg" className="w-full">
              <Link href="/account/settings#account" onClick={onClose}>
                <GearIcon className="size-4" />
                Open settings
              </Link>
            </Button>

            {canOpenDashboard(user?.role) && (
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link href="/overview" onClick={onClose}>
                  <ReturnIcon className="size-4" />
                  Open Dashboard
                  <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
