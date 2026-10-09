import { describe, expect, it } from "vitest";
import { bannerFor, type NotificationItem } from "./useNotifications";

function item(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: "n1",
    type: "announcement.published",
    title: "Announcement",
    detail: "System maintenance on Friday",
    read: false,
    createdAt: new Date().toISOString(),
    targetId: "a1",
    iconUrl: null,
    subjectName: null,
    category: "maintenance",
    excerpt: "The portal is offline from 22:00.",
    ...overrides,
  };
}

describe("bannerFor (ADR-103)", () => {
  it("gives an announcement its type and title and the start of its text, with no large image", () => {
    expect(bannerFor(item({}))).toEqual({
      title: "Maintenance · System maintenance on Friday",
      options: {
        body: "The portal is offline from 22:00.",
        tag: "announcement.published:a1",
      },
    });
  });

  it("tags each announcement separately, so a second one is shown, not silently swapped in", () => {
    expect(bannerFor(item({ targetId: "a1" })).options.tag).not.toBe(bannerFor(item({ targetId: "a2" })).options.tag);
  });

  it("names each type the way the editor does", () => {
    expect(bannerFor(item({ category: "info" })).title).toBe("Information · System maintenance on Friday");
    expect(bannerFor(item({ category: "important" })).title).toBe("Important · System maintenance on Friday");
  });

  it("still makes a banner from a row stored before type and excerpt were recorded", () => {
    expect(bannerFor(item({ category: null, excerpt: undefined }))).toEqual({
      title: "Announcement · System maintenance on Friday",
      options: { body: "", tag: "announcement.published:a1" },
    });
  });

  it("leaves every other type as its bell row, with no image", () => {
    expect(bannerFor(item({ type: "registration.pending", title: "New registration", detail: "Dana Lee" }))).toEqual({
      title: "New registration",
      options: { body: "Dana Lee", tag: "registration.pending" },
    });
  });
});
