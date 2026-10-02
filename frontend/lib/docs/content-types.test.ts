import { describe, expect, it } from "vitest";
import { isValidHeroDownloadUrl, resolveHeroDownloadButton } from "./content-types";

describe("isValidHeroDownloadUrl", () => {
  it("accepts an empty string — the field's own \"no button\" state", () => {
    expect(isValidHeroDownloadUrl("")).toBe(true);
  });

  it("accepts a real https:// URL", () => {
    expect(isValidHeroDownloadUrl("https://example.com/app.exe")).toBe(true);
  });

  it("accepts a same-site relative path starting with /", () => {
    expect(isValidHeroDownloadUrl("/downloads/app.dmg")).toBe(true);
  });

  it("rejects plain http://, stricter than the page-body link validator", () => {
    expect(isValidHeroDownloadUrl("http://example.com/app.exe")).toBe(false);
  });

  it("rejects javascript: and data: schemes", () => {
    expect(isValidHeroDownloadUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHeroDownloadUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects a protocol-relative // path, same as a scheme switch", () => {
    expect(isValidHeroDownloadUrl("//evil.example.com/app.exe")).toBe(false);
  });

  it("rejects a malformed https:// URL", () => {
    expect(isValidHeroDownloadUrl("https://")).toBe(false);
  });

  it("rejects plain text with no scheme at all", () => {
    expect(isValidHeroDownloadUrl("example.com/app.exe")).toBe(false);
  });
});

describe("resolveHeroDownloadButton", () => {
  it("resolves an undefined entry to everything blank and hidden", () => {
    expect(resolveHeroDownloadButton("windows", undefined)).toEqual({
      show: false,
      label: "Download for Windows",
      url: "",
      version: "",
      size: "",
    });
  });

  it("legacy shape — a bare URL string — behaves exactly as it always did: shown, default label, no version/size", () => {
    expect(resolveHeroDownloadButton("macos", "https://example.com/app.dmg")).toEqual({
      show: true,
      label: "Download for macOS",
      url: "https://example.com/app.dmg",
      version: "",
      size: "",
    });
  });

  it("an object entry with a URL and no explicit show defaults to shown", () => {
    const resolved = resolveHeroDownloadButton("linux", { url: "/downloads/app.AppImage" });
    expect(resolved.show).toBe(true);
  });

  it("explicit show: false hides the button even though a URL is present, and keeps every other field", () => {
    const resolved = resolveHeroDownloadButton("windows", {
      url: "https://example.com/app.exe",
      label: "Custom label",
      version: "v2.1.0",
      size: "84 MB",
      show: false,
    });
    expect(resolved).toEqual({
      show: false,
      label: "Custom label",
      url: "https://example.com/app.exe",
      version: "v2.1.0",
      size: "84 MB",
    });
  });

  it("explicit show: true with no URL yet still resolves to shown (the hint is the caller's job, not this function's)", () => {
    expect(resolveHeroDownloadButton("windows", { show: true }).show).toBe(true);
  });

  it("a blank label falls back to the OS default rather than rendering empty text", () => {
    expect(resolveHeroDownloadButton("linux", { url: "/app", label: "   " }).label).toBe("Download for Linux");
  });

  it("a real label is kept as-is", () => {
    expect(resolveHeroDownloadButton("windows", { url: "https://example.com/app.exe", label: "Get it now" }).label).toBe(
      "Get it now",
    );
  });

  it("passes version and size through untouched when present", () => {
    const resolved = resolveHeroDownloadButton("macos", {
      url: "https://example.com/app.dmg",
      version: "v2.1.0",
      size: "84 MB",
    });
    expect(resolved.version).toBe("v2.1.0");
    expect(resolved.size).toBe("84 MB");
  });
});
