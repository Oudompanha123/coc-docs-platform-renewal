# ADR-043: Run Analysis Through a Local Claude Code Installation

> **Status**: PROPOSED
> **Date**: 2026-09-22
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Answers the "how does analysis actually get done" question [ADR-037](ADR-037-integrations.md) left open for a later phase. Does not touch ADR-011 (security model) or ADR-012 (the two-service split). **Revised by [ADR-059](ADR-059-revision-of-043-stack-move-recommendation.md)**: this ADR's prompt rule "do not recommend a target stack" no longer applies to the new `recommendedStackMove` field specifically — `runningOnToday` itself is unchanged, still present-tense only.

---

## 1. Context

AX Renewal's **Run analysis** button has always been honest about being a
placeholder. `AxRenewalService.runAnalysis` matches a handful of keywords
against the attached dependency manifest, and the finding it writes says so
in the product's own words:

> No AI model is connected on this deployment yet — this analysis is a
> keyword-matched placeholder, not a real reading of the attached source.

The assistant panel said the same thing from a second place, as a fixed
banner: *"No model connected — fixed commands only"*, with a **connect**
button that opened an explainer.

That explainer, `AiEnginePanel`, also recorded why the obvious approach was
refused. The reference prototype let somebody paste an Anthropic API key
into the browser and call `api.anthropic.com` from client-side JavaScript.
This application does not do that: the frontend never holds a credential
(ADR-011/012), and a key typed into a browser is a key in every browser.

So the feature has been waiting on somebody buying an API key. Meanwhile
every developer on this team already has Claude Code installed and signed
in on the machine where they run the backend.

## 2. Decision

**When a local Claude Code binary is configured, the backend runs it as a
subprocess and uses its answer. Otherwise nothing changes.**

Two new settings under `app.ax-renewal.*`, both optional:

| | |
|---|---|
| `claude-cli-path` | Absolute path to a Claude Code binary on this machine. Unset → the keyword stub, exactly as before. |
| `source-path` | Absolute path to the attached project's folder. Optional even with the CLI set. |

`LocalClaudeAnalyzer` invokes the binary with `--print --output-format json`,
and `--add-dir <source-path>` when that is configured too.

### Why local-only is the design, not a limitation

This is deliberately **not** a step towards the deployed site analysing
anything. What makes it work is co-location: the backend, the CLI, the
signed-in seat and the source folder are one computer. Remove any one and
the design stops being possible — which is exactly why it cannot become the
production answer by flipping configuration.

It is also what keeps it uncomplicated. A developer running Claude Code
against their own codebase on their own machine is using a development tool
the way it is meant to be used. A deployed server answering many people
through one person's seat is a different thing, and needs the paid API key
`anthropicApiKey` still reserves.

### What the model can actually see

The backend holds very little about an attached project, on purpose: the
attach step persists **one file** — the dependency manifest — plus counted
statistics. The source never leaves the browser.

So there are two honest levels, and the difference is reported rather than
blurred:

- **Manifest only** — real model reasoning about the stack, its dependencies
  and their risks. It has not seen a line of the code.
- **With `source-path`** — `--add-dir` points it at the folder and it reads
  the source the way it would in a terminal.

The browser cannot supply that path: the File API deliberately hides absolute
paths, and `attachStats.rootFolderName` is a folder *name* like
`"my-project"`, not `D:\work\my-project`. It is therefore configuration, and
only meaningful because the folder is on the same machine as the backend.

### What the banner says now

The assistant panel's line stops being a constant and starts being a report,
with three states:

| State | Shown |
|---|---|
| Not yet known | nothing |
| No model | `No model connected — fixed commands only` + **connect** |
| Local model, manifest only | `Local model connected — reads the manifest only` + **why** |
| Local model, source | `Local model connected — reads your source` |

Rendering nothing while the answer is in flight is deliberate. A flash of
"no model connected" that corrects itself a moment later would undermine the
one line whose whole purpose is to be trusted.

## 3. Consequences

**The deployed site keeps the keyword stub.** `docs.lovedev.me` has no
`claude` binary and no configuration, so `localClaudeConfigured()` is false
and nothing changes there. Teammates get real analysis on their own machines,
only after setting the path themselves. This should be said out loud rather
than discovered by whoever demonstrates the feature.

**The prompt carries text from an attached folder**, so it never touches a
command line. `ProcessBuilder` gets an argument array and no shell; the
prompt goes over stdin. There is no `sh -c` and no string concatenation, so
there is no command injection to get wrong.

**Every failure falls back rather than throwing** — missing binary, timeout
(3 minutes, then `destroyForcibly`), non-zero exit, output that is not the
requested JSON. Analysis is a convenience on top of a plan somebody is
writing by hand; it must not be able to fail the request that triggered it.
Each case logs enough to fix it, because a feature that silently does nothing
is worse than one that is plainly off.

**The audit entry distinguishes two claims** — `modelConnected` and
`readSource` are recorded separately, so a manifest-only run can never later
read as a review of the codebase.

**A synchronous call holds an HTTP request for up to three minutes.** Tolerable
for a local developer pressing a button; it would not be for a shared
deployment. If this ever runs anywhere multi-user, the existing
`ax_renewal_analysis` row is the natural place to write a status into and
poll — that change belongs with whoever makes it multi-user, not before.

## 4. Alternatives considered

**An API key in the browser** — what the prototype did. Refused: a key typed
into a browser is a key in every browser, and the frontend holding a
credential contradicts ADR-011/012.

**A server-side API key now** — the eventual answer for the deployed site, and
still what `anthropicApiKey` reserves. It costs money and a decision nobody
has made, and it would have left the local capability unbuilt in the
meantime.

**Uploading the source so the server can read it** — would make analysis work
identically everywhere, and contradicts the attach step's deliberate promise
that source never leaves the browser.

---

## 5. Follow-up

- [ ] PM approval — `PROPOSED` until then, and merging the code does not grant it
- [ ] Decide whether the deployed site ever gets an API key, or stays plan-only
- [ ] If this becomes multi-user, move the run off the request thread
