"use client";

import { useCallback, useEffect, useState } from "react";
import { listUsageTokens, revokeUsageToken, type UsageToken } from "@/lib/auth/api";

/**
 * "Report from the command line" — how to install the `claude-team-usage`
 * CLI, and every machine currently holding one of this account's ingest
 * tokens, each revocable. The CLI signs itself in through the browser on
 * first run (`/cli/authorize`, ADR-060), so there is nothing to generate or
 * copy here; `claude-team-usage logout` only forgets a token locally, which
 * is why the revoke list lives here.
 *
 * // req: FR-USAGE-002, ADR-047, ADR-053, ADR-060
 */
export function ConnectCliPanel() {
  const [tokens, setTokens] = useState<UsageToken[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reloadTokens = useCallback(async () => {
    try {
      setTokens(await listUsageTokens());
    } catch {
      setTokens(null); // the list is a convenience; the instructions still stand without it
    }
  }, []);

  useEffect(() => {
    void reloadTokens();
  }, [reloadTokens]);

  async function revoke(id: string) {
    try {
      await revokeUsageToken(id);
      await reloadTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't revoke that token.");
    }
  }

  const code = "rounded bg-page px-1.5 py-0.5 font-mono text-xs";

  return (
    <section aria-labelledby="connect-cli-heading" className="mt-8 rounded-[10px] border border-border bg-white p-6 shadow-sm">
      <h2 id="connect-cli-heading" className="text-base font-semibold text-dash-ink">
        Report from the command line
      </h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-dash-ink">
        <li>
          Install: <code className={code}>npm install -g claude-team-usage</code>
        </li>
        <li>
          Run <code className={code}>claude-team-usage scan</code>. The first time, your browser opens so you can approve it —
          after that it needs nothing.
        </li>
      </ol>

      {error && (
        <p role="alert" className="mt-3 text-xs text-danger">
          {error}
        </p>
      )}

      {tokens && tokens.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-dash-ink">Connected machines</h3>
          <ul className="mt-2 divide-y divide-border text-sm">
            {tokens.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {t.label}
                  <span className="ml-2 text-xs text-muted">
                    {t.lastUsedAt ? `last used ${new Date(t.lastUsedAt).toLocaleString()}` : "never used"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void revoke(t.id)}
                  aria-label={`Revoke ${t.label}`}
                  className="rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-dash-ink shadow-sm hover:shadow"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
