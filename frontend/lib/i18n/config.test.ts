import { describe, expect, it } from "vitest";
import { localizePath, splitLocale, stripLocale } from "./config";

describe("splitLocale", () => {
  it("reads km and kr prefixes, mapping kr to ko", () => {
    expect(splitLocale("/km/docs/a")).toEqual({ locale: "km", prefix: "km", pathname: "/docs/a" });
    expect(splitLocale("/kr")).toEqual({ locale: "ko", prefix: "kr", pathname: "/" });
  });

  it("recognises the default spelled out", () => {
    expect(splitLocale("/en/home")).toEqual({ locale: "en", prefix: "en", pathname: "/home" });
  });

  it("leaves an unprefixed path alone, including one that merely starts with a prefix", () => {
    expect(splitLocale("/home")).toEqual({ locale: null, prefix: null, pathname: "/home" });
    expect(splitLocale("/kmart")).toEqual({ locale: null, prefix: null, pathname: "/kmart" });
    expect(splitLocale("/ko/home").locale).toBeNull();
  });
});

describe("localizePath", () => {
  it("adds the locale's prefix, and none for English", () => {
    expect(localizePath("/home", "km")).toBe("/km/home");
    expect(localizePath("/home", "ko")).toBe("/kr/home");
    expect(localizePath("/home", "en")).toBe("/home");
  });

  it("maps the site root to the bare prefix", () => {
    expect(localizePath("/", "km")).toBe("/km");
    expect(localizePath("/km", "en")).toBe("/");
  });

  it("re-points an already-prefixed path instead of stacking prefixes", () => {
    expect(localizePath("/km/docs/a", "ko")).toBe("/kr/docs/a");
  });

  it("keeps the query and fragment", () => {
    expect(localizePath("/docs/a?x=1#top", "km")).toBe("/km/docs/a?x=1#top");
  });

  it("leaves anything that is not an in-app path unchanged", () => {
    for (const href of ["https://example.com/a", "//cdn.example.com/a", "mailto:a@b.c", "#top", "?q=1"]) {
      expect(localizePath(href, "km")).toBe(href);
    }
  });
});

describe("stripLocale", () => {
  it("removes a prefix and nothing else", () => {
    expect(stripLocale("/kr/store/app-3")).toBe("/store/app-3");
    expect(stripLocale("/store")).toBe("/store");
  });
});
