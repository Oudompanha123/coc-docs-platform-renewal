import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppearanceCard } from "./AppearanceCard";
import type { Theme } from "@/lib/theme";

const { getStoredTheme, applyTheme } = vi.hoisted(() => ({
  getStoredTheme: vi.fn((): Theme => "system"),
  applyTheme: vi.fn(),
}));

vi.mock("@/lib/theme", () => ({ getStoredTheme, applyTheme }));

beforeEach(() => {
  vi.clearAllMocks();
  getStoredTheme.mockReturnValue("system");
});

describe("AppearanceCard", () => {
  it("reads the current theme from the shared lib/theme.ts state on mount", () => {
    getStoredTheme.mockReturnValue("dark");
    render(<AppearanceCard />);

    expect(screen.getByRole("button", { name: /dark/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^light$/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("selecting a theme calls the shared applyTheme — the same function the admin toggle uses", async () => {
    const user = userEvent.setup();
    render(<AppearanceCard />);

    await user.click(screen.getByRole("button", { name: /^light$/i }));

    expect(applyTheme).toHaveBeenCalledWith("light");
    expect(screen.getByRole("button", { name: /^light$/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders all three options: Light, Dark, System", () => {
    render(<AppearanceCard />);
    expect(screen.getByRole("button", { name: /^light$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^dark$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^system$/i })).toBeInTheDocument();
  });
});
