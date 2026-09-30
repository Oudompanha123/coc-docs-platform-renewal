import type { AxRenewalRunLocallyStatus } from "./api";

/**
 * What to tell the person watching Run Locally, for whatever state it is
 * actually in right now — never silence, matching the same "always show one
 * of a few honest states" rule `StackMoveSection`'s own `recommendationStatus`
 * already follows. `tone` picks the banner's styling; `message` is the whole
 * recommendation, always a real next step, never just a restated status word.
 */
export interface RunLocallyGuidance {
  tone: "success" | "info" | "error";
  message: string;
}

/**
 * Patterns matched against the process's own real, combined stdout/stderr
 * (`status.log`) — never a guess at *why* something failed, only recognizing
 * a handful of standard, unambiguous Node/npm error codes when the process
 * itself printed them. Mirrors how `AxRenewalLocalRunner`'s own `READY_URL`
 * regex already reads a real fact (the URL) off real output rather than
 * assuming one; this does the same for the failure case.
 */
const PORT_IN_USE = /EADDRINUSE/i;
const MISSING_DEV_SCRIPT = /missing script[:\s]*["']?dev["']?/i;
const ENOENT = /ENOENT/i;
const PACKAGE_JSON = /package\.json/i;
const NETWORK_ISSUE = /(ENOTFOUND|ETIMEDOUT|ECONNREFUSED|network timeout|registry\.npmjs\.org)/i;
const PERMISSION_ISSUE = /EACCES/i;

/**
 * Scans a failed run's real log for one of the handful of standard error
 * codes above. Returns `null` — never a made-up cause — when none of them
 * appear, so the caller can fall back to a generic "read the log" message
 * instead of pretending to have diagnosed something it hasn't.
 *
 * `ENOENT` and `package.json` are checked as two separate, unbounded
 * substring tests rather than one "ENOENT ... package.json" regex spanning
 * the whole joined log: the latter would either miss a real match split
 * across two of the process's own log lines (`.` does not cross a `\n`) or,
 * loosened to cross lines, risk pairing an ENOENT from one unrelated error
 * with an unrelated later mention of package.json in a 500-line window.
 */
function matchKnownFailure(log: string): string | null {
  if (PORT_IN_USE.test(log)) {
    return "Something else on this machine is already using that port. Free it — stop whatever's running there, or wait for it to exit — then press Start again.";
  }
  if (MISSING_DEV_SCRIPT.test(log) || (ENOENT.test(log) && PACKAGE_JSON.test(log))) {
    return 'This project has no "dev" script in its package.json — Run Locally only ever runs npm run dev. Add one to the generated project, then press Start again.';
  }
  if (NETWORK_ISSUE.test(log)) {
    return "npm install couldn't reach its registry. Check this machine's network connection or npm registry configuration, then press Start again.";
  }
  if (PERMISSION_ISSUE.test(log)) {
    return "A permissions error stopped this — check that this machine's user account can read and write the destination folder, then press Start again.";
  }
  return null;
}

/**
 * A dev server rendering an unhandled error for one request (e.g. Next.js's
 * own `TypeError: ... at Home (src/app/page.tsx:7:28)` overlay, then `GET /
 * 500 in 4248ms`) does not exit the process — it catches the error, answers
 * 500, and keeps serving everything else. `AxRenewalLocalRunner` only ever
 * flips to `failed` on a real nonzero process exit (ADR-048), so this class
 * of error leaves `status` at `running` (still up) or `stopped` (a person
 * pressed Stop after seeing it) — neither of which the AI Error Assistant's
 * "no failure to explain" gate (ADR-062) recognized until now.
 *
 * Two real, disclosed signals, not a guess: a JS error headline
 * (`TypeError:`/`ReferenceError:`/`Error:`/…) or the dev server's own
 * request-log line reporting a 5xx. Mirrors `AxRenewalLocalRunner`'s own
 * `hasRuntimeErrorEvidence` on the backend exactly, since both sides gate
 * the same action on the same real evidence.
 */
const JS_ERROR_HEADLINE = /\b\w*Error:\s/;
const SERVER_ERROR_RESPONSE = /\b(?:GET|POST|PUT|PATCH|DELETE)\s\S+\s5\d\d\b/;

export function hasRuntimeErrorEvidence(log: string[]): boolean {
  return log.some((line) => JS_ERROR_HEADLINE.test(line) || SERVER_ERROR_RESPONSE.test(line));
}

export function runLocallyGuidance(status: AxRenewalRunLocallyStatus): RunLocallyGuidance {
  switch (status.status) {
    case "running":
      if (hasRuntimeErrorEvidence(status.log)) {
        return {
          tone: "error",
          message:
            "Running, but a request just failed with a real error — scroll the log below, or ask AI to explain it.",
        };
      }
      return status.url
        ? {
            tone: "success",
            message: "Running — open the link above to see it. Pressing Stop ends the real process, not just this view.",
          }
        : {
            tone: "info",
            message:
              "Running, but nothing has announced a URL yet — check the log below; a slower dev server can take a little longer to report one.",
          };
    case "starting":
      return {
        tone: "info",
        message:
          "Starting — this is a real npm install && npm run dev, so a first run (installing dependencies from scratch) can take a while.",
      };
    case "stopped":
      if (hasRuntimeErrorEvidence(status.log)) {
        return {
          tone: "error",
          message:
            "Stopped — but the log below shows a real error from before it was stopped. Ask AI to explain it, or press Start to try again.",
        };
      }
      return { tone: "info", message: "Stopped. Press Start to run it again." };
    case "failed": {
      const known = matchKnownFailure(status.log.join("\n"));
      return {
        tone: "error",
        message:
          known ??
          'The process exited with an error. Scroll through the log below for the exact failure — common causes are a port already in use, a missing "dev" script, or npm install failing to reach its registry.',
      };
    }
  }
}
