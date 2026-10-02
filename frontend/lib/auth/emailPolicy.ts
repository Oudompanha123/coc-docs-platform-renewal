/**
 * What counts as a usable email address (ADR-088).
 *
 * <p><b>Advisory only.</b> This mirrors
 * {@code backend/src/main/java/com/coc/docs/auth/EmailPolicy.java}, which is
 * the copy a write has to pass (CONST-TECH-07). Its job is to say what is
 * wrong while somebody types; it decides nothing, and no write path may rely
 * on it having run.
 *
 * <p>Stricter than the browser's own `type="email"`, which accepts `qqq@qqq` —
 * no dot, no top-level domain, nowhere to deliver a registration code. That is
 * also what the backend's previous `@Email` allowed, and the reason both were
 * replaced.
 *
 * <p>Deliberately not stricter than that: plus-addressing, dots, hyphens and
 * long top-level domains all pass, because the expensive failure is rejecting
 * somebody's real address — they cannot argue with a form, and have no way to
 * find out which character it objected to.
 *
 * <p>Matching case lists in both test suites fail if a rule changes on one side
 * only.
 *
 * // req: NFR-SEC-AUTH, FR-AUTH-002, CONST-TECH-07, ADR-088
 */

/** RFC 5321 §4.5.3.1.1 */
export const MAX_LOCAL_LENGTH = 64;

/** RFC 5321 §4.5.3.1.3, leaving 254 for the address itself */
export const MAX_LENGTH = 254;

const ATOM = "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+";
const LOCAL = new RegExp(`^${ATOM}(?:\\.${ATOM})*$`);

/**
 * Labels that start and end alphanumerically, and a final label of at least two
 * letters — which is what rejects `qqq@qqq`, `name@localhost` and
 * `name@192.168.1.1`.
 */
const DOMAIN = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

/**
 * Every rule this address breaks.
 *
 * Each message names the specific thing that is wrong: "invalid email" tells
 * somebody staring at an address that looks right to them nothing about where
 * to look.
 */
export function emailViolations(email: string): string[] {
  const problems: string[] = [];
  if (!email || email.trim() === "") {
    problems.push("Enter an email address.");
    return problems;
  }

  const value = email.trim();
  if (value !== email) problems.push("Remove the spaces around the address.");
  if (value.includes(" ")) problems.push("An email address cannot contain a space.");

  const at = value.lastIndexOf("@");
  if (at < 0) {
    problems.push("Include an @, as in name@example.com.");
    return problems;
  }
  if (value.indexOf("@") !== at) {
    problems.push("An email address can only contain one @.");
    return problems;
  }

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);

  if (local === "") problems.push("Add the part before the @, as in name@example.com.");
  else if (local.length > MAX_LOCAL_LENGTH) problems.push("The part before the @ is too long.");
  else if (!LOCAL.test(local)) problems.push("The part before the @ contains something that is not allowed.");

  if (domain === "") problems.push("Add the part after the @, as in name@example.com.");
  // The common real mistake, and the one the browser's own validation allows.
  else if (!domain.includes(".")) problems.push("Add a domain ending, such as .com.");
  else if (!DOMAIN.test(domain)) problems.push("The part after the @ is not a valid domain.");

  if (value.length > MAX_LENGTH) problems.push("That email address is too long.");
  return problems;
}

export function isEmailAcceptable(email: string): boolean {
  return emailViolations(email).length === 0;
}

/** One line for a field error, when there is no room for a list. */
export function firstEmailViolation(email: string): string | undefined {
  return emailViolations(email)[0];
}
