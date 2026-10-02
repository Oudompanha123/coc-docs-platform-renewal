/**
 * What counts as an acceptable password (ADR-087).
 *
 * <p><b>Advisory only.</b> This mirrors
 * {@code backend/src/main/java/com/coc/docs/auth/PasswordPolicy.java}, which is
 * the copy a write has to pass (CONST-TECH-07). Its job is to tell somebody
 * what is wrong while they type, not to decide anything — every rule here is
 * enforced again server-side, and no write path may rely on this having run.
 *
 * <p>Length only, no composition rules: NIST SP 800-63B §5.1.1.2 sets eight as
 * the floor for a user-chosen secret and says verifiers SHOULD NOT require
 * particular character classes. This briefly required twelve and four classes
 * (ADR-087 v1.0) and was reverted to the standard's shape.
 *
 * <p>The two copies are kept in step by matching case lists in both test
 * suites. Change a rule here and the Java copy must change with it, or those
 * tests fail.
 *
 * // req: NFR-SEC-AUTH, FR-AUTH-002, CONST-TECH-07, ADR-087
 */

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 200;

/**
 * Every rule this password breaks.
 *
 * A list rather than a boolean because the backend returns the same strings,
 * and because a form that reveals one requirement at a time teaches people to
 * append characters until the complaining stops.
 */
export function passwordViolations(password: string): string[] {
  const problems: string[] = [];
  if (!password) {
    problems.push("Enter a password.");
    return problems;
  }
  if (password.length < MIN_LENGTH) problems.push(`Use at least ${MIN_LENGTH} characters.`);
  if (password.length > MAX_LENGTH) problems.push(`Use at most ${MAX_LENGTH} characters.`);
  return problems;
}

export function isPasswordAcceptable(password: string): boolean {
  return passwordViolations(password).length === 0;
}

/** One line for a field error, when there is no room for a list. */
export function firstPasswordViolation(password: string): string | undefined {
  return passwordViolations(password)[0];
}
