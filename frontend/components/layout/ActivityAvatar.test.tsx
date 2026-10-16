import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BACKEND_URL } from "@/lib/auth/api";
import type { ActivityItem } from "@/lib/notify/useActivityFeed";
import { ActivityAvatar } from "./ActivityAvatar";

// The bell's avatar (ADR-101): an uploaded photo arrives as the backend's
// /api/v1/avatars/... route and must be fetched from the backend, not the
// frontend's own origin; a Google picture is used as-is.

const item = (actorAvatarUrl: string | null) => ({ actorEmail: "dana@example.com", actorAvatarUrl }) as ActivityItem;

describe("ActivityAvatar", () => {
  it("loads an uploaded photo from the backend's avatar route", () => {
    const { container } = render(<ActivityAvatar item={item("/api/v1/avatars/acc-1/photo.png")} />);
    expect(container.querySelector("img")).toHaveAttribute("src", `${BACKEND_URL}/api/v1/avatars/acc-1/photo.png`);
  });

  it("uses a Google picture unchanged", () => {
    const google = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c";
    const { container } = render(<ActivityAvatar item={item(google)} />);
    expect(container.querySelector("img")).toHaveAttribute("src", google);
  });

  it("falls back to initials with no picture", () => {
    const { container } = render(<ActivityAvatar item={item(null)} />);
    expect(container.querySelector("img")).toBeNull();
  });
});
