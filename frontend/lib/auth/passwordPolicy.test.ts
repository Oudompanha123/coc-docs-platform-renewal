import { describe, expect, it } from "vitest";

import { MIN_LENGTH, isPasswordAcceptable, passwordViolations } from "./passwordPolicy";

/**
 * The cases below are duplicated verbatim in
 * backend/src/test/java/com/coc/docs/auth/PasswordPolicyTest.java.
 *
 * <p>That duplication is the point: this copy of the policy is advisory
 * (CONST-TECH-07) and the Java one decides, so the failure that matters is
 * them disagreeing — a password this accepts and the server refuses looks, to
 * the person typing it, like the form is broken. One list on each side makes a
 * one-sided change fail here or there rather than in production.
 */
export const ACCEPTED = ["hunter22", "Str0ng!Passphrase", "        a", "ភាសាខ្មែរabc"];

export const REJECTED: [string, string][] = [
  ["qqq", "too short"],
  ["", "empty"],
  ["qqq111", "six characters"],
  ["1234567", "seven characters"],
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

  it(`requires at least ${MIN_LENGTH} characters, and no more`, () => {
    expect(isPasswordAcceptable("a".repeat(MIN_LENGTH - 1))).toBe(false);
    expect(isPasswordAcceptable("a".repeat(MIN_LENGTH))).toBe(true);
  });

  /**
   * Deliberately no composition rules (ADR-087 v1.1, NIST SP 800-63B). These
   * pin that, so reintroducing one is a visible decision rather than a quiet
   * tightening that starts rejecting passwords people already use.
   */
  it("does not require any particular character class", () => {
    expect(isPasswordAcceptable("alllowercase")).toBe(true);
    expect(isPasswordAcceptable("ALLUPPERCASE")).toBe(true);
    expect(isPasswordAcceptable("123456789")).toBe(true);
    expect(isPasswordAcceptable("!!!!!!!!!")).toBe(true);
  });

  it("reports the length rule by name", () => {
    expect(passwordViolations("qqq")).toEqual(["Use at least 8 characters."]);
  });

  it("says only 'enter a password' for an empty one", () => {
    expect(passwordViolations("")).toEqual(["Enter a password."]);
  });

  it("rejects a password past the bcrypt-shaped ceiling", () => {
    expect(isPasswordAcceptable("a".repeat(201))).toBe(false);
    expect(isPasswordAcceptable("a".repeat(200))).toBe(true);
  });
});
