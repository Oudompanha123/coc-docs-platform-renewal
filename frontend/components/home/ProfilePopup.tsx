"use client";

import { avatarSrc } from "@/lib/account/avatarSrc";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
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
        className="relative w-[350px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* A large photo block, not a small circle over a cover band — the
            upload/remove behavior is unchanged, only its presentation. No
            `UserAvatar` reuse here: that component hardcodes `rounded-full`
            for every other (circular) caller, which this rectangular block
            can't share. `overflow-hidden` clips a non-square upload to the
            box; the outer card's own rounding already clips this block's
            top corners to match. */}
        <label
          className={`group relative block h-[320px] w-full overflow-hidden ${avatarBusy ? "cursor-wait" : "cursor-pointer"}`}
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
              className={`flex h-full w-full items-center justify-center text-5xl font-semibold text-white ${AVATAR_GRADIENTS.purple} ${avatarBusy ? "opacity-60" : ""}`}
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
            <CameraIcon className="h-7 w-7 text-white" />
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
          className="absolute right-[14px] top-[14px] flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-[#24216b] backdrop-blur-sm transition-colors hover:bg-white"
        >
          <XIcon className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center px-6 pb-6">
          {user?.avatarUrl && (
            <button
              type="button"
              onClick={() => void handleRemoveAvatar()}
              disabled={avatarBusy}
              className="mt-2 text-xs text-muted underline-offset-2 hover:text-danger hover:underline disabled:cursor-not-allowed"
            >
              Remove photo
            </button>
          )}
          {avatarError && <p className="mt-1 text-xs text-danger">{avatarError}</p>}

          <h2 id="profile-popup-name" className="mt-3 text-base font-semibold text-[#24216b]">
            {name}
          </h2>
          {roleChip && (
            <span
              className={`mt-2 inline-flex items-center rounded-full px-[11px] py-[3px] text-[11.5px] font-semibold ${roleChip.className}`}
            >
              {roleChip.label}
            </span>
          )}

          <dl className="mt-5 w-full rounded-[14px] border border-border px-3.5 py-1 text-[13px]">
            <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
              <dt className="flex items-center gap-2.5 text-muted">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-page">
                  <MailIcon className="h-3.5 w-3.5" />
                </span>
                Email
              </dt>
              <dd className="min-w-0 truncate text-right font-medium text-dash-ink" title={user?.email ?? undefined}>
                {user?.email ?? "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
              <dt className="flex items-center gap-2.5 text-muted">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-page">
                  <HomeIcon className="h-3.5 w-3.5" />
                </span>
                Department
              </dt>
              <dd className="min-w-0 truncate text-right font-medium text-dash-ink">{department ?? "—"}</dd>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
              <dt className="flex items-center gap-2.5 text-muted">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-page">
                  <LinkIcon className="h-3.5 w-3.5" />
                </span>
                HRMS KOSIGN
              </dt>
              <dd>
                {hrmsLink.kind === "linked" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e1f5ec] px-2.5 py-1 text-xs font-semibold text-[#1f9d6b]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
                    Linked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5d896]/60 px-2.5 py-1 text-xs font-semibold text-[#b45309]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b45309]" aria-hidden="true" />
                    Not linked
                  </span>
                )}
              </dd>
            </div>

            {lastSignIn && (
              <div className="flex items-center justify-between gap-3 py-2.5 last:border-0">
                <dt className="flex items-center gap-2.5 text-muted">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-page">
                    <ClockIcon className="h-3.5 w-3.5" />
                  </span>
                  Last sign-in
                </dt>
                <dd className="font-medium text-dash-ink">{lastSignIn}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex w-full flex-col gap-2.5">
            {hrmsLink.kind === "not-linked" && (
              <p className="rounded-xl border border-[#f5d896] bg-[#fffbeb] px-3 py-2.5 text-xs text-[#b45309]">
                Ask an admin to link your HRMS account to see attendance.
              </p>
            )}

            <Link
              href="/account/settings#account"
              onClick={onClose}
              className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <GearIcon className="h-4 w-4" />
              Open settings
            </Link>

            {canOpenDashboard(user?.role) && (
              <Link
                href="/overview"
                onClick={onClose}
                className="flex h-[46px] items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
              >
                <ReturnIcon className="h-4 w-4" />
                Open Dashboard
                <ExternalLinkIcon className="h-3.5 w-3.5 text-muted" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
