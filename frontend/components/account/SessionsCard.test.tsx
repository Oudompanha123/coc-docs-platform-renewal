import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionsCard } from "./SessionsCard";

// The list itself is tested through SecurityTab — here only that this tab
// carries it, same as /settings.
vi.mock("@/components/settings/ActiveSessions", () => ({
  ActiveSessions: () => <div>Active sessions list</div>,
}));

describe("SessionsCard (account settings)", () => {
  it("shows the same Active sessions list as /settings", () => {
    render(<SessionsCard />);

    expect(screen.getByRole("heading", { name: "Sessions" })).toBeInTheDocument();
    expect(screen.getByText("Active sessions list")).toBeInTheDocument();
  });
});
