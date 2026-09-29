# Deploying Coc Docs Platform

Everything on one EC2 instance, with Docker Compose. Every value comes from
`.env` — nothing here needs editing to deploy.

> **This is the `[DEFERRED]` hosting decision from ADR-012 §2 being made.**
> Two shipped features (profile photos, content images) have been waiting on
> it, and an ADR recording *why* EC2 and single-instance is still owed. See
> [What this commits you to](#what-this-commits-you-to).

## What runs

| | |
|---|---|
| **nginx** | TLS and routing. The only service with a host port |
| **certbot** | Obtains the certificate and renews it |
| **frontend** | Next.js, standalone build |
| **backend** | Spring Boot. Runs Flyway on start |
| **keycloak** | Identity broker, production mode, Postgres-backed |
| **postgres** | Both databases — the application's and Keycloak's |
| **minio** | *Optional.* S3-compatible storage for uploads |

One domain, one certificate. Keycloak is served under `/auth`, the API under
`/api`, and everything else is the frontend — so there is no second DNS record
and no second certificate to renew.

Only nginx binds a port. **Postgres, Keycloak, the backend and the frontend
are unreachable from the internet**, which is why the security group below
opens three ports and no more.

## Before you start

**Instance size.** The backend and frontend are capped at 768 MB and 384 MB;
Postgres, Keycloak, nginx and certbot want roughly another gigabyte between them.

| | |
|---|---|
| `t3.micro` (1 GB) | **will not work.** The kernel kills the JVM, usually mid-migration |
| `t3.small` (2 GB) | works, with little headroom. Add swap |
| `t3.medium` (4 GB) | comfortable — what I would run |

Keycloak's first start is the peak: it builds its Quarkus augmentation and runs
its own migrations. If it is going to fail for memory, it fails there.

**DNS.** An A record for your domain pointing at the instance's public IP,
*before* the first `up`. certbot answers the Let's Encrypt challenge over port 80,
and without a resolving name no certificate is ever issued. Neither an IP
address nor an `ec2-….amazonaws.com` name will do — Let's Encrypt issues for
neither.

**Security group.** Inbound `80` and `443` from anywhere, `22` from your own
address. Nothing else. Postgres is not on this list on purpose.

## Deploying

```bash
# On the instance
sudo dnf install -y docker git            # Amazon Linux 2023
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER" && exec newgrp docker

git clone https://github.com/Socheat-Hun/coc-docs-platform.git
cd coc-docs-platform/infra

cp .env.example .env
nano .env                                  # see below
chmod 600 .env

docker compose up -d --build
docker compose logs -f
```

The first build takes a while — Maven downloads its dependencies and Next
compiles. Subsequent builds reuse the layers.

Watch for these, in order:

```
postgres   ... database system is ready to accept connections
keycloak   ... Running the server in development mode ... → then Listening on
backend    ... Successfully applied N migrations
backend    ... Started DocsPlatformApplication
certbot    ... Successfully received certificate
```

## Filling in `.env`

Six values are required and the deployment refuses to start without them:
`PUBLIC_DOMAIN`, `ACME_EMAIL`, `DB_PASSWORD`, `KEYCLOAK_ADMIN_PASSWORD`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Everything else has a working
default or degrades to a documented state.

**One thing Google needs from you.** Add this to the OAuth client's *Authorised
redirect URIs*:

```
https://<PUBLIC_DOMAIN>/auth/realms/docs_platform/broker/google/endpoint
```

Without it sign-in fails with `redirect_uri_mismatch`. Google's error names the
URI it expected, which is the one to paste back.

### The one asymmetry: `NEXT_PUBLIC_*`

Next.js compiles these **into the browser bundle at build time**. They are not
read when the server starts — by then they are string literals inside the
JavaScript the browser downloads.

So changing one is a rebuild, not a restart:

```bash
docker compose build frontend && docker compose up -d frontend
```

`docker compose restart frontend` will appear to work and change nothing. This
is the single easiest thing to get wrong here, which is why it is called out in
`.env.example`, in `frontend.Dockerfile` and again here.

Everything else — database, Keycloak, mail, Firebase server credentials,
storage — is read at startup, so `docker compose up -d` is enough.

### `APP_PUBLIC_URL` (backend) — the URL baked into downloaded reporter scripts

The `claude-team-usage` CLI saves the same URL when it signs in (ADR-060), and
refuses to sign in if the backend reports a localhost URL. The CLI's own default
server is set separately, at publish time, in `tools/claude-team-usage/package.json`
→ `cocDocs.server` (`https://<PUBLIC_DOMAIN>`).

The personalized `push-usage.mjs` a member downloads embeds this deployment's
`/api/ingest` URL, and the **backend** decides it (`PublicIngestUrl`), not the
frontend bundle. Pass the backend container `APP_PUBLIC_URL=https://<PUBLIC_DOMAIN>`
(base URL only, no `/api`). If it is unset, the backend uses the host and
`X-Forwarded-Proto` that nginx forwards, which also comes out as
`https://<PUBLIC_DOMAIN>/api/ingest`. Setting it removes the guesswork. A
malformed value stops the backend from starting. Local development needs
nothing: the URL comes out as `http://localhost:8080/api/ingest`.

## Optional pieces

**AX Renewal analysis is deliberately not one of these.** `Run analysis` uses a
disclosed keyword match here and will keep doing so: it can only reach a real
model on a machine that has Claude Code installed, which this instance does
not and should not. See CONTRIBUTING.md, "Real analysis, on your own machine" — it is a
developer setup step, not a deployment setting.

**Email** (`MAIL_HOST`). Without it, password-reset links are logged at WARN
instead of sent, and registration OTPs cannot be delivered — so password
registration is not really usable until this is set. Google sign-in is
unaffected.

**Push notifications** (`FIREBASE_CREDENTIALS` and the six
`NEXT_PUBLIC_FIREBASE_*`). Without them the backend logs `push not configured`
and starts normally. The bell and the live notification stream (ADR-028) work
regardless — neither needs Firebase, which is the point of them being separate.

Two details that each cost an afternoon when got wrong:

- `FIREBASE_CREDENTIALS` is the downloaded service-account JSON **on one
  line**. The `\n` sequences inside `private_key` are two characters and must
  stay that way — an editor that turns them into real newlines makes the JSON
  invalid, and the backend then refuses to start rather than pretending push is
  merely off.
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY` comes from *Cloud Messaging → Web Push
  certificates*, not from the web-app config block. It is ~87 characters and
  starts with `B`. `measurementId` (`G-…`) is Google Analytics and is not used
  by this application at all.

**Object storage** (`S3_*`). Profile photos (ADR-026) and content-image uploads
need it; both are simply unavailable without it and nothing else is affected.
Either run MinIO here:

```bash
# invent S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in .env, then
docker compose --profile storage up -d
# and set S3_ENDPOINT=http://minio:9000
```

or point at real S3 with `S3_ENDPOINT=https://s3.<region>.amazonaws.com`. The
application uses nothing but the S3 API and path-style addressing
(`CONST-TECH-08`), so moving between them is `.env` and nothing else.

## Connecting a database tool

Two ways, and the difference is where the access control lives.

### Direct — host, port, database, user, password

Set in `.env`:

```
DB_BIND_ADDRESS=0.0.0.0
```

then `docker compose up -d postgres`. The tool needs nothing but:

| | |
|---|---|
| Host | the instance's public IP |
| Port | `5432` |
| Database | `DB_NAME` |
| User / password | `DB_USER` / `DB_PASSWORD` |

**This only makes sense with a security group rule for 5432 from specific
addresses** — EC2 → Security groups → Inbound → Add rule → PostgreSQL → Source
**My IP**. The group is enforced on the network interface, outside the
instance, so it is a real boundary.

What you are accepting: anyone reaching that address reaches Postgres, with the
password as the only remaining barrier. Your IP changing (most home and office
connections) means editing the rule. Opening it to `0.0.0.0/0` puts the database
on the internet, and that is how deployments like this are lost.

### Tunnelled — nothing exposed

Leave `DB_BIND_ADDRESS=127.0.0.1` (the default) and reach it over the SSH access
you already have:

```bash
ssh -N -L 5433:localhost:5432 cocdocs@<instance-ip>
```

Then connect to `localhost:5433` with the same database, user and password.
DataGrip, IntelliJ and DBeaver can open the tunnel themselves — data source →
SSH/SSL tab → *Use SSH tunnel* — so after one-time setup it is the same single
click as the direct option, with nothing published.

### Neither — just look

```bash
docker compose exec postgres psql -U "$DB_USER" -d "$DB_NAME"
```

Keycloak's database is separate, in the same server:

```bash
docker compose exec postgres psql -U "$DB_USER" -d keycloak
```

## Changing the domain

Five things hold the domain and only one of them is `.env`. Miss one and the
symptom is usually a sign-in that fails much later, looking unrelated.

**1. DNS first.** An A record for the new name pointing at the instance, and
confirm it before touching anything:

```bash
dig +short docs.yourdomain.com      # must print the instance's public IP
```

**2. Google.** Add the new redirect URI to the OAuth client — *APIs & Services
→ Credentials → your client → Authorised redirect URIs*:

```
https://docs.yourdomain.com/auth/realms/docs_platform/broker/google/endpoint
```

Leave the old one until the move is finished; an unused entry harms nothing.

**3. `.env` and a rebuild.**

```bash
nano .env                        # PUBLIC_DOMAIN=docs.yourdomain.com
docker compose up -d --build
```

`--build` is required, not optional: `NEXT_PUBLIC_*` are compiled into the
browser bundle, so the frontend still points at the old domain otherwise — and
it will look like it worked.

**4. Keycloak's realm.** It was imported with the old domain in its redirect
URIs and web origins, and `--import-realm` never overwrites an existing realm.
Two ways:

*Let it re-import* — the entrypoint substitutes the new domain automatically:

```bash
# admin console → realm docs_platform → Realm settings → Action → Delete
docker compose restart keycloak
```

Safe: this realm holds only the client and the Google identity provider.
Accounts live in the application's own `account` table, and a brokered Keycloak
user is recreated on the next sign-in.

*Or edit it* — admin console → realm `docs_platform` → Clients →
`cocdocs-frontend` → *Valid redirect URIs* and *Web origins*.

**5. The certificate.** certbot requests one for the new name on its next run:

```bash
docker compose logs -f certbot
```

A new domain has its own rate-limit quota, so a fresh name is never blocked by
attempts against the old one.

Then confirm what is actually being served, rather than trusting the browser:

```bash
echo | openssl s_client -connect localhost:443 -servername docs.yourdomain.com 2>/dev/null \
  | openssl x509 -noout -issuer -dates
```

`issuer=C=US, O=Let's Encrypt` is the answer you want. Anything naming the
domain itself is the self-signed placeholder, which means certbot has not
succeeded yet.

### A note on free subdomains

`sslip.io`, `nip.io` and DuckDNS all sit in the **Dynamic DNS** category, which
corporate and ISP web filters block by default — the category is heavily used
for malware command-and-control, so it is blocked wholesale rather than by
reputation. The symptom is a "Web Page Blocked" page from the filter, with TLS
intercepted so the browser also says "Not secure". Nothing is wrong with the
deployment, and no certificate fixes it.

They are fine for a first deploy from an unfiltered network. A purchased domain
is what makes the site reachable from an office.

## Operating it

```bash
docker compose ps                     # what is running
docker compose logs -f backend        # follow one service
docker compose up -d --build          # deploy a new commit
docker compose down                   # stop, keeping the volumes
```

**Updating.**

```bash
git pull && docker compose up -d --build
```

Flyway applies new migrations on start. The backend refuses to start rather
than run against a schema it does not recognise — which is the behaviour you
want, and means a failed deploy leaves the database untouched.

**Backups.** The only irreplaceable thing here is the `postgres_data` volume:
accounts, sessions, content and the audit trail.

```bash
docker compose exec -T postgres pg_dumpall -U "$DB_USER" | gzip > backup-$(date +%F).sql.gz
```

Run it on a schedule and copy the result off the instance. A backup that only
exists on the machine it protects is not a backup. `certbot_certs` is worth
keeping too — losing it means re-issuing certificates, and Let's Encrypt allows
five per domain per week.

## When it does not work

**certbot never gets a certificate.** The DNS A record does not resolve to this
instance yet, or port 80 is closed. It retries every 12 hours and logs the
reason — `docker compose logs certbot` names which. Meanwhile nginx serves the
self-signed placeholder, so the site works with a browser warning rather than
not at all.

While you are getting DNS and the security group right, set `CERTBOT_STAGING=1`
in `.env`. Let's Encrypt allows **five failed attempts per domain per week**
against production and then locks you out; staging has no meaningful limit. Set
it back to `0` and restart certbot once a staging certificate is issued.

**Google sign-in fails with `redirect_uri_mismatch`.** The redirect URI above
is not on the OAuth client. Google's error names what it expected.

**Google sign-in fails with `invalid_client`.** `GOOGLE_CLIENT_SECRET` is wrong
or was blank when the realm was imported. The realm imports **once**; changing
`.env` afterwards does not revisit it. Delete the realm in the Keycloak console
and restart Keycloak, or fix it in the console directly.

**"You are already authenticated as different user."** A leftover Keycloak
session. The application ends its own on sign-in and sign-out, but a session
predating that fix will still be there. Visit
`https://<PUBLIC_DOMAIN>/auth/realms/docs_platform/protocol/openid-connect/logout`.

**The backend will not start, `Migrations have failed validation`.** A schema
that ran a different file at some version. On a fresh deployment this should
not happen; if it does, it means the volume outlived a branch. `CONTRIBUTING.md`
has the full decision tree — and on production the answer is never
`db-reset-dev.sh`.

**Notifications arrive a minute late rather than instantly.** Something is
buffering the event stream. `nginx/templates/default.conf.template` sets
`proxy_buffering off`, `gzip off` and a long `proxy_read_timeout` on `/api/`
for exactly this; if you have put anything else in front (an ALB, CloudFront),
check it too. The sixty-second poll is the floor underneath, which is why this
degrades rather than breaks.

**The JVM is killed during startup.** Not enough memory — see the instance
sizing above. `dmesg | grep -i oom` confirms it.

## What this commits you to

Worth being explicit, because a deployment is easy to grow into and hard to
grow out of.

- **One instance is a single point of failure.** No redundancy, and updates are
  a short outage while containers restart. Fine for an internal documentation
  platform; not fine if that changes.
- **The notification stream assumes one backend.** Connections are held in
  memory (ADR-028), so a second instance would leave a tab connected to A
  hearing nothing raised on B. That follow-up is recorded in ADR-028 and this
  deployment is the assumption it names.
- **`.env` is the secret store.** It holds the database password, the Google
  client secret and the Firebase service account in plain text on the instance.
  That is proportionate here and would not be at more instances or more people
  — AWS Secrets Manager is the next step, not an immediate one.
- **Backups are manual until you schedule them.** Nothing above does it for you.
- **MinIO on the same instance shares its disk and its fate.** Real S3 is a
  one-line change when that matters.

## Still owed

An ADR recording this decision. ADR-012 §2 left the hosting target
`[DEFERRED]`, and the requirements carry `CONST-TECH-08` (S3 API only) because
of it — choosing EC2, single-instance and Postgres-in-a-container is exactly
the kind of decision the process says gets written down. The constraints above
are its Consequences section in draft.
