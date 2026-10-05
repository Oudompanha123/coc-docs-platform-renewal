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

  it("surfaces a load failure", async () => {
    fetchMySecurity.mockRejectedValue(new Error("network down"));

    render(<SecurityCard />);

    expect(await screen.findByText("network down")).toBeInTheDocument();
  });
});
