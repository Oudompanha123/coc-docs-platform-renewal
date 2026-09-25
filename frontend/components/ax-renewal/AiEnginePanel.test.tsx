import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { fetchEngineStatus } = vi.hoisted(() => ({ fetchEngineStatus: vi.fn() }));
vi.mock("@/lib/ax-renewal/api", () => ({ fetchEngineStatus }));

import { AiEnginePanel } from "./AiEnginePanel";

describe("AiEnginePanel", () => {
  it("shows the not-connected state and the setup guide when no model is configured on this machine", async () => {
    fetchEngineStatus.mockResolvedValue({ connected: false, readsSource: false });

    render(<AiEnginePanel />);

    expect(await screen.findByText(/No AI model is connected on this machine yet/)).toBeInTheDocument();
    // The exact real env var names, not a guessed spelling -- see backend/.env.example.
    expect(screen.getByText("APP_AXRENEWAL_CLAUDECLIPATH=<the path step 2 printed>", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/npm install -g @anthropic-ai\/claude-code/)).toBeInTheDocument();
  });

  it("shows connected and that it only reads the manifest, when a model is configured without a source path", async () => {
    fetchEngineStatus.mockResolvedValue({ connected: true, readsSource: false });

    render(<AiEnginePanel />);

    expect(await screen.findByText(/Connected on this machine/)).toBeInTheDocument();
    expect(screen.getByText(/reads the stored manifest only right now/)).toBeInTheDocument();
  });

  it("shows connected and reading real source, once both settings are configured", async () => {
    fetchEngineStatus.mockResolvedValue({ connected: true, readsSource: true });

    render(<AiEnginePanel />);

    expect(await screen.findByText(/Connected on this machine/)).toBeInTheDocument();
    expect(screen.getByText(/reads your attached source directly/)).toBeInTheDocument();
  });
});
