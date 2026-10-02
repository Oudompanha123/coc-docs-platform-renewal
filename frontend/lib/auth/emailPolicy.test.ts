import { describe, expect, it } from "vitest";

import { emailViolations, isEmailAcceptable } from "./emailPolicy";

/**
 * The cases below are duplicated verbatim in
 * backend/src/test/java/com/coc/docs/auth/EmailPolicyTest.java.
 *
 * <p>That duplication is the point: this copy is advisory (CONST-TECH-07) and
 * the Java one decides, so the failure worth catching is them disagreeing — an
 * address the form accepts and the server refuses looks, to the person typing
 * it, like the form is broken.
 */
export const ACCEPTED = [
  "person@example.com",
  "first.last@example.co.uk",
  "a+tag@example.com",
  "a_b-c@sub.domain.example.org",
  "x@e.io",
  "UPPER@EXAMPLE.COM",
];

export const REJECTED: [string, string][] = [
  ["qqq", "no @ at all"],
  ["qqq@qqq", "no top-level domain — what the browser and @Email both allow"],
  ["", "empty"],
  ["@example.com", "nothing before the @"],
  ["person@", "nothing after the @"],
  ["a@b@example.com", "two @"],
  ["person @example.com", "a space"],
  ["person@localhost", "no dot in the domain"],
  ["person@192.168.1.1", "an IP literal, never what a person meant to type"],
  ["person@example..com", "an empty domain label"],
  ["person@-example.com", "a label starting with a hyphen"],
  ["person@example.c", "a one-letter top-level domain"],
];

describe("emailPolicy", () => {
  it.each(ACCEPTED)("accepts %s", (email) => {
    expect(emailViolations(email)).toEqual([]);
    expect(isEmailAcceptable(email)).toBe(true);
  });

  it.each(REJECTED)("rejects %s (%s)", (email) => {
    expect(isEmailAcceptable(email)).toBe(false);
    expect(emailViolations(email).length).toBeGreaterThan(0);
  });

  /** The case from the bug report, and the whole reason this policy exists. */
  it("rejects the address the browser's own validation would allow", () => {
    expect(emailViolations("qqq@qqq")).toEqual(["Add a domain ending, such as .com."]);
  });

  it("names the specific problem rather than saying 'invalid'", () => {
    expect(emailViolations("qqq")).toEqual(["Include an @, as in name@example.com."]);
    expect(emailViolations("@example.com")).toEqual(["Add the part before the @, as in name@example.com."]);
    expect(emailViolations("a@b@example.com")).toEqual(["An email address can only contain one @."]);
  });

  it("says only 'enter an email address' for an empty one", () => {
    expect(emailViolations("")).toEqual(["Enter an email address."]);
    expect(emailViolations("   ")).toEqual(["Enter an email address."]);
  });

  /**
   * The expensive failure is rejecting a real address: somebody cannot argue
   * with a form, and has no way to find out which character it objected to.
   */
  it("accepts the shapes people actually use", () => {
    expect(isEmailAcceptable("oudompanha456@gmail.com")).toBe(true);
    expect(isEmailAcceptable("noreply-hrms@wecambodia.com")).toBe(true);
    expect(isEmailAcceptable("neo.chanthy8888@gmail.com")).toBe(true);
  });

  it("enforces the RFC length limits", () => {
    expect(isEmailAcceptable(`${"a".repeat(64)}@example.com`)).toBe(true);
    expect(isEmailAcceptable(`${"a".repeat(65)}@example.com`)).toBe(false);
  });

  it("complains about surrounding spaces rather than silently trimming them", () => {
    expect(emailViolations(" person@example.com ")).toContain("Remove the spaces around the address.");
  });
});
