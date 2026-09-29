import { describe, expect, it } from "vitest";
import { buildPersonalizedScript, personalizedScriptFileName, pointsAtLoopbackFromRemotePage } from "./reporterConfig";

const LOCAL_URL = "http://localhost:8080/api/ingest";
const PROD_URL = "https://docs.example.com/api/ingest";

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
    const script = buildPersonalizedScript(TEMPLATE, "dana@example.com", "Dana Lee", "coc_abc123", LOCAL_URL);

    expect(script).toContain(
      'const EMBEDDED_CONFIG = {"USER_EMAIL":"dana@example.com","USER_NAME":"Dana Lee",' +
        '"INGEST_URL":"http://localhost:8080/api/ingest","INGEST_SECRET":"coc_abc123"};',
    );
    expect(script).not.toContain("const EMBEDDED_CONFIG = null;");
  });

  it("never invents a secret of its own -- INGEST_SECRET is exactly the token passed in", () => {
    const script = buildPersonalizedScript(TEMPLATE, "a@example.com", "A", "coc_xyz", LOCAL_URL);
    expect(script).toContain('"INGEST_SECRET":"coc_xyz"');
  });

  it("leaves the rest of the template untouched", () => {
    const script = buildPersonalizedScript(TEMPLATE, "a@example.com", "A", "coc_xyz", LOCAL_URL);
    expect(script).toContain("#!/usr/bin/env node");
    expect(script).toContain("function loadConfig() {}");
  });

  it("escapes a display name that would otherwise break out of the embedded object literal", () => {
    const script = buildPersonalizedScript(TEMPLATE, "a@example.com", 'Weird "Name" \\ here', "coc_xyz", LOCAL_URL);
    // Valid JS: parsing the embedded literal back out must recover the exact name.
    const match = script.match(/const EMBEDDED_CONFIG = (\{.*\});/);
    expect(match).not.toBeNull();
    expect(JSON.parse(match![1]!).USER_NAME).toBe('Weird "Name" \\ here');
  });

  it("throws rather than silently download an unpersonalized script if the template's shape changed", () => {
    expect(() => buildPersonalizedScript("no marker here", "a@example.com", "A", "coc_xyz", LOCAL_URL)).toThrow(
      /changed shape/,
    );
  });

  it("throws rather than embed a blank email — never silently ships a script with no USER_EMAIL", () => {
    expect(() => buildPersonalizedScript(TEMPLATE, "", "A", "coc_xyz", LOCAL_URL)).toThrow(/could not personalize/);
  });

  it("throws rather than embed a blank token", () => {
    expect(() => buildPersonalizedScript(TEMPLATE, "a@example.com", "A", "", LOCAL_URL)).toThrow(/could not personalize/);
  });

  it("verifies the embed actually round-trips to the given email, not just that the marker line changed", () => {
    // A template where the marker text appears twice would `.replace()` only
    // the first occurrence, silently leaving a second `null` sitting right
    // next to a real config — this guard is what catches that shape of bug.
    const doubled = TEMPLATE + "\nconst EMBEDDED_CONFIG = null;";
    expect(() => buildPersonalizedScript(doubled, "a@example.com", "A", "coc_xyz", LOCAL_URL)).toThrow(
      /couldn't verify your email/i,
    );
  });

  it("embeds exactly the ingest URL the backend returned — production downloads carry the production URL", () => {
    const script = buildPersonalizedScript(TEMPLATE, "a@example.com", "A", "coc_xyz", PROD_URL);
    expect(script).toContain('"INGEST_URL":"https://docs.example.com/api/ingest"');
    expect(script).not.toContain("localhost");
  });

  it("throws rather than embed a missing or malformed ingest URL (e.g. an older backend that doesn't send one)", () => {
    expect(() => buildPersonalizedScript(TEMPLATE, "a@example.com", "A", "coc_xyz", "")).toThrow(/ingest URL/);
    expect(() => buildPersonalizedScript(TEMPLATE, "a@example.com", "A", "coc_xyz", "localhost:8080")).toThrow(
      /ingest URL/,
    );
  });
});

describe("pointsAtLoopbackFromRemotePage", () => {
  it("flags a localhost ingest URL handed out by a production page", () => {
    expect(pointsAtLoopbackFromRemotePage(LOCAL_URL, "docs.example.com")).toBe(true);
    expect(pointsAtLoopbackFromRemotePage("http://127.0.0.1:8080/api/ingest", "docs.example.com")).toBe(true);
  });

  it("does not flag local development or a real production URL", () => {
    expect(pointsAtLoopbackFromRemotePage(LOCAL_URL, "localhost")).toBe(false);
    expect(pointsAtLoopbackFromRemotePage(PROD_URL, "docs.example.com")).toBe(false);
  });
});
