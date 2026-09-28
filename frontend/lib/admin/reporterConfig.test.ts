import { describe, expect, it } from "vitest";
import { buildPersonalizedScript, personalizedScriptFileName } from "./reporterConfig";

const TEMPLATE = [
  "#!/usr/bin/env node",
  "// ...",
  "const EMBEDDED_CONFIG = null;",
  "",
  "function loadConfig() {}",
].join("\n");

describe("personalizedScriptFileName", () => {
  it("is the fixed name the setup guide tells people to run", () => {
    expect(personalizedScriptFileName()).toBe("push-usage.mjs");
  });
});

describe("buildPersonalizedScript", () => {
  it("replaces the EMBEDDED_CONFIG marker with the caller's own email/name, ingest URL, and freshly minted token", () => {
    const script = buildPersonalizedScript(TEMPLATE, "dana@example.com", "Dana Lee", "coc_abc123");

    expect(script).toContain(
      'const EMBEDDED_CONFIG = {"USER_EMAIL":"dana@example.com","USER_NAME":"Dana Lee",' +
        '"INGEST_URL":"http://localhost:8080/api/ingest","INGEST_SECRET":"coc_abc123"};',
    );
    expect(script).not.toContain("const EMBEDDED_CONFIG = null;");
  });

  it("never invents a secret of its own -- INGEST_SECRET is exactly the token passed in", () => {
    const script = buildPersonalizedScript(TEMPLATE, "a@example.com", "A", "coc_xyz");
    expect(script).toContain('"INGEST_SECRET":"coc_xyz"');
  });

  it("leaves the rest of the template untouched", () => {
    const script = buildPersonalizedScript(TEMPLATE, "a@example.com", "A", "coc_xyz");
    expect(script).toContain("#!/usr/bin/env node");
    expect(script).toContain("function loadConfig() {}");
  });

  it("escapes a display name that would otherwise break out of the embedded object literal", () => {
    const script = buildPersonalizedScript(TEMPLATE, "a@example.com", 'Weird "Name" \\ here', "coc_xyz");
    // Valid JS: parsing the embedded literal back out must recover the exact name.
    const match = script.match(/const EMBEDDED_CONFIG = (\{.*\});/);
    expect(match).not.toBeNull();
    expect(JSON.parse(match![1]!).USER_NAME).toBe('Weird "Name" \\ here');
  });

  it("throws rather than silently download an unpersonalized script if the template's shape changed", () => {
    expect(() => buildPersonalizedScript("no marker here", "a@example.com", "A", "coc_xyz")).toThrow(
      /changed shape/,
    );
  });

  it("throws rather than embed a blank email — never silently ships a script with no USER_EMAIL", () => {
    expect(() => buildPersonalizedScript(TEMPLATE, "", "A", "coc_xyz")).toThrow(/could not personalize/);
  });

  it("throws rather than embed a blank token", () => {
    expect(() => buildPersonalizedScript(TEMPLATE, "a@example.com", "A", "")).toThrow(/could not personalize/);
  });

  it("verifies the embed actually round-trips to the given email, not just that the marker line changed", () => {
    // A template where the marker text appears twice would `.replace()` only
    // the first occurrence, silently leaving a second `null` sitting right
    // next to a real config — this guard is what catches that shape of bug.
    const doubled = TEMPLATE + "\nconst EMBEDDED_CONFIG = null;";
    expect(() => buildPersonalizedScript(doubled, "a@example.com", "A", "coc_xyz")).toThrow(
      /couldn't verify your email/i,
    );
  });
});
