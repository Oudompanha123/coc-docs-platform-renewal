"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
      <p role="alert" className="text-destructive text-sm">
        This link isn&apos;t a valid sign-in request from claude-team-usage. Run <code>claude-team-usage scan</code> again
        in your terminal.
      </p>
    );
  } else if (status !== "authenticated" || !user) {
    body = <p className="text-muted-foreground text-sm">Checking your sign-in…</p>;
  } else if (phase === "done") {
    body = <p className="text-foreground text-sm">Done — return to your terminal. You can close this tab.</p>;
  } else if (phase === "cancelled") {
    body = <p className="text-foreground text-sm">Cancelled. Nothing was authorized. You can close this tab.</p>;
  } else {
    body = (
      <>
        <p className="text-foreground text-sm">
          Allow <strong>claude-team-usage</strong> on <strong>{request.device}</strong> to report your Claude Code usage as{" "}
          <strong>{user.email}</strong>?
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          Only approve this if you just ran <code>claude-team-usage</code> yourself. It can report usage for your account
          only, and you can revoke it any time under My Claude Usage → Connected machines. The machine name above was sent
          by the CLI.
        </p>
        {error && (
          <p role="alert" className="text-destructive mt-3 text-xs">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            onClick={() => void authorize()}
            disabled={phase === "working"}
          >
            {phase === "working" ? "Authorizing…" : "Authorize"}
          </Button>
          <Button type="button" variant="outline" onClick={cancel} disabled={phase === "working"}>
            Cancel
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="bg-muted-surface flex min-h-screen items-center justify-center px-4">
      <main className="bg-card text-card-foreground border-surface-border w-full max-w-md rounded-xl border p-6 sm:p-8">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">Connect claude-team-usage</h1>
        {body}
      </main>
    </div>
  );
}
