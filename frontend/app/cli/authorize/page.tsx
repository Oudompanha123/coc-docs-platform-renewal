"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SessionProvider, useSession } from "@/lib/auth/SessionProvider";
import { BACKEND_URL, createCliAuthorization } from "@/lib/auth/api";
import { loopbackCallbackUrl, parseCliAuthorizeRequest } from "@/lib/auth/cliAuthorize";

/**
 * `/cli/authorize` — the consent screen `claude-team-usage scan` opens in the
 * browser on first run (ADR-060). A signed-out visitor is sent through the
 * normal `/login` (Google or password, unchanged) and brought back here via
 * `?next=`. Nothing is minted on page load: only an explicit Authorize click
 * asks the backend for a one-time code, and the browser then carries that
 * code — never a token — to the CLI listening on 127.0.0.1.
 *
 * Outside the `(member)` group on purpose: `RequireMemberSession` always
 * sends a signed-out visitor to a bare `/login`, which would lose this
 * request's parameters.
 *
 * // req: FR-USAGE-002, NFR-SEC-CHANNEL, ADR-060
 */
export default function CliAuthorizePage() {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <CliAuthorize />
      </Suspense>
    </SessionProvider>
  );
}

type Phase = "consent" | "working" | "done" | "cancelled";

function CliAuthorize() {
  const { status, user } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const request = parseCliAuthorizeRequest(searchParams);
  const [phase, setPhase] = useState<Phase>("consent");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous" && request) {
      router.replace(`/login?next=${encodeURIComponent(`${pathname}?${searchParams.toString()}`)}`);
    }
  }, [status, request, router, pathname, searchParams]);

  async function authorize() {
    if (!request) return;
    setPhase("working");
    setError(null);
    try {
      const code = await createCliAuthorization(request.codeChallenge, request.device);
      const api = new URL(BACKEND_URL, window.location.origin).origin;
      window.location.assign(loopbackCallbackUrl(request.port, { code, state: request.state, api }));
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't authorize the CLI. Please try again.");
      setPhase("consent");
    }
  }

  function cancel() {
    if (!request) return;
    window.location.assign(loopbackCallbackUrl(request.port, { error: "access_denied", state: request.state }));
    setPhase("cancelled");
  }

  let body: React.ReactNode;
  if (!request) {
    body = (
      <p role="alert" className="text-sm text-danger">
        This link isn&apos;t a valid sign-in request from claude-team-usage. Run <code>claude-team-usage scan</code> again
        in your terminal.
      </p>
    );
  } else if (status !== "authenticated" || !user) {
    body = <p className="text-sm text-muted">Checking your sign-in…</p>;
  } else if (phase === "done") {
    body = <p className="text-sm text-dash-ink">Done — return to your terminal. You can close this tab.</p>;
  } else if (phase === "cancelled") {
    body = <p className="text-sm text-dash-ink">Cancelled. Nothing was authorized. You can close this tab.</p>;
  } else {
    body = (
      <>
        <p className="text-sm text-dash-ink">
          Allow <strong>claude-team-usage</strong> on <strong>{request.device}</strong> to report your Claude Code usage as{" "}
          <strong>{user.email}</strong>?
        </p>
        <p className="mt-2 text-xs text-muted">
          Only approve this if you just ran <code>claude-team-usage</code> yourself. It can report usage for your account
          only, and you can revoke it any time under My Claude Usage → Connected machines. The machine name above was sent
          by the CLI.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-xs text-danger">
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => void authorize()}
            disabled={phase === "working"}
            className="rounded-full bg-dash-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {phase === "working" ? "Authorizing…" : "Authorize"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={phase === "working"}
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-dash-ink"
          >
            Cancel
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <main className="w-full max-w-md rounded-[10px] bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-lg font-bold text-ink">Connect claude-team-usage</h1>
        {body}
      </main>
    </div>
  );
}
