# Deployment Software Requirements — Coc Docs Platform

What must exist **before** `docker compose up -d --build` is run, and what must
be installed on which machine.

This is the prerequisite list only. The procedure itself lives in
[`infra/README.md`](../../infra/README.md); developer setup lives in
[`CONTRIBUTING.md`](../../CONTRIBUTING.md). Nothing here repeats those — if a
step is missing from this page, it is because it is not a *requirement*, it is
an instruction.

> **Status.** The hosting target is recorded as `[DEFERRED]` in ADR-012 §2 and
> the ADR ratifying single-instance EC2 is still owed (`infra/README.md`,
> "Still owed"). This document describes the deployment that exists in
> `infra/`, not an approved architecture. Treat the host-specific rows as
> current practice, not as a decision that has passed a gate.

---

## 1. The short version

The server needs **four** things installed: a Linux OS, Docker Engine, the
Docker Compose v2 plugin, and git. Everything else the platform runs on —
Java, Node, PostgreSQL, Keycloak, nginx — arrives inside container images and
must **not** be installed on the host.

Everything that cannot be containerised is an *external account* you must hold
before deploying: a domain, a Google OAuth client, and an email address for the
certificate authority.

---

## 2. Host machine

### 2.1 Hardware

Sizing is driven by the JVM and by Keycloak's first start, which builds its
Quarkus augmentation and runs its own migrations — the peak moment of the whole
deployment.

| Memory | Verdict |
|---|---|
| 1 GB (`t3.micro`) | **Will not work.** The kernel kills the JVM, usually mid-migration |
| 2 GB (`t3.small`) | Works, no headroom. Add swap |
| 4 GB (`t3.medium`) | Recommended |

Budget: backend capped at 768 MB (`BACKEND_MEMORY`), frontend at 384 MB
(`FRONTEND_MEMORY`), and roughly 1 GB more between PostgreSQL, Keycloak, nginx
and certbot.

Disk must also hold the Maven dependency cache and the Next.js build during the
first `--build`, plus the `postgres_data` volume and — if MinIO runs here —
every uploaded image on the same disk.

### 2.2 Host software

| Software | Version | Required? | Why |
|---|---|---|---|
| Linux | Amazon Linux 2023 is what `infra/README.md` documents | Required | Any distribution with a current Docker Engine works; only the install command differs |
| Docker Engine | Current stable | Required | Runs every service |
| Docker Compose | **v2** (the `docker compose` plugin, not `docker-compose` v1) | Required | `infra/docker-compose.yml` uses `profiles:`, which v1 does not support |
| git | Any current | Required | Deployment is `git clone` + `git pull`; there is no artifact registry |
| `gzip`, `openssl` | Base install | Recommended | Backup (`pg_dumpall` piped to `gzip`) and certificate verification |

**Not required on the host, and should not be installed:** a JDK, Maven, Node,
npm, PostgreSQL, or psql. Each is present inside its own image, and a second
copy on the host is a version-skew defect waiting to happen. `psql` is reached
with `docker compose exec postgres psql`.

---

## 3. Software delivered as container images

Pinned in `infra/docker-compose.yml` and the two Dockerfiles. Listed so that an
air-gapped or mirrored registry can be prepared, and so that an upgrade is a
deliberate edit rather than a surprise.

| Service | Image | Pin |
|---|---|---|
| nginx | `nginx` | `1.27-alpine` |
| PostgreSQL | `postgres` | `16-alpine` |
| Keycloak | `quay.io/keycloak/keycloak` | `${KEYCLOAK_VERSION:-26.7.3}` |
| certbot | `certbot/certbot` | `latest` |
| MinIO *(optional)* | `minio/minio`, `minio/mc` | `latest` |
| Backend — build | `maven:3.9-eclipse-temurin-21` | Maven 3.9, JDK 21 |
| Backend — run | `eclipse-temurin:21-jre-alpine` | JRE 21 |
| Frontend — build & run | `node:22-alpine` | Node 22 |

Three of these float on `latest` (certbot, MinIO, `mc`). That is a rebuild
picking up a new version without anyone choosing it — acceptable for certbot,
worth pinning if MinIO holds production uploads.

**Database version.** The platform's stated floor is PostgreSQL 15+
(`CONST-TECH-08`); the deployment runs 16. The schema depends on partial unique
indexes, a deferred constraint trigger and `jsonb`, so a substitute engine is
not an option — integration tests run against real PostgreSQL via Testcontainers
for this reason, never H2.

**Node version skew.** CI and developer machines are on Node 24
(`CONTRIBUTING.md` step 4, `.github/workflows/ci.yml`), while
`infra/frontend.Dockerfile` builds and runs on Node 22, and
`frontend/package.json` declares `engines.node >= 20.11`. All three are
mutually compatible, but the deployed bundle is not built by the version CI
tested on. Worth aligning; not a blocker.

---

## 4. External services and accounts

These cannot be provisioned by the deployment and must be held in advance.

| Requirement | Required? | Consequence if absent |
|---|---|---|
| **Registered domain + DNS A record** resolving to the instance *before* the first `up` | **Required** | certbot answers the ACME challenge over port 80; without a resolving name no certificate is ever issued. An IP or an `ec2-….amazonaws.com` name will not do — Let's Encrypt issues for neither |
| **Email address for ACME** (`ACME_EMAIL`) | **Required** | Let's Encrypt registration |
| **Google OAuth 2.0 client** (id + secret) | **Required** | Google is the only sign-in path; there is no password column anywhere in the schema |
| **SMTP server** (`MAIL_*`) | Optional | Password-reset links are logged at WARN instead of sent and registration OTPs cannot be delivered. Google sign-in is unaffected |
| **Firebase project** — service-account JSON + web config | Optional | Backend logs `push not configured` and starts. The bell and the live notification stream (ADR-028) work regardless; only push is lost |
| **S3-compatible object storage** | Optional | Profile photos (ADR-026) and content-image uploads are unavailable; nothing else is affected. Either MinIO via `--profile storage`, or real S3. Only the S3 API and path-style addressing are used (`CONST-TECH-08`), so the two are interchangeable by `.env` alone |

**One thing Google needs from you.** The OAuth client's *Authorised redirect
URIs* must include:

```
https://<PUBLIC_DOMAIN>/auth/realms/docs_platform/broker/google/endpoint
```

Missing it fails sign-in with `redirect_uri_mismatch` — after deployment
otherwise succeeds.

---

## 5. Network

| | |
|---|---|
| Inbound `80/tcp` | From anywhere. ACME HTTP-01 challenge and the redirect to HTTPS |
| Inbound `443/tcp` | From anywhere. The site |
| Inbound `22/tcp` | **From your address only.** Administration |
| Everything else | Closed |

Only nginx binds a host port. PostgreSQL, Keycloak, the backend and the frontend
are unreachable from the internet by construction, which is why the list is
three entries long.

`5432` is deliberately **not** on it. If a database tool must reach the
instance, prefer the SSH tunnel (`DB_BIND_ADDRESS=127.0.0.1`, the default) over
opening the port; if the port is opened, it must be to specific addresses, never
`0.0.0.0/0`.

Outbound access is required to Docker Hub / quay.io, Maven Central, the npm
registry, Let's Encrypt, and — where configured — Google, Firebase, SMTP and S3.

One domain, one certificate: Keycloak is served under `/auth`, the API under
`/api`, the frontend everywhere else. There is no second DNS record and no
second certificate to renew.

---

## 6. Configuration required at deploy time

All of it comes from `infra/.env`, copied from `infra/.env.example` and
`chmod 600`. Variable **names** only are listed here; values belong in that
file and nowhere else (`SEC-001`/`SEC-003`).

**Required — the deployment refuses to start without these six:**

`PUBLIC_DOMAIN` · `ACME_EMAIL` · `DB_PASSWORD` · `KEYCLOAK_ADMIN_PASSWORD` ·
`GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET`

**Optional, grouped by the feature each one switches on** — every remaining
variable has a working default or degrades to a documented state:

| Group | Variables |
|---|---|
| Email | `MAIL_HOST` `MAIL_PORT` `MAIL_USERNAME` `MAIL_PASSWORD` |
| Push | `FIREBASE_CREDENTIALS` and the six `NEXT_PUBLIC_FIREBASE_*` |
| Storage | `S3_ENDPOINT` `S3_REGION` `S3_BUCKET` `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY` |
| Database | `DB_NAME` `DB_USER` `DB_SCHEMA` `DB_POOL_MAX` `DB_BIND_ADDRESS` |
| Keycloak | `KEYCLOAK_ADMIN_USER` `KEYCLOAK_DB_NAME` `KEYCLOAK_REALM` `KEYCLOAK_VERSION` `KEYCLOAK_CLIENT_ID` |
| Sizing / TLS | `BACKEND_MEMORY` `FRONTEND_MEMORY` `SESSION_TTL` `CERTBOT_STAGING` |
| HRMS attendance (shared inbox) | `APP_HRMS_ENABLED` `APP_HRMS_HOST` `APP_HRMS_PORT` `APP_HRMS_USERNAME` `APP_HRMS_PASSWORD` `APP_HRMS_SENDER` `APP_HRMS_FOLDER` `APP_HRMS_POLL_CRON` |
| Per-account mail credentials (ADR-063, ADR-075) | `APP_SECURITY_ENCRYPTION_KEY` |

### 6.1 `APP_SECURITY_ENCRYPTION_KEY` — read this before the first deploy

This one behaves unlike every other variable here, and getting it wrong is not
recoverable by editing a file.

- **What it is.** Base64 of exactly **32 random bytes** (AES-256). Generate it
  with `openssl rand -base64 32`, which produces 44 characters ending in `=`.
  The backend refuses to start if it decodes to any other length.
- **It is the only key to `account_mail_credential.app_password_encrypted`.**
  Every account's stored Gmail App Password is encrypted under it. Unlike
  `DB_PASSWORD`, which can be changed on both sides, **losing or changing this
  value makes every stored credential permanently unreadable** — there is no
  recovery, and each person must enter their App Password again.
- **It must be the same value everywhere the backend runs.** Two replicas with
  different keys will each fail to decrypt what the other wrote. The symptom is
  not an error: `AccountMailCredentialRepository.findFor` treats an
  undecryptable row as "no credential" and quietly falls back to the shared
  sender, so the feature degrades silently rather than complaining.
- **Do not reuse the development value in production.** A key that has been in
  a developer's `.env.local`, a terminal history or a chat transcript is a key
  that protects nothing.
- **Leaving it unset is a supported state.** `SecretBox.isConfigured()` returns
  false, no credential can be stored, personal inbox polling never runs, and
  attendance mail is sent by the shared `MAIL_*` sender. That is the correct
  configuration for a deployment that does not want this feature.

**The compose file must pass these through to the `backend` service** —
a variable present in `infra/.env` but absent from that service's `environment:`
block never reaches the JVM, and the feature then silently stays off. Verify
after deploy with the startup log line beginning `MAIL:` and, if HRMS polling
is on, `HRMS: polling …`.

Two further requirements that are easy to miss, each of which has cost an afternoon:

- **`FIREBASE_CREDENTIALS` is the service-account JSON on one line.** The `\n`
  sequences inside `private_key` are two characters and must stay that way. An
  editor that turns them into real newlines makes the JSON invalid, and the
  backend then refuses to start rather than quietly disabling push.
- **`NEXT_PUBLIC_*` are compiled into the browser bundle at build time**, not
  read at startup. Changing one requires
  `docker compose build frontend && docker compose up -d frontend`.
  `docker compose restart frontend` appears to work and changes nothing.

---

## 7. Build-time requirements

The default deployment builds on the instance, so nothing extra is needed. If
images are built elsewhere (CI, a build host), that machine needs:

| | |
|---|---|
| Docker with BuildKit | Both Dockerfiles are multi-stage |
| Build context = **repository root** | Both expect `docker build -f infra/backend.Dockerfile .` |
| Network to Maven Central and npm | `dependency:go-offline` and `npm ci` run inside the build |
| `frontend/package-lock.json` present | The frontend build is `npm ci`, which fails loudly if the lock file and `package.json` disagree — that is the point |
| Every `NEXT_PUBLIC_*` passed as `--build-arg` | They are inlined at build time; passing them at run time does nothing, silently |

Tests do **not** run in the deployment build, deliberately: the integration
suite needs Docker for Testcontainers and the build is already inside a
container. A deployment build compiles a commit CI has already tested.

---

## 8. Developer workstation

Not deployment requirements, but the same question is usually asked next. From
`CONTRIBUTING.md`:

| Software | Version | Notes |
|---|---|---|
| JDK | **21 exactly** | Not 22, not 25. The build fails on the wrong version with an explanation. Spring Boot 3.4 predates Java 25 and does not list it as supported |
| Maven | 3.9+ | Or `backend/mvnw`, which pins 3.9.9 |
| Node | **24** | For `frontend/` |
| Docker | Current | Integration tests use Testcontainers against real PostgreSQL |
| PostgreSQL access | 15+ | A shared server, one schema per developer (`DB_SCHEMA=cocdocs_<name>`) — never a shared schema |
| `gitleaks` | Current | L1 of the three-level security model, via the pre-commit hook |
| GitHub CLI (`gh`), authenticated | Current | `git push` working tells you nothing about `gh auth status`; they are separate credential stores |

---

## 9. Pre-flight checklist

Confirm each before the first `docker compose up`:

- [ ] Instance has ≥ 2 GB RAM (4 GB recommended), swap configured if 2 GB
- [ ] `docker --version` and `docker compose version` both answer; Compose reports **v2**
- [ ] Current user is in the `docker` group
- [ ] `dig +short <PUBLIC_DOMAIN>` prints the instance's public IP
- [ ] Security group: `80` and `443` open, `22` from your address, nothing else
- [ ] Google OAuth client exists, and its redirect URI includes the `/auth/realms/docs_platform/broker/google/endpoint` path
- [ ] `infra/.env` created from `.env.example`, all six required values filled, `chmod 600`
- [ ] `CERTBOT_STAGING=1` while DNS and the security group are still being settled — Let's Encrypt allows **five failed attempts per domain per week** against production
- [ ] A destination off the instance for `pg_dumpall` backups. A backup that exists only on the machine it protects is not a backup

A successful start prints, in order:

```
postgres   ... database system is ready to accept connections
keycloak   ... Listening on
backend    ... Successfully applied N migrations
backend    ... Started DocsPlatformApplication
certbot    ... Successfully received certificate
```

---

## 10. Explicitly not required

Worth stating, because each has been asked for at least once:

- **Claude Code / a local model.** AX Renewal's `Run analysis` uses a disclosed
  keyword match on the server and will keep doing so. Real analysis is a
  developer setup step on a machine that already has Claude Code — never a
  deployment dependency.
- **A second domain or certificate.** One of each, by design.
- **Java, Node or PostgreSQL on the host.** See §2.2.
- **An artifact registry.** Deployment is `git pull` + rebuild.
- **A separate Keycloak database server.** The same PostgreSQL container serves
  both databases (`infra/postgres-init/01-keycloak-database.sql`).

---

## 11. What this commits you to

From `infra/README.md`, because a requirements list that omits them is
misleading:

- **One instance is a single point of failure.** Updates are a short outage.
- **The notification stream assumes exactly one backend.** Connections are held
  in memory (ADR-028); a second instance would leave a tab connected to A
  hearing nothing raised on B.
- **`.env` is the secret store** — database password, Google client secret and
  Firebase service account, in plain text on the instance. Proportionate at this
  size; AWS Secrets Manager is the next step, not an immediate one.
- **Backups are manual** until someone schedules them.
- **MinIO on this instance shares its disk and its fate.**

---

## References

| | |
|---|---|
| Deployment procedure, troubleshooting | [`infra/README.md`](../../infra/README.md) |
| Developer setup | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) |
| Service topology, image pins | [`infra/docker-compose.yml`](../../infra/docker-compose.yml) |
| Variable catalogue | `infra/.env.example`, `backend/.env.example`, `frontend/.env.example` |
| Stack decision (hosting `[DEFERRED]`) | `docs/design/adr/ADR-012-revision-of-001-backend-stack.md` |
| Portability constraint | `CONST-TECH-08`, `docs/requirements/REQUIREMENTS-SPEC.md` |
| Email behaviour | [`docs/ops/EMAIL-DELIVERY.md`](EMAIL-DELIVERY.md) |
