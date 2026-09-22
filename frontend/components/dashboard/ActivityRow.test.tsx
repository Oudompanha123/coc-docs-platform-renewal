import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActivityEntry } from "@/lib/docs/activity-api";
import { ActivityRow } from "./ActivityRow";

function entry(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    actorEmail: "dana.lee@example.com",
    actorAvatarUrl: null,
    action: "auth.sign_in",
    targetType: "account",
    detail: {},
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Overview's "Recent Activity" panel reads from the same `audit_log` join as
 * the topbar's Activity dropdown (`AuditRepository.recent`, which already
 * joins `account.avatar_url`), but `ApiDtos.ActivityEntryResponse` dropped
 * that field on the way out, so every row here fell back to a plain letter
 * bubble even for an actor with a real picture on file.
 */
describe("ActivityRow", () => {
  it("shows the actor's picture when one is present", () => {
    const { container } = render(<ActivityRow data={entry({ actorAvatarUrl: "https://cdn.example.com/dana.png" })} />);

    expect(container.querySelector('img[src="https://cdn.example.com/dana.png"]')).toBeInTheDocument();
  });

  it("falls back to a coloured initial when the actor has no picture", () => {
    const { container } = render(<ActivityRow data={entry({ actorAvatarUrl: null, actorEmail: "dana.lee@example.com" })} />);

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });
});
