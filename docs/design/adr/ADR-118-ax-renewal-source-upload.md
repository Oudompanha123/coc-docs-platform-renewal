# ADR-118: AX Renewal — Upload the Project's Source to the Backend's Disk

> **Status**: PROPOSED — implemented, awaiting PM approval
> **Date**: 2026-11-14
> **Author**: AI (Claude), on direct in-session instruction
> **Approver**: pending. A developer asked in-session: "make upload project store file source in this path [`file.server-path: F:\Image`] and file name is text store in column tb and for http request must use patch()". Not recorded as approved here (CONST-PROC-01).
> **Related ADR**: Revises ADR-037 (Attach sent the manifest only) and sits beside ADR-054/ADR-055 (a caller-typed `sourcePath`, unchanged). Departs from CONST-TECH-08 and ADR-115 (S3-compatible storage) — see §4.

---

## 1. Context

Attach read the picked folder in the browser and sent the backend one dependency manifest plus measured stats. The source itself never left the browser, so nothing on the server held the project that was attached. The request is to upload it, keep it in a configured folder on the backend, record the file's name in a table column, and use `PATCH` for the request.

## 2. Decision

- **One zip per project.** The browser packs the picked folder into a stored (uncompressed) zip — `lib/ax-renewal/zipSource.ts`, no new dependency — leaving out the same dependency, build-output and VCS folders the Attach counts already skip.
- **Route**: `PATCH /api/v1/ax-renewal/projects/{id}/source`, `multipart/form-data` with the archive in the `file` part (the browser sends `FormData`) — the form the requester asked for (revised 2026-11-14 from a raw body). The multipart limit is raised to this feature's cap (200 MB) in `MultipartUploadConfig`; it is deployment-wide, and the avatar and content-image uploads keep their own 2 MB checks. `PATCH` because it changes one attribute of an existing project. Same floor as the manifest (Admin); membership is checked in the service (ADR-070).
- **Where**: `file.server-path` (`FileInfoProperties`). The file is named `<uuid>.zip` by the server, never by the caller. Written as `.part` and moved into place when complete. Unset → the route answers 400 "not available on this deployment"; the application still starts.
- **Column**: `ax_renewal_project.source_filename text` (V88) holds the file **name** only — the folder is configuration, so moving it needs no data migration.
- **Replace and delete**: a second upload removes the previous file after the new name commits; deleting a project removes its file after the delete commits.
- **Audited**: `ax_renewal.source_upload`.
- **Not done here**: nothing reads the archive yet. Run analysis, Start implementation and the assistant still take a caller-typed `sourcePath` (ADR-055).

## 3. Considered Alternatives

| | Option | For | Against | |
|---|---|---|---|---|
| A | One zip as a multipart `file` part, `PATCH`, local folder | One file, one name, one column; `FormData`/`MultipartFile` as asked | Local disk (see §4); raises the deployment-wide multipart limit | Adopted |
| B | Multipart with one part per file | No zipping in the browser | Thousands of parts; no single file name to store | Not adopted |
| B2 | One zip as the raw request body (as the Store does, ADR-108) | No multipart limit to raise | Not the form asked for | Implemented first, then replaced by A on request |
| C | S3 through the existing client (ADR-115) | Survives a container being recreated; consistent with CONST-TECH-08 | Not what was asked; a later analysis step needs the files on a disk it can read | Deferred — see §4 |

## 4. Consequences

- **Departure from CONST-TECH-08 / ADR-115.** The archive is on the backend's local disk. On a deployment whose disk is the container's, an uploaded source is lost when the container is recreated, and `source_filename` then names a file that is gone. This needs the PM's decision before production use: mount a volume at `file.server-path`, or move this behind a storage interface as ADR-115 did for the Store.
- **Source code now leaves the developer's machine.** The Attach copy on screen says so. Config files with credentials inside the project (the Attach step's own "Credentials in source" warning) are uploaded with everything else.
- `file.server-path` must be set per environment (`FILE_SERVER_PATH`); a Windows path such as `F:\Image` is a development value.
