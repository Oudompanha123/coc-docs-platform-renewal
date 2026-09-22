import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IntegrationsTable } from "./IntegrationsTable";
import type { Integration } from "@/lib/admin/integrations";

function row(overrides: Partial<Integration> = {}): Integration {
  return {
    id: "0f8b1a2c-1111-4444-8888-aaaaaaaaaaaa",
    provider: "webhook",
    name: "#eng-docs",
    targetUrl: "https://hooks.example.com/abc",
    events: ["account.registered"],
    status: "connected",
    lastTestedAt: null,
    lastTestStatus: null,
    createdAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

describe("IntegrationsTable", () => {
  it("opens the edit view for the clicked row, even when disconnected", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <IntegrationsTable
        integrations={[row({ status: "disabled" })]}
        onTest={vi.fn()}
        onRotate={vi.fn()}
        onDisconnect={vi.fn()}
        onReconnect={vi.fn()}
        onEdit={onEdit}
        onViewHistory={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledWith(row({ status: "disabled" }));
  });

  it("opens delivery history for the clicked row", async () => {
    const onViewHistory = vi.fn();
    const user = userEvent.setup();
    render(
      <IntegrationsTable
        integrations={[row()]}
        onTest={vi.fn()}
        onRotate={vi.fn()}
        onDisconnect={vi.fn()}
        onReconnect={vi.fn()}
        onEdit={vi.fn()}
        onViewHistory={onViewHistory}
      />,
    );

    await user.click(screen.getByRole("button", { name: "History" }));

    expect(onViewHistory).toHaveBeenCalledWith(row());
  });

  it("disables Test and Rotate secret, but not Edit or History, once disconnected", () => {
    render(
      <IntegrationsTable
        integrations={[row({ status: "disabled" })]}
        onTest={vi.fn()}
        onRotate={vi.fn()}
        onDisconnect={vi.fn()}
        onReconnect={vi.fn()}
        onEdit={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Test" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rotate secret" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "History" })).toBeEnabled();
  });

  it("shows Reconnect instead of Disconnect once disconnected, and calls onReconnect for that row", async () => {
    const onReconnect = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <IntegrationsTable
        integrations={[row({ status: "disabled" })]}
        onTest={vi.fn()}
        onRotate={vi.fn()}
        onDisconnect={vi.fn()}
        onReconnect={onReconnect}
        onEdit={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Disconnect" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reconnect" }));

    expect(onReconnect).toHaveBeenCalledWith(row({ status: "disabled" }));
  });

  it("shows Disconnect, not Reconnect, while connected", () => {
    render(
      <IntegrationsTable
        integrations={[row()]}
        onTest={vi.fn()}
        onRotate={vi.fn()}
        onDisconnect={vi.fn()}
        onReconnect={vi.fn()}
        onEdit={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Disconnect" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Reconnect" })).not.toBeInTheDocument();
  });
});
