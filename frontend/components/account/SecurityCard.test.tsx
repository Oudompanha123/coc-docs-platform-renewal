import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SecurityCard } from "./SecurityCard";

const { fetchMySecurity } = vi.hoisted(() => ({ fetchMySecurity: vi.fn() }));
vi.mock("@/lib/me/security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/me/security")>("@/lib/me/security");
  return { ...actual, fetchMySecurity };
});

describe("SecurityCard", () => {
  it("shows Google as the sign-in method, with the caller's email", async () => {
    fetchMySecurity.mockResolvedValue({
      signInMethod: "google",
      email: "dana@example.com",
      recentSignIns: [],
    });

    render(<SecurityCard />);

    expect(await screen.findByText("Google account")).toBeInTheDocument();
    expect(screen.getByText("dana@example.com")).toBeInTheDocument();
  });

  it("shows 'No sign-in history yet.' when the list is empty", async () => {
    fetchMySecurity.mockResolvedValue({ signInMethod: "google", email: "dana@example.com", recentSignIns: [] });

    render(<SecurityCard />);

    expect(await screen.findByText("No sign-in history yet.")).toBeInTheDocument();
  });

  it("shows each sign-in/sign-out event with its device, and never an IP address", async () => {
    fetchMySecurity.mockResolvedValue({
      signInMethod: "google",
      email: "dana@example.com",
      recentSignIns: [
        { action: "auth.sign_in", occurredAt: "2026-09-30T13:32:00Z", device: "Chrome on Windows" },
        { action: "auth.sign_out", occurredAt: "2026-09-29T09:00:00Z", device: "" },
      ],
    });

    render(<SecurityCard />);

    expect(await screen.findByText("Signed in")).toBeInTheDocument();
    expect(screen.getByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.getByText("Signed out")).toBeInTheDocument();
    // A blank device (the sign-out case) falls back to this label, not to a
    // blank line, and no IP anywhere on the card.
    expect(screen.getByText("Unknown device")).toBeInTheDocument();
    expect(screen.queryByText(/\d+\.\d+\.\d+\.\d+/)).not.toBeInTheDocument();
  });

  it("shows about five sign-ins and scrolls for the rest — every event still listed", async () => {
    fetchMySecurity.mockResolvedValue({
      signInMethod: "google",
      email: "dana@example.com",
      recentSignIns: Array.from({ length: 10 }, (_, i) => ({
        action: i % 2 ? "auth.sign_out" : "auth.sign_in",
        occurredAt: `2026-10-${String(14 - i).padStart(2, "0")}T06:24:00Z`,
        device: "Chrome on Windows",
      })),
    });

    render(<SecurityCard />);

    const list = await screen.findByRole("region", { name: "Recent sign-ins" });
    expect(list).toHaveClass("max-h-[17.5rem]", "overflow-y-auto");
    expect(list).toHaveAttribute("tabindex", "0"); // keyboard can scroll it
    expect(list.children).toHaveLength(10);
  });

  it("five or fewer sign-ins: no scroll box and no extra tab stop", async () => {
    fetchMySecurity.mockResolvedValue({
      signInMethod: "google",
      email: "dana@example.com",
      recentSignIns: Array.from({ length: 5 }, () => ({
        action: "auth.sign_in",
        occurredAt: "2026-10-14T06:24:00Z",
        device: "Chrome on Windows",
      })),
    });

    render(<SecurityCard />);

    expect(await screen.findAllByText("Signed in")).toHaveLength(5);
    expect(screen.queryByRole("region", { name: "Recent sign-ins" })).not.toBeInTheDocument();
    expect(document.querySelector("[tabindex='0']")).toBeNull();
  });

  it("surfaces a load failure", async () => {
    fetchMySecurity.mockRejectedValue(new Error("network down"));

    render(<SecurityCard />);

    expect(await screen.findByText("network down")).toBeInTheDocument();
  });
});
