import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClaudeUsageCard } from "./ClaudeUsageCard";

const { sessionRole } = vi.hoisted(() => ({ sessionRole: { current: "user" as string | undefined } }));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ user: { role: sessionRole.current } }),
}));

// MyClaudeUsageSection has its own full test suite and makes real fetch
// calls — stubbed here so this file only tests this card's own chrome and
// role gate, not the usage data itself.
vi.mock("@/components/claude-usage/MyClaudeUsageSection", () => ({
  MyClaudeUsageSection: () => <div data-testid="usage-section" />,
}));

beforeEach(() => {
  sessionRole.current = "user";
});

describe("ClaudeUsageCard", () => {
  it("renders the card chrome and the (unmodified) usage section for a plain user", () => {
    render(<ClaudeUsageCard />);

    expect(screen.getByRole("heading", { name: "Claude Usage" })).toBeInTheDocument();
    expect(screen.getByText("Track your Claude token usage.")).toBeInTheDocument();
    expect(screen.getByTestId("usage-section")).toBeInTheDocument();
  });

  it.each(["admin", "super_admin"])("also renders for %s", (role) => {
    sessionRole.current = role;
    render(<ClaudeUsageCard />);
    expect(screen.getByTestId("usage-section")).toBeInTheDocument();
  });

  it.each(["developer", "reviewer", "lead"])(
    "renders nothing at all for %s — the same floor /my-claude-usage always enforced",
    (role) => {
      sessionRole.current = role;
      const { container } = render(<ClaudeUsageCard />);
      expect(container).toBeEmptyDOMElement();
    },
  );
});
