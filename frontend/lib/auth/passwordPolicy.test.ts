import { describe, expect, it } from "vitest";

import {
  MIN_LENGTH,
  isPasswordAcceptable,
  passwordChecklist,
  passwordViolations,
} from "./passwordPolicy";

/**
 * The cases below are duplicated verbatim in
 * backend/src/test/java/com/coc/docs/auth/PasswordPolicyTest.java.
 *
 * <p>That duplication is the point: this copy of the policy is advisory
 * (CONST-TECH-07) and the Java one decides, so the failure that matters is
 * them disagreeing — a password this accepts and the server refuses looks, to
 * the person typing it, like the form is broken. Keeping one list on each side
 * makes a one-sided change fail here or there rather than in production.
 */
export const ACCEPTED = ["Str0ng!Passphrase", "aA1!aA1!aA1!", "Khmer-ភាសា1A!x", "p@ssW0rd-with-length"];

export const REJECTED: [string, string][] = [
  ["qqq", "far too short"],
  ["", "empty"],
  ["Passw0rd!", "nine characters, still under the floor"],
  ["alllowercase1!", "no uppercase"],
  ["ALLUPPERCASE1!", "no lowercase"],
  ["NoDigitsHere!!", "no number"],
  ["NoSymbolsHere1", "no symbol"],
  ["            ", "whitespace only"],
];

describe("passwordPolicy", () => {
  it.each(ACCEPTED)("accepts %s", (password) => {
    expect(passwordViolations(password)).toEqual([]);
    expect(isPasswordAcceptable(password)).toBe(true);
  });

  it.each(REJECTED)("rejects %s (%s)", (password) => {
    expect(isPasswordAcceptable(password)).toBe(false);
    expect(passwordViolations(password).length).toBeGreaterThan(0);
  });

  it(`requires at least ${MIN_LENGTH} characters`, () => {
    expect(isPasswordAcceptable("aA1!".repeat(2))).toBe(false); // 8
    expect(isPasswordAcceptable("aA1!".repeat(3))).toBe(true); // 12
  });

  /**
   * Reporting one problem at a time is what trains people to append "1!" until
   * the complaining stops.
   */
  it("reports every unmet rule at once, not just the first", () => {
    expect(passwordViolations("qqq")).toEqual([
      "Use at least 12 characters.",
      "Include an uppercase letter.",
      "Include a number.",
      "Include a symbol, such as ! ? @ or #.",
    ]);
  });

  it("says only 'enter a password' for an empty one", () => {
    expect(passwordViolations("")).toEqual(["Enter a password."]);
  });

  /** A symbol is anything that is not a letter, a digit or whitespace. */
  it("counts punctuation from any script as a symbol", () => {
    expect(isPasswordAcceptable("Aa1aaaaaaaaa€")).toBe(true);
    expect(isPasswordAcceptable("Aa1aaaaaaaaa。")).toBe(true);
  });

  it("does not count a space as a symbol", () => {
    expect(passwordViolations("Aa1 aaaaaaaaa")).toContain("Include a symbol, such as ! ? @ or #.");
  });

  describe("checklist", () => {
    it("marks each rule as it is met", () => {
      const checks = passwordChecklist("aA1!aA1!aA1!");
      expect(checks.every((c) => c.met)).toBe(true);
    });

    it("shows what is still missing", () => {
      const unmet = passwordChecklist("qqq")
        .filter((c) => !c.met)
        .map((c) => c.label);
      expect(unmet).toEqual([
        `At least ${MIN_LENGTH} characters`,
        "An uppercase letter",
        "A number",
        "A symbol",
      ]);
    });
  });
});
