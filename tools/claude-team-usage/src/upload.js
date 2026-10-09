/**
 * POSTs one day's payload to the Coc Docs backend's /api/ingest.
 *
 * Same wire contract and diagnostics as push-usage.mjs's own send path — the
 * one difference is that a definite answer from the server (401/403/404/400)
 * is not retried: sending the same rejected credential again cannot succeed.
 *
 * // req: FR-USAGE-002, NFR-SEC-CHANNEL, ADR-047, ADR-059
 */

export const HTTP_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 1_500;

/**
 * The server's machine-readable `code` for the two refusals that are about the
 * account's tracking, not its credential (ADR-105). Matched on these, never on
 * the wording.
 */
export const TRACKING_DISABLED = 'tracking-disabled';
export const DISABLED_PERIOD = 'disabled-period';

/** What a person sees when an administrator has disabled their tracking. Never "log in again" — that cannot help. */
export const TRACKING_DISABLED_MESSAGE =
  'Claude usage tracking has been disabled for your account by an administrator, so nothing was uploaded. ' +
  'Contact your Coc Docs administrator if you think this is a mistake.';

/** `transient` failures are worth one retry; everything else is final. `code` is the server's reason, when it gave one. */
export class UploadError extends Error {
  constructor(message, { status = null, transient = false, code = null } = {}) {
    super(message);
    this.status = status;
    this.transient = transient;
    this.code = code;
  }
}

/**
 * Translate the transport failures a corporate laptop actually produces. fetch()
 * reports all of them as a bare "fetch failed", which tells a teammate nothing about
 * what to go and fix.
 */
function explainNetworkError(error, url) {
  const code = error?.cause?.code ?? error?.code ?? '';

  if (error?.name === 'AbortError') {
    return `no response from ${url} within ${HTTP_TIMEOUT_MS / 1000}s`;
  }
  if (code === 'SELF_SIGNED_CERT_IN_CHAIN' || code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    return (
      'a proxy or DLP agent on this machine is intercepting HTTPS and Node does not ' +
      'trust its certificate. Export that root CA and set NODE_EXTRA_CA_CERTS to it. ' +
      'Do not disable certificate checking — this request carries your personal token.'
    );
  }
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    return `cannot resolve the host in ${url}. Check COC_DOCS_URL, or run \`claude-team-usage login\` again.`;
  }
  if (code === 'ECONNREFUSED') {
    return `nothing is listening at ${url}. Is the Coc Docs backend running?`;
  }
  return `${error.message}${code ? ` (${code})` : ''}`;
}

/** The backend's own ApiException body carries a `detail`, and sometimes a `code`; fall back to the raw text. */
async function readProblem(res) {
  const body = await res.text().catch(() => '');
  try {
    const parsed = JSON.parse(body);
    return {
      detail: String(parsed.detail ?? parsed.message ?? body).slice(0, 200),
      code: typeof parsed.code === 'string' ? parsed.code : null,
    };
  } catch {
    return { detail: body.slice(0, 200), code: null };
  }
}

async function readDetail(res) {
  return (await readProblem(res)).detail;
}

async function postOnce(url, token, payload, { bypassToken, fetchImpl }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  let res;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        // Only present when the deployment sits behind Vercel Deployment Protection.
        ...(bypassToken ? { 'x-vercel-protection-bypass': bypassToken } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    throw new UploadError(explainNetworkError(error, url), { transient: true });
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401) {
    const body = await res.text().catch(() => '');
    // Vercel's own protection answers before the app does, and looks nothing like
    // our 401 — distinguishing them saves a long hunt for a wrong token.
    if (body.includes('vercel_auth_callback') || body.includes('_vercel_sso')) {
      throw new UploadError(
        'blocked by Vercel Deployment Protection, not by the app. Set ' +
          'VERCEL_AUTOMATION_BYPASS_SECRET to a Protection Bypass for Automation secret.',
        { status: 401 },
      );
    }
    throw new UploadError(
      'rejected (401): your token is invalid or has been revoked. ' +
        'Run `claude-team-usage login` to sign in again.',
      { status: 401 },
    );
  }
  if (res.status === 403) {
    const { detail, code } = await readProblem(res);
    // Not a credential problem: signing in again cannot help, so don't say it.
    if (code === TRACKING_DISABLED) {
      throw new UploadError(TRACKING_DISABLED_MESSAGE, { status: 403, code });
    }
    throw new UploadError(
      `rejected (403): ${detail || 'this token may only report usage for its own account'}. ` +
        'Run `claude-team-usage login` and sign in as yourself.',
      { status: 403, code },
    );
  }
  if (res.status === 409) {
    const { detail, code } = await readProblem(res);
    // One record from a time tracking was disabled: refused for good, never retried.
    throw new UploadError(
      code === DISABLED_PERIOD
        ? 'not recorded: tracking was disabled for your account at that time'
        : `HTTP 409 ${detail}`,
      { status: 409, code },
    );
  }
  if (res.status === 404) {
    throw new UploadError(`no ingest route at ${url}. It should end with /api/ingest.`, { status: 404 });
  }
  if (!res.ok) {
    throw new UploadError(`HTTP ${res.status} ${await readDetail(res)}`, {
      status: res.status,
      transient: res.status >= 500,
    });
  }

  const body = await res.json().catch(() => ({}));
  return { status: res.status, action: typeof body?.action === 'string' ? body.action : null };
}

/** At most one retry, and only for a transient failure — never an unbounded loop (CODE-002). */
export async function send(url, token, payload, opts = {}) {
  const options = {
    ...opts,
    fetchImpl: opts.fetchImpl ?? globalThis.fetch,
    retryDelayMs: opts.retryDelayMs ?? RETRY_DELAY_MS,
  };
  try {
    return await postOnce(url, token, payload, options);
  } catch (error) {
    if (!(error instanceof UploadError) || !error.transient || options.retry === false) throw error;
    options.onRetry?.(error);
    await new Promise((resolve) => setTimeout(resolve, options.retryDelayMs));
    return postOnce(url, token, payload, options);
  }
}

/**
 * Release the keep-alive sockets fetch() left open, so a scheduled run exits as soon
 * as its work is done instead of idling until the connection pool times out.
 */
export async function closeConnections() {
  try {
    await globalThis[Symbol.for('undici.globalDispatcher.1')]?.close?.();
  } catch {
    // No pool in use, or already closed - the process will exit on its own.
  }
}
