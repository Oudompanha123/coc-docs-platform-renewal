---
name: 09-dev-workflow
description: Developer loop for a branch-protected, task-tracked project. Start work from a task board item, ship it as a pull request, and keep the board in step with the code. Runs many times per sprint during Skill 04 implementation.
when_to_use: Whenever a developer starts a piece of work, is ready to open a pull request, or wants to see where their work stands. Used repeatedly inside Skill 04, not once per project.
phase: 3,4
lead_agent: team-leader
support_agents:
  - code-reviewer
  - docs-writer
outputs:
  - a feature branch and a pull request
  - task-board status and a PR link recorded against the task
---

# Skill 09 — Developer Workflow (Start · Ship · Status)

> **Purpose**: make the correct workflow the easy one. Branch from the integration branch, commit cleanly, run the checks locally, open a pull request, and keep the task board honest — without anyone having to remember six commands and two systems.
> **Nature**: a repeating operational skill, run many times per sprint. Not a phase.
> **Position**: used inside Skill 04. Does not replace it.

---

## 0. Responsible Agents

| Role | Agent | Responsibility |
|------|-------|----------------|
| Lead | `team-leader` | Sequences the steps, presents the plan, keeps board and branch in step |
| Support | `code-reviewer` | Pre-flight checks before a PR is opened; reviewer suggestion |
| Support | `docs-writer` | Commit and PR wording |

---

## 1. Principles

1. **Show the plan, confirm once, then run.** Never a step-by-step interrogation, and never silent action across two systems. One approval covers one command.
2. **Fail locally before failing in CI.** A build that takes two minutes here saves ten in a pipeline and a red mark on a shared branch.
3. **The board reflects the code.** A task in `진행` with no branch, or a merged PR with a task still `대기`, is a lie the next person has to untangle.
4. **Never push to a protected branch.** The pre-push hook enforces it; this skill never asks anyone to work around it.
5. **Degrade, do not fail.** No `gh`? Print the PR URL. No task board? Skip that step and say so. The skill works on a bare repository.

---

## 2. `start` — begin a piece of work

```
[A] Read the task board for tasks assigned to me
        ▼
[B] I pick one (or name the work directly if there is no board)
        ▼
[C] Verify the working tree is clean — refuse to proceed if not
        ▼
[D] git checkout <integration branch> && git pull
        ▼
[E] Derive a branch name from the task
        ▼
[F] PRESENT THE PLAN → single confirmation
        ▼
[G] Create the branch · set the task to in-progress
```

**Branch naming**: `feature/<slug>` from the task title, lowercased, non-alphanumerics to hyphens, trimmed to ~40 characters. `fix/<slug>` when the task is a defect. The developer can override.

**Refuse to continue** when the working tree is dirty. Offer `stash`, `commit`, or cancel — never discard.

---

## 3. `ship` — turn work into a pull request

```
[A] Confirm we are NOT on a protected branch
        ▼
[B] Pre-flight checks — the same ones CI runs
        │   backend present → build and test
        │   frontend present → typecheck, test, build
        │   FAILURES STOP HERE. Do not push a red branch.
        ▼
[C] Review the diff → draft a Conventional Commits message
        ▼
[D] PRESENT THE PLAN → single confirmation
        │   files · commit message · branch · PR title and target · board update
        ▼
[E] Commit → push → open the PR (or print its URL)
        ▼
[F] Comment the PR link on the task · move it to review/feedback
```

**Pre-flight is the point of this command.** Pushing a branch that fails its own build wastes a CI run, and on a shared board it wastes other people's attention.

**Commit message**: Conventional Commits, subject under 72 characters. Body says *why*, not *what* — the diff already says what. Reference requirement IDs where the project uses them.

### PR target — always pass it explicitly

**On this project the integration branch is `dev`. Every PR targets `dev`.**

```bash
gh pr create --base dev --head "$(git branch --show-current)" --fill
#             ^^^^^^^^^ never omit this
```

`--base` is not optional and not a default worth trusting. **`gh pr create` with no `--base` targets the repository's default branch, which is `main`** — and the "Compare & pull request" button GitHub shows after a push does the same. So the wrong target is what you get by doing nothing, which is the wrong way round for a rule that matters.

`main` is the release branch. It receives PRs **from `dev` only**. A PR from a feature branch into `main` skips integration, and — as happened on 2026-09-10 with PRs #10 and #18 — leaves `dev` behind `main`, so every branch cut afterwards silently reintroduces whatever `dev` is missing.

**Refuse** to open a PR into `main` unless the head branch *is* `dev`. Say why, and open it against `dev` instead.

`scripts/open-pr.sh` does this and prints the fallback URL when `gh` is not authenticated. Prefer it over a raw `gh pr create`.

> **Root cause worth fixing once**: set the repository's default branch to `dev`
> (Settings → General → Default branch). Then `gh`, the web UI and the post-push
> banner all propose the right target, and this rule stops depending on anyone
> remembering a flag. Keep `--base dev` explicit regardless — the flag costs
> nothing and survives someone changing the setting back.

---

## 4. `status` — where does my work stand

Read-only. Never changes anything.

| Shows | From |
|---|---|
| My assigned tasks and their status | task board |
| My open pull requests, and their CI state | `gh` if available |
| PRs waiting on my review | `gh` if available |
| My current branch, and whether it has diverged | git |
| Uncommitted work I have forgotten about | git |

Answers "what should I pick up next" without opening two browser tabs.

---

## 5. Degradation — what happens when a tool is missing

| Missing | Behaviour |
|---|---|
| `gh` not installed or not authenticated | Push, then print the PR URL to click. **Say which it did** — never imply a PR was opened when it was not |
| No task-board MCP configured | Skip board steps, work from a branch name the developer supplies, say so once |
| No `.githooks` installed | Warn, and point at the project's hook installer. Do not silently proceed as if protection exists |
| Detached HEAD, or mid-rebase / mid-merge | Refuse. Explain the state and stop |

> **Note on `gh`**: being able to `git push` is *not* the same as being authenticated to `gh`. Git credentials and GitHub CLI auth are separate. Always check `gh auth status` rather than assuming.

---

## 6. Rules

| Rule | Why |
|------|-----|
| Never commit or push to a protected branch | The whole point of the workflow |
| Never `--no-verify` | It bypasses the secret scan. If a hook is wrong, fix the hook |
| Never `push --force` to a shared branch | `--force-with-lease` on your own branch only |
| Never open a PR from a branch that fails its own build | §3 [B] |
| Never mark a task complete because a PR was *opened* | Complete means merged |
| Never invent a task-board id | If the task cannot be found, ask |

---

## 7. Definition of Done

**`start`**
- [ ] Branch created from an up-to-date integration branch
- [ ] Working tree was clean, or the developer chose what to do about it
- [ ] Task moved to in-progress, or its absence stated

**`ship`**
- [ ] Pre-flight checks passed — not skipped
- [ ] Commit follows the project convention
- [ ] Branch pushed; PR opened **or** its URL given, and which one is stated plainly
- [ ] PR targets `dev` — `--base dev` passed explicitly, never left to the default
- [ ] Task carries the PR link and its new status, or the skill said why not

---

## 8. Question Criteria

Per HARNESS-PROCESS-STANDARD §4.8:

| Situation | Criterion |
|---|---|
| Which task am I starting | **CQ1** — required input |
| The single plan confirmation before acting | **CQ3** — writes to two systems |
| Dirty tree, diverged branch, mid-rebase | **CQ2** — a defect signal exists |
| Ambiguous commit type, or work spanning several tasks | **CQ2** |

**Do not ask** which branch to target, whether to run the checks, or whether to follow the convention. Those are settled by the project, not by the developer at the moment of pushing.

---

## 9. Adapting to a project

Read from the project rather than assuming:

| Setting | Where it comes from | Fallback |
|---|---|---|
| Integration branch | `CONTRIBUTING.md`, else the repo's default | `dev`, then `develop`, then `main` |
| Release branch | repo default branch | `main` |
| Commit convention | `CONTRIBUTING.md` | Conventional Commits |
| Pre-flight commands | project build files present | skip with a note |
| Task board | configured MCP | skip with a note |

A project changes this skill's behaviour by changing `CONTRIBUTING.md`, not by editing the skill.
