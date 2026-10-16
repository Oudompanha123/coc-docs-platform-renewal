"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { StoreAppDetail } from "@/components/store/StoreAppDetail";
import { NextVersionDialog } from "@/components/store/NextVersionDialog";
import { StoreAppForm } from "@/components/store/StoreAppForm";
import { StoreShell } from "@/components/store/StoreShell";
import { useSession } from "@/lib/auth/SessionProvider";
import { STORE_HREF, StoreNotFoundError, fetchStoreApp, storeAppNumber, type StoreApp } from "@/lib/store/store-api";

type State =
  | { status: "loading" }
  | { status: "missing"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; app: StoreApp };

/**
 * One app's page — `/store/app-<number>` (ADR-108, ADR-111): its
 * information, its builds per platform, and for an admin Edit App info and
 * Next version. `middleware.ts` redirects the earlier `/store-3` and
 * `/store/3` forms here.
 *
 * What a caller may see is the backend's answer: a user gets a public app
 * or "not available"; an admin gets any app.
 */
export default function StoreAppPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useSession();
  const canManage = user?.role === "admin" || user?.role === "super_admin";
  const number = storeAppNumber(params?.slug ?? "");

  const [state, setState] = useState<State>({ status: "loading" });
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

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
          <div className="h-5 w-24 animate-pulse rounded-full bg-muted-surface/60" />
          <div className="h-80 max-w-3xl animate-pulse rounded-2xl bg-muted-surface" />
        </div>
      )}

      {(state.status === "missing" || state.status === "error") && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-surface-border px-6 py-16 text-center">
          <p className="text-lg font-semibold text-foreground">
            {state.status === "missing" ? "App not available" : "Couldn't load this app"}
          </p>
          <p role="alert" className="mt-1 max-w-md text-sm text-muted-foreground">
            {state.message}
          </p>
          <div className="mt-6 flex gap-2">
            {state.status === "error" && (
              <button
                type="button"
                onClick={load}
                className={buttonVariants({ variant: "outline" })}
              >
                Try again
              </button>
            )}
            <Link
              href={STORE_HREF}
              className={buttonVariants()}
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
          onNextVersion={() => setUploading(true)}
        />
      )}

      {editing && state.status === "ready" && (
        <StoreAppForm
          app={state.app}
          onSaved={(app) => setState({ status: "ready", app })}
          onClose={() => setEditing(false)}
        />
      )}

      {uploading && state.status === "ready" && (
        <NextVersionDialog
          app={state.app}
          onUploaded={(app, summary) => {
            setState({ status: "ready", app });
            toast.success(summary);
          }}
          onClose={() => setUploading(false)}
        />
      )}
    </StoreShell>
  );
}
