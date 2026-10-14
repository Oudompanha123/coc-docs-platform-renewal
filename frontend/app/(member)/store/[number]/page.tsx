"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StoreAppDetail } from "@/components/store/StoreAppDetail";
import { StoreAppForm } from "@/components/store/StoreAppForm";
import { StoreShell } from "@/components/store/StoreShell";
import { useSession } from "@/lib/auth/SessionProvider";
import { STORE_HREF, StoreNotFoundError, fetchStoreApp, type StoreApp } from "@/lib/store/store-api";

type State =
  | { status: "loading" }
  | { status: "missing"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; app: StoreApp };

/**
 * One app's page — `/store-<number>` in the browser (ADR-108).
 *
 * This file sits at `store/[number]` because a Next.js segment cannot be
 * `store-[number]`; `middleware.ts` rewrites `/store-3` here and redirects
 * `/store/3` back to `/store-3`, so the dash form is the only address users
 * see. `[number]` is read from the matched route, not the browser path.
 *
 * What a caller may see is the backend's answer: a user gets a public app
 * with builds or "not available"; an admin gets any app.
 */
export default function StoreAppPage() {
  const params = useParams<{ number: string }>();
  const router = useRouter();
  const { user } = useSession();
  const canManage = user?.role === "admin" || user?.role === "super_admin";
  const raw = params?.number ?? "";
  const number = /^\d+$/.test(raw) ? Number(raw) : null;

  const [state, setState] = useState<State>({ status: "loading" });
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    if (number === null) {
      setState({ status: "missing", message: "This app isn't available." });
      return;
    }
    setState({ status: "loading" });
    fetchStoreApp(number)
      .then((app) => setState({ status: "ready", app }))
      .catch((err: unknown) =>
        setState(
          err instanceof StoreNotFoundError
            ? { status: "missing", message: err.message }
            : { status: "error", message: err instanceof Error ? err.message : "Couldn't load this app." },
        ),
      );
  }, [number]);

  useEffect(() => {
    load();
  }, [load]);

  // The tab title names the app once it is known; layout.tsx's title covers the wait.
  useEffect(() => {
    if (state.status === "ready") document.title = `${state.app.name} — Store — Coc Docs Platform`;
  }, [state]);

  return (
    <StoreShell>
      {state.status === "loading" && (
        <div aria-busy="true" className="space-y-6">
          <div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
          <div className="h-40 animate-pulse rounded-3xl bg-gray-100" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-56 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-56 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      )}

      {(state.status === "missing" || state.status === "error") && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-lg font-bold text-ink">
            {state.status === "missing" ? "App not available" : "Couldn't load this app"}
          </p>
          <p role="alert" className="mt-1 max-w-md text-sm text-muted">
            {state.message}
          </p>
          <div className="mt-6 flex gap-2">
            {state.status === "error" && (
              <button
                type="button"
                onClick={load}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-ink hover:bg-page"
              >
                Try again
              </button>
            )}
            <Link
              href={STORE_HREF}
              className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
            >
              Back to the Store
            </Link>
          </div>
        </div>
      )}

      {state.status === "ready" && (
        <StoreAppDetail
          app={state.app}
          canManage={canManage}
          onChanged={(app) => setState({ status: "ready", app })}
          onDeleted={() => router.replace(STORE_HREF)}
          onEdit={() => setEditing(true)}
        />
      )}

      {editing && state.status === "ready" && (
        <StoreAppForm
          app={state.app}
          onSaved={(app) => setState({ status: "ready", app })}
          onClose={() => setEditing(false)}
        />
      )}
    </StoreShell>
  );
}
