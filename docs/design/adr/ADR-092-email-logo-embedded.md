# ADR-092: The Email Logo Travels Inside the Email

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-05
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("please check why logo is not show? on Your Account Has Been Created") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: [ADR-018](ADR-018-revision-of-014-password-reset.md) (password reset) and [ADR-021](ADR-021-revision-of-014-registration-email-otp.md) (registration code), whose emails share `EmailLayout` with the account invite.

---

## 1. Context

The account invite ("Your Account Has Been Created"), password-reset and registration-code emails share `EmailLayout`. Its logo was a remote image, `<img src="{app.frontend-origin}/logo-coc-docs-platform.png">`.

Gmail never loads a remote email image itself. It fetches every image through Google's own proxy, which cannot reach `http://localhost:3000`. In development, every one of these emails showed a broken image with the alt text "Coc Docs Platform". The class's own Javadoc acknowledged that the logo "only renders where `app.frontend-origin` is reachable from the recipient's mail client". It also depended on the recipient allowing remote images at all.

## 2. Decision

> Embed the logo in the message as an inline image (`Content-ID`), and point the `<img>` at `cid:coc-docs-platform-logo`.

- **The image:** a 2x copy sized for email (336×161, 32 KB, against the frontend's 660×316, 107 KB original) ships in the backend at `src/main/resources/mail/logo-coc-docs-platform.png`.
- **`EmailLayout`:**
  - `page` renders `src="cid:coc-docs-platform-logo"`, keeping the 168×80 display size and the alt text;
  - the link around the logo still goes to the frontend origin;
  - `EmailLayout.embedLogo(helper)` attaches the image `inline`, as `image/png`.
- **The three mailers** (`AccountInviteMailer`, `PasswordResetMailer`, `RegistrationOtpMailer`) call `embedLogo` right after `setText`. All three already built multipart messages, which an inline part requires.

## 3. Consequences

- **Positive:** the logo shows in Gmail, Outlook and other clients wherever the site runs, localhost included, and without the recipient having to allow remote images.
- **Accepted:**
  - Each email carries 32 KB more.
  - The email logo is a copy of the frontend's. If the brand mark changes, `mail/logo-coc-docs-platform.png` must be regenerated too. `EmailLayoutTest` checks that the copy exists and is a PNG; it doesn't compare it with the frontend's.

## 4. Verification

| Item | Method |
|---|---|
| The page points at `cid:`, never at the origin or a relative path; size and alt are kept; the link still goes to the origin | `EmailLayoutTest.logoIsEmbeddedNotLinked` |
| `embedLogo` attaches an inline `image/png` part under that Content-ID, with real PNG bytes from the jar | `EmailLayoutTest.embedLogoAttachesTheInlineImage` |
| The invite email, with `http://localhost:3000` as origin, carries the embedded logo and no localhost image URL | `AccountInviteMailerTest` |
| The registration-code email carries it too | `RegistrationOtpMailerTest.theLogoIsEmbedded` |
| No Maven resource filtering touches the PNG; the built copy is byte-identical | `cmp` of source vs `target/classes` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-05 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-05 | User (in-session, direct instruction) | Logo missing in the account-created email | ACCEPTED |
