/**
 * What counts as a strong enough password (ADR-087).
 *
 * <p><b>Advisory only.</b> This mirrors
 * {@code backend/src/main/java/com/coc/docs/auth/PasswordPolicy.java}, which
 * is the copy a write has to pass (CONST-TECH-07). Its job is to tell somebody
 * what is wrong while they type, not to decide anything — every rule here is
 * enforced again server-side, and no write path may rely on this having run.
 *
 * <p>The two are kept in step by a parity test on each side built from the same
 * cases. Change a rule here and the Java copy must change with it, or that test
 * fails.
 *
 * // req: NFR-SEC-AUTH, FR-AUTH-002, CONST-TECH-07, ADR-087
 */

export const MIN_LENGTH = 12;
export const MAX_LENGTH = 200;

/**
 * Every rule this password breaks, in the order a person should fix them.
 *
 * All of them, not the first: revealing one requirement at a time turns
 * choosing a password into a guessing game, and people answer it by appending
 * `1!` until the complaining stops.
 */
export function passwordViolations(password: string): string[] {
  const problems: string[] = [];
  if (!password) {
    problems.push("Enter a password.");
    return problems;
  }
  if (password.length < MIN_LENGTH) problems.push(`Use at least ${MIN_LENGTH} characters.`);
  if (password.length > MAX_LENGTH) problems.push(`Use at most ${MAX_LENGTH} characters.`);
  if (!/\p{Ll}/u.test(password)) problems.push("Include a lowercase letter.");
  if (!/\p{Lu}/u.test(password)) problems.push("Include an uppercase letter.");
  if (!/\p{Nd}/u.test(password)) problems.push("Include a number.");
  // By exclusion, like the Java copy: anything that is not a letter, a digit
  // or whitespace. An allow-list of punctuation would quietly reject somebody
  // whose keyboard produces a different dash, with no way to know why.
  if (!/[^\p{L}\p{N}\s]/u.test(password)) problems.push("Include a symbol, such as ! ? @ or #.");
  return problems;
}

export function isPasswordAcceptable(password: string): boolean {
  return passwordViolations(password).length === 0;
}

/** One line for a field error, when there is no room for a list. */
export function firstPasswordViolation(password: string): string | undefined {
  return passwordViolations(password)[0];
}

/**
 * The requirements as a checklist, each with whether it is met yet.
 *
 * <p>For showing all of them at once while someone types. Seeing the whole
 * list from the start is what stops the append-`1!` loop — it is the same
 * reason {@link passwordViolations} returns every problem rather than one.
 */
export function passwordChecklist(password: string): { label: string; met: boolean }[] {
  return [
    { label: `At least ${MIN_LENGTH} characters`, met: password.length >= MIN_LENGTH },
    { label: "A lowercase letter", met: /\p{Ll}/u.test(password) },
    { label: "An uppercase letter", met: /\p{Lu}/u.test(password) },
    { label: "A number", met: /\p{Nd}/u.test(password) },
    { label: "A symbol", met: /[^\p{L}\p{N}\s]/u.test(password) },
  ];
}
