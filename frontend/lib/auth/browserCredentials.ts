/**
 * The browser's own saved-password support for the login form.
 *
 * Signing in posts with `fetch`, not a full form submission, so a browser has
 * to guess when a login succeeded before it offers to save the password. On
 * browsers with the Credential Management API (Chromium-based: Chrome, Edge),
 * this tells it directly, after a sign-in the backend accepted — the browser
 * still asks the person before saving anything, and respects "never for this
 * site". Elsewhere (Firefox, Safari) it does nothing, and those browsers rely
 * on the form's standard `name`/`autocomplete` attributes and on the form
 * leaving the page once signed in, as they always have.
 *
 * Never throws: saving a password is a convenience, and failing to offer it
 * must not get in the way of a sign-in that already worked.
 */
export async function offerToSaveCredential(id: string, password: string, name?: string): Promise<void> {
  if (typeof window === "undefined" || !id || !password) return;
  const PasswordCredentialCtor = (window as unknown as { PasswordCredential?: new (data: PasswordCredentialData) => Credential })
    .PasswordCredential;
  if (!PasswordCredentialCtor || typeof navigator.credentials?.store !== "function") return;
  try {
    await navigator.credentials.store(new PasswordCredentialCtor({ id, password, name: name || id }));
  } catch {
    // Declined, unsupported in this context, or blocked by policy — fine.
  }
}

/** A `PasswordCredential`'s init data — declared here so this compiles where the DOM lib lacks the type. */
type PasswordCredentialData = { id: string; password: string; name?: string };

/**
 * What the browser autofilled into the login form, read from the form itself.
 *
 * A browser can show saved credentials in the fields before it has fired the
 * input events React listens for (Chrome holds them back until the person
 * interacts with the page), so the form's state can still be empty at submit
 * time while the fields plainly are not. Read by field name.
 */
export function readFilledCredentials(form: HTMLFormElement): { username: string; password: string } {
  const data = new FormData(form);
  const value = (key: string) => {
    const v = data.get(key);
    return typeof v === "string" ? v : "";
  };
  return { username: value("username"), password: value("password") };
}
