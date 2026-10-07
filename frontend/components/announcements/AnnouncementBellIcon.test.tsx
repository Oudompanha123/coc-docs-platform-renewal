import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnnouncementBellIcon } from "./AnnouncementBellIcon";
import { CATEGORY_META } from "./categories";

/** The bell's per-category avatar (ADR-098). */
describe("AnnouncementBellIcon", () => {
  function iconMarkup(category: string | null) {
    return render(<AnnouncementBellIcon category={category} />).container.innerHTML;
  }

  it("draws a different icon and colour for each category", () => {
    const markups = (["info", "update", "maintenance", "important"] as const).map((c) => {
      const html = iconMarkup(c);
      expect(html).toContain(CATEGORY_META[c].tile.split(" ")[0]!);
      return html;
    });
    expect(new Set(markups).size).toBe(4);
  });

  it("falls back to Information for a row with no or an unknown category", () => {
    const info = iconMarkup("info");
    expect(iconMarkup(null)).toBe(info);
    expect(iconMarkup("gossip")).toBe(info);
  });
});
