# Email delivery

How this platform sends mail, and how to configure Google to carry it.

Everything the backend sends — password resets (ADR-018), account invites
(ADR-020), registration codes (ADR-021) and the content-activity digest —
goes through one Spring `JavaMailSender` bean. That bean **only exists when
`spring.mail.host` is set**. With it unset the application still boots and
serves every route; each mailer logs what it would have sent instead. That is
deliberate (ADR-018 decision 5) and it is why misconfigured mail is silent
rather than loud.

`MailConfigurationReport` prints one line at startup saying which of the two
states you are in. Read it before assuming mail works:

```
MAIL: not configured (spring.mail.host is unset). ... will be LOGGED, not sent.
MAIL: smtp.gmail.com:587, authenticating as a wecambodia.com account, sending as Coc Docs <noreply-docs@wecambodia.com>
```

---

## Which Google route

Three exist. Which one you want depends on whether you mean *send to my users*
or *send as my users*.

| | Use when | Limit |
|---|---|---|
| **1. Gmail SMTP** (`smtp.gmail.com`) | Local development, a demo, an internal tool | ~500 recipients/day personal, ~2,000 Workspace |
| **2. Workspace SMTP relay** (`smtp-relay.gmail.com`) | **This platform, in production** | ~10,000/day |
| **3. Gmail API + domain-wide delegation** | You need mail to appear in each *user's* Sent folder | n/a |

**Route 2 is the one for this project.** The digest is addressed from the
platform to its administrators — nobody is sending *as* anybody — and it needs
a domain address like `noreply-docs@wecambodia.com` rather than a personal
mailbox. That is the same shape as the HRMS mail this digest was modelled on,
which sends as `noreply-hrms@wecambodia.com`: a domain address, not a person's.

Route 3 is overkill here. It needs Workspace admin consent for the
`gmail.send` scope, and nothing this platform sends is *from* an individual.

---

## Route 1 — Gmail SMTP (development)

1. The sending account needs **2-Step Verification on**.
2. Google Account → Security → **App passwords** → generate one. This is not
   the account password, and an account without 2FA has no App passwords menu
   at all.
3. Set the environment variables (never the literal password in YAML).
   `application.yml` already reads all four, so there is nothing to add
   there — this step is the whole of it:

   ```text
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=someone@wecambodia.com
   MAIL_PASSWORD=<the 16-character app password>
   ```

4. Set the From address to that same account. **Note the different shape** —
   this one is a dotted property name, not a SHOUTY_CASE variable:

   ```text
   app.mail.from=Coc Docs Platform <someone@wecambodia.com>
   ```

   It MUST be the authenticated account or one of its verified aliases. See
   "The From address" below — this is the step people skip.

   `APP_MAIL_FROM` works too. The four above are spelled the way the
   `${MAIL_HOST}` references in the yml spell them — an exact, literal match
   that resolves from any property source. `app.mail.from` has no yml reference
   at all, so reaching it from an uppercase name needs Spring to translate
   between the two spellings, which it does only for a
   `SystemEnvironmentPropertySource`.

   `DotenvEnvironmentPostProcessor` registers `backend/.env.local` under a name
   ending in `-systemEnvironment` precisely to earn that translation. Before
   2026-09-17 it did not, and an `APP_MAIL_FROM` line in that file was silently
   never read while the same line exported in a shell worked — so if you are
   reading an older checkout, use the dotted form.

5. Start the backend and read the one line `MailConfigurationReport` logs at
   startup. It reports what actually took effect, which is the point of it:

   ```text
   MAIL: smtp.gmail.com:587, authenticating as a gmail.com account, sending as Coc Docs Platform <someone@gmail.com>
   ```

   `MAIL: not configured` means `MAIL_HOST` never reached the process — the
   usual cause is setting it in one shell and starting the backend in another.

## Route 2 — Workspace SMTP relay (production)

A Workspace admin configures it under **Apps → Google Workspace → Gmail →
Routing → SMTP relay service**, allowlisting the backend's outbound IP. The
application config is the same as above with two changes:

```yaml
spring:
  mail:
    host: smtp-relay.gmail.com
    port: 587
```

The relay may be set to accept from allowlisted IPs *without* SMTP
authentication, in which case leave `username`/`password` unset. It lets you
send as **any address in your domain**, which is what makes
`noreply-docs@wecambodia.com` possible without creating a mailbox for it.

Because hosting for this backend is still `[DEFERRED]` (ADR-012 decision 2),
the outbound IP to allowlist is not known yet. That is the one thing blocking
route 2 today.

---

## The From address

**This is the step that goes wrong.** `app.mail.from` defaults to
`Coc Docs Platform <noreply@cocdocsplatform.com>` — a placeholder domain
nobody owns. Google will not put an arbitrary address in `From`:

- **Gmail** rewrites `From` to the authenticated account unless the address is
  a *verified alias* on it (Settings → Accounts → Send mail as).
- **The Workspace relay** accepts any address in a domain it is authorised
  for, and rejects the rest.

So a deployment that configures SMTP and forgets `app.mail.from` sends mail
signed as a domain it does not control, and any reply goes nowhere.
`MailConfigurationReport` warns at startup when the From domain and the
authenticated account's domain disagree on a Google host — but it can only see
the domain, so a same-domain address that is not actually a verified alias
still gets through the check and is rewritten by Google.

---

## Deliverability

Sending from a domain you control is necessary but not sufficient — without
DNS records the mail lands in spam:

- **SPF** — authorise Google to send for the domain: `v=spf1
  include:_spf.google.com ~all`
- **DKIM** — generate in the Workspace admin console (Apps → Gmail →
  Authenticate email) and publish the key it gives you.
- **DMARC** — start at `p=none` with a reporting address, read the reports for
  a couple of weeks, then tighten.

Publish all three before the first real send. Reputation is easier to build
than to repair.

---

## When Google stops being the right answer

Google's daily caps are **hard caps**, and they count recipients, not
messages. The activity digest is Bcc'd to the admin group, so today it costs
one message and a handful of recipients per day — nowhere near any limit.

That changes if digests are ever sent per-user rather than per-admin group.
At that point a transactional provider — Resend, SendGrid, SES, Mailgun —
is the right move: they are built for this, they report bounces and
complaints, and they do not share a quota with anybody's inbox. Nothing in
this codebase would need to change but `spring.mail.*`; the mailers only know
about `JavaMailSender` (CONST-TECH-08 portability).

---

## Who receives the digest

`ActivityDigestService.resolveRecipients()` answers this in two steps:

1. `app.notifications.recipients`, if anything is configured there.
2. Otherwise **every active `admin` and `super_admin`** in the `account`
   table, resolved per send — so an administrator added next month is
   included without a config change. This is the intended default.

To override it — a developer who wants the digest in their own inbox, a
deployment mailing a shared address — set the variable, comma-separated for
more than one:

```text
app.notifications.recipients=someone@gmail.com,ops@wecambodia.com
```

`APP_NOTIFICATIONS_RECIPIENTS` works equally — see the note on spellings in
route 1. It replaces the admin list rather than adding to it: nobody else
receives the digest while it is set.

Recipients go in **Bcc**, with the `From` address as the visible `To` — see
the class comment on `NotificationMailService`. So a digest that arrives
looks addressed to the platform itself, not to you, and that is correct.

---

## Checking it works

1. Restart the backend and read the `MAIL:` line.
2. From Settings → Team notifications (super_admin only), send the digest for a
   day you know had activity.
3. The response says what happened: `sent`, or which of the three
   "not sent" cases applies — `no page activity on this day`,
   `no recipients`, or `not delivered`.
4. `not delivered` after a `MAIL:` line that looked fine means Google refused
   it. The reason is in the server log at ERROR, from
   `NotificationMailService`.
