# ADR-023: A super admin can delete an account, not only deactivate it — revision of ADR-011

## Status

**PROPOSED** — 2026-09-15

Revises [ADR-011](ADR-011-security-model.md) §account lifecycle and the
"deactivate, never delete" position stated in code since V1. Does not touch the
approval gate ([ADR-017](ADR-017-approval-gate.md)), the role ladder
([ADR-016](ADR-016-roles-and-permissions.md)), or any authentication path.

- Deciders: PM (requested directly), architect.
- **`REQUIREMENTS-SPEC.md` §7 amendment for `FR-AUTH-003` is outstanding**, as
  it is for ADR-014, ADR-017 and ADR-021 before it.

---

## Context

Until now an account could only be deactivated. The position was recorded in
three places and consistently:

- `AccountRepository.setDeactivated` — *"Deactivate, never delete: authored
  content keeps its attribution."*
- `AccountService.reject` — *"Rejected rather than deleted, for the same reason
  accounts are deactivated rather than deleted: the audit trail has to be able
  to answer 'who applied, and who turned them down' a year later
  (NFR-OPS-AUDIT)."*
- The Users and roles screen, which ends a deactivated row at a disabled
  `Deactivated` label.

That reasoning is sound and this ADR does not dispute it. Deactivation remains
the right tool for the case it was written for: a person who worked here,
authored things, and has left. Their name should stay against their work.

It is the wrong tool for three cases that have all now occurred:

1. **A typo'd invite.** `AccountService.create` emails a temporary password to
   whatever address was typed (ADR-020). Get the address wrong and there is a
   permanent row for an account that was never a person.
2. **A duplicate.** The same human arriving once through Google and once
   through the invite flow leaves two rows, one of which is noise forever.
3. **A record that should not outlive the engagement.** A contractor, or a
   test account made during a demo.

In all three the row is not a historical fact worth keeping — it is a mistake,
and deactivation preserves the mistake permanently in the one list an admin
reads most.

There is a second, smaller problem this ADR settles alongside: **deactivation
was a one-way door in the UI**. The backend has supported reactivation since it
was written (`setActive(true)`, `ACCOUNT_REACTIVATE`), but nothing on the page
called it. A deactivated account could only be restored by editing the
database.

## Decision

### 1. `DELETE /api/v1/admin/accounts/{id}`, `super_admin` only

A new endpoint, not another flag on `PATCH`. Deletion is not a state the
account can be in — afterwards there is no account — and modelling it as one
would put "remove this person" one mistyped boolean away from "deactivate this
person". `204`, because there is nothing left to return.

The `super_admin` floor is the existing one: `/api/v1/admin/accounts/**` is
already gated in `SecurityConfig`, so this inherits it with no new rule. An
`admin` cannot grant a role or approve a registration (`FR-AUTH-008`); removing
the person outright is plainly not the lesser authority.

### 2. The audit trail survives the account, by design that was already there

This is what made deletion safe to add, and it was not new work. `audit_log`
has carried `actor_email text not null` since V1, with the comment
*"denormalised: survives account deletion"* — written before anything could
delete an account. Every reference to `account(id)` already declared its
intent:

| Reference | On delete | Effect |
|---|---|---|
| `audit_log.actor_id` | `set null` | The entry stays; `actor_email` still names who acted |
| `page_version.created_by` | `set null` | Published content stays |
| `app_session.account_id` | `cascade` | Sessions end immediately |
| `password_reset_token.account_id` | `cascade` | An unspent token dies with the account |
| `account_role.account_id` | `cascade` | Role grants go |

So NFR-OPS-AUDIT is met without a retention exception: deleting an account
removes the account, not the record of what it did.

### 3. `account_role.granted_by` gains `on delete set null` (V10)

The one column that had not declared its intent. Declared with no `ON DELETE`
action at all, PostgreSQL defaults it to `NO ACTION`, so the delete was refused
outright:

```
update or delete on table "account" violates foreign key constraint
"account_role_granted_by_fkey" on table "account_role"
```

This is an omission rather than a decision — nothing records a reason for it —
and it bites precisely the accounts most likely to need removing, because
granting a role is something only a `super_admin` does. **Anyone who had ever
approved a colleague was undeletable.** `set null` matches `audit_log.actor_id`
and the column's own V4 comment, which already describes null as normal for a
grant with no human actor. The grant survives; only the attribution moves to
`audit_log`, which keeps it under an email that does not disappear.

### 4. Two refusals, checked before the database gets there

- **Your own account.** Refused more firmly than self-deactivation is: that one
  is recoverable by a colleague, this one removes the account making the
  request, mid-request, with nothing to undo.
- **The last active `super_admin`.** V4's deferred constraint trigger fires on
  this `DELETE` and would raise at `COMMIT` regardless, so this is not the
  security boundary — it is checked first so the answer is a sentence naming
  what to do ("promote someone else before deleting …") rather than a
  constraint violation naming a trigger.

### 5. The confirmation is deliberately harder than Deactivate's

Deactivate is one button, because it is undoable. Delete asks for the email
address to be typed. The cost is a few seconds on a real deletion; what it buys
is that a misaimed click on the wrong row cannot complete. Case-insensitive —
the address is being copied off the row above, and failing somebody for
capitalisation teaches nothing.

### 6. Reactivate becomes reachable

A deactivated row now offers **Reactivate** where it previously showed a dead
label. No confirmation dialog: restoring access is reversible by the same
button that undid it, and prompting on every reversible action trains people to
dismiss prompts unread — which is exactly what would undermine the prompt on
Delete.

## Alternatives Considered

| Option | Why not |
|---|---|
| **Keep deactivate-only** | Does not answer the typo'd invite, the duplicate, or the record that should not persist. The row is not history, it is a mistake, and it sits permanently in the list admins read most |
| **Soft-delete flag (`deleted_at`)** | A third lifecycle state beside `status` and `deactivated_at`, with every query needing to remember it. The existing FK design already delivers what soft delete is usually for — surviving audit — without a new state to forget |
| **Anonymise in place** (blank the email, keep the row) | Keeps a row that means nothing, and `email` is `not null unique`, so the blanking scheme becomes its own small design problem. Worse for the reader than an absent row |
| **Cascade the audit entries too** | Would make deletion a way to erase a trail, which is the one thing it must not be |
| **Allow `admin` to delete** | `FR-AUTH-008` puts account management at `super_admin` and has dedicated negative tests. Widening it here would revise that requirement as a side effect of adding a button |

## Consequences

### Positive

- A mistaken account can be removed instead of managed forever.
- Deactivation stops being a one-way door.
- `account_role.granted_by` now says what it means, rather than blocking
  deletes as an accident of its declaration.
- The self and last-super-admin guards are enforced in the same place as the
  equivalent deactivation guards, so the two paths cannot drift.

### Negative — stated plainly

- **It is irreversible.** There is no undo at any level. The typed
  confirmation reduces misfires; it does not make the action recoverable.
  Restoring a wrongly deleted account means recreating it, and the new row is
  a different `id` — anything that referenced the old one has already gone
  null.
- **Attribution on content is lost**, not just hidden: `page_version.created_by`
  goes null, so "who wrote this page" becomes unanswerable from that column.
  `audit_log` still answers it for anything that generated an entry, but the
  two are not the same coverage.
- **A deleted account can register again** through the normal flow, subject to
  the approval gate. Deletion is not a ban, and nothing here claims otherwise.

### Required follow-up

1. Amend `REQUIREMENTS-SPEC.md` §7 for `FR-AUTH-003` to record deletion beside
   deactivation — outstanding for ADR-014/017/021 as well.
2. Add `DELETE /api/v1/admin/accounts/{id}` to `docs/api/openapi.yaml`.
3. Consider a retention or export path if an account's authored content ever
   needs re-attributing after its author is gone. Not required now — no page is
   db-backed yet.

## References

- Requirements: `FR-AUTH-003`, `FR-AUTH-008`, `NFR-OPS-AUDIT`
- Revises: `ADR-011` §account lifecycle
- Related: `ADR-016` (roles), `ADR-017` (approval gate), `ADR-020` (invite)
- Code: `backend/src/main/java/com/coc/docs/account/AccountService.java`,
  `AccountRepository.java`, `web/AdminAccountController.java`,
  `db/migration/V10__account_delete.sql`,
  `frontend/components/users-roles/DeleteModal.tsx`,
  `frontend/app/users-roles/page.tsx`
- Tests: `AccountDeletionTest`, `DeleteModal.test.tsx`, `AccountsTable.test.tsx`
