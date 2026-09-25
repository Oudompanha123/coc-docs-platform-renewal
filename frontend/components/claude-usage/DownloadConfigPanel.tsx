"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircleIcon, DownloadIcon, TrashIcon, WarningIcon } from "@/components/layout/icons";
import { useSession } from "@/lib/auth/SessionProvider";
import { createUsageToken, listUsageTokens, revokeUsageToken, type UsageToken } from "@/lib/auth/api";
import { buildPersonalizedScript, downloadPersonalizedScript, personalizedScriptFileName } from "@/lib/admin/reporterConfig";

/** Where the generic, unpersonalized template lives — same file this panel fills in. */
const SCRIPT_TEMPLATE_URL = "/downloads/push-usage.mjs";

function formatDate(iso: string): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "";
  return when.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * "Download push-usage.mjs" — mints a personal `/api/ingest` token
 * (ADR-044) and immediately downloads a **single, self-contained**
 * `push-usage.mjs` with that token, the caller's email, name, and the
 * dashboard's ingest URL already embedded (ADR-048). Setting up the usage
 * reporter is: log in here, click this button, run the one file it
 * downloads — no companion config file, nothing to type in.
 *
 * The raw token only ever exists here for the instant it takes to fetch the
 * script template, embed the token, and download the result
 * (`buildPersonalizedScript`/`downloadPersonalizedScript`) — it is never put
 * into component state, never rendered, and `listUsageTokens` (used for the
 * list below) never carries it back from the server either.
 *
 * Only reachable at `admin`+ rank today: `POST /api/v1/me/usage-tokens`
 * (`ClaudeUsageIngestTokenService.MIN_ROLE`) mints a token only for its own
 * caller, and only admin/super_admin may call it — a plain member still
 * needs a shared secret or a token an admin hands them, same as before this
 * panel existed.
 */
export function DownloadConfigPanel() {
  const { user } = useSession();

  const [tokens, setTokens] = useState<UsageToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadedLabel, setDownloadedLabel] = useState<string | null>(null);

  const [revokingId, setRevokingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setTokens(await listUsageTokens());
      setListError(null);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Couldn't load your usage tokens.");
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!user?.email) return;

    const trimmed = label.trim() || "Reporter script";
    setGenerating(true);
    setActionError(null);
    setDownloadedLabel(null);
    try {
      const minted = await createUsageToken(trimmed);

      const templateRes = await fetch(SCRIPT_TEMPLATE_URL);
      if (!templateRes.ok) {
        throw new Error("Couldn't load the reporter script to personalize. Please try again.");
      }
      const template = await templateRes.text();

      // The raw token lives only in this local scope, used once, right here.
      const script = buildPersonalizedScript(
        template,
        user.email,
        user.displayName ?? user.email.split("@")[0]!,
        minted.token,
      );
      downloadPersonalizedScript(script);

      setDownloadedLabel(minted.label);
      setLabel("");
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't generate a token. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(token: UsageToken) {
    if (!window.confirm(`Revoke "${token.label}"? Any machine still using it will stop being able to report usage.`)) {
      return;
    }
    setRevokingId(token.id);
    setActionError(null);
    try {
      await revokeUsageToken(token.id);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't revoke that token. Please try again.");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="mt-4 rounded-[10px] border border-border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-dash-ink">Download push-usage.mjs</h2>
      <p className="text-xs text-muted">
        Get a ready-to-run <code className="rounded bg-page px-1 py-0.5 text-[11px]">push-usage.mjs</code> — your
        email, name, ingest URL, and a personal token are already embedded in the file. No config file, nothing to
        type in: download it and run <code className="rounded bg-page px-1 py-0.5 text-[11px]">node push-usage.mjs</code>.
      </p>

      <form onSubmit={handleGenerate} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='Label this machine, e.g. "My Laptop"'
          maxLength={80}
          disabled={generating}
          className="w-full flex-1 rounded-xl border border-border px-3 py-2 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple disabled:opacity-60 sm:w-auto"
        />
        <button
          type="submit"
          disabled={generating || !user?.email}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DownloadIcon className="h-4 w-4" />
          {generating ? "Generating…" : "Generate & Download"}
        </button>
      </form>

      {downloadedLabel && (
        <div role="status" className="mt-3 flex items-start gap-3 rounded-[10px] border border-brand-purple/20 bg-brand-purple/5 px-4 py-3">
          <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
          <p className="text-sm text-dash-ink">
            Downloaded <code className="rounded bg-white px-1 py-0.5 text-[11px]">{personalizedScriptFileName()}</code> for
            &quot;<span className="font-semibold">{downloadedLabel}</span>&quot;. Run{" "}
            <code className="rounded bg-white px-1 py-0.5 text-[11px]">node push-usage.mjs --dry-run</code> first to
            check it — nothing is sent until you drop <code className="rounded bg-white px-1 py-0.5 text-[11px]">--dry-run</code>.
          </p>
        </div>
      )}

      {downloadedLabel && (
        <div role="alert" className="mt-3 flex items-start gap-3 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3">
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-dash-ink">
            This file carries your personal ingest token — treat it like a password. Don&apos;t commit it to git,
            paste it into chat or a support ticket, or hand it to a teammate. Revoke it below and download a fresh
            one if it ever leaks.
          </p>
        </div>
      )}

      {actionError && (
        <div role="alert" className="mt-3 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {actionError}
        </div>
      )}

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Your tokens</h3>

        {loadingTokens ? (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        ) : listError ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {listError}
          </p>
        ) : tokens.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No tokens yet — generate one above.</p>
        ) : (
          <div className="mt-2 divide-y divide-border">
            {tokens.map((token) => (
              <div key={token.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dash-ink">{token.label}</p>
                  <p className="truncate text-xs text-muted">
                    Created {formatDate(token.createdAt)}
                    {" · "}
                    {token.lastUsedAt ? `Last used ${formatDate(token.lastUsedAt)}` : "Never used"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRevoke(token)}
                  disabled={revokingId === token.id}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  {revokingId === token.id ? "Revoking…" : "Revoke"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
