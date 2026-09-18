"use client";

import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { LogOutIcon, MenuIcon } from "@/components/layout/icons";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";

type AxRenewalTopbarProps = {
  onMenuClick: () => void;
};

/**
 * A deliberately slim header for this standalone tab — no notification bell,
 * activity feed, or product nav, since none of that belongs to AX Renewal.
 * Just enough to say what this tab is and let its owner sign out of it.
 */
export function AxRenewalTopbar({ onMenuClick }: AxRenewalTopbarProps) {
  const user = useCurrentUser();
  const { signOut } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-border bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-xl p-2 text-dash-ink transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-dash-ink sm:text-2xl">AX Renewal</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="truncate text-sm font-semibold text-dash-ink">{user?.name ?? "Guest"}</p>
          <p className="truncate text-xs text-muted">{user?.role ?? ""}</p>
        </div>
        <UserAvatar
          avatarUrl={user?.avatarUrl ?? null}
          initials={user?.initials ?? "?"}
          name={user?.name ?? "Guest"}
          className={`h-8 w-8 ${AVATAR_GRADIENTS.purple}`}
        />
        <button
          type="button"
          onClick={() => void signOut()}
          aria-label="Sign out"
          className="rounded-xl p-2 text-dash-ink transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
        >
          <LogOutIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
