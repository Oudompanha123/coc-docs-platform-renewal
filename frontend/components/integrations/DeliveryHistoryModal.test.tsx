import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeliveryHistoryModal } from "./DeliveryHistoryModal";
import type { Integration, IntegrationDelivery } from "@/lib/admin/integrations";

const INTEGRATION: Integration = {
  id: "0f8b1a2c-1111-4444-8888-aaaaaaaaaaaa",
  provider: "webhook",
  name: "#eng-docs",
  targetUrl: "https://hooks.example.com/abc",
  events: ["account.registered"],
  status: "connected",
  lastTestedAt: null,
  lastTestStatus: null,
  createdAt: "2026-09-01T00:00:00Z",
};

function delivery(overrides: Partial<IntegrationDelivery> = {}): IntegrationDelivery {
  return {
    id: 1,
    eventType: "account.registered",
    httpStatus: 200,
    success: true,
    error: null,
    latencyMs: 88,
    attemptedAt: "2026-09-14T08:00:00Z",
    ...overrides,
  };
}

describe("DeliveryHistoryModal", () => {
  it("loads on mount, without needing a click first", () => {
    const loadDeliveries = vi.fn().mockResolvedValue([]);
    render(<DeliveryHistoryModal integration={INTEGRATION} onClose={vi.fn()} loadDeliveries={loadDeliveries} />);

    expect(loadDeliveries).toHaveBeenCalledWith(INTEGRATION.id);
  });

  it("shows a row per delivery, real events and test pings alike", async () => {
    const loadDeliveries = vi.fn().mockResolvedValue([
      delivery({ id: 1, eventType: "account.registered", success: true }),
      delivery({ id: 2, eventType: "integration.test", success: false, error: "connection refused", httpStatus: null }),
    ]);
    render(<DeliveryHistoryModal integration={INTEGRATION} onClose={vi.fn()} loadDeliveries={loadDeliveries} />);

    expect(await screen.findByText("A new account registers")).toBeInTheDocument();
    expect(screen.getByText("Test ping")).toBeInTheDocument();
    expect(screen.getByText("connection refused")).toBeInTheDocument();
  });

  it("shows an empty-state message when nothing has been sent yet", async () => {
    const loadDeliveries = vi.fn().mockResolvedValue([]);
    render(<DeliveryHistoryModal integration={INTEGRATION} onClose={vi.fn()} loadDeliveries={loadDeliveries} />);

    expect(await screen.findByText(/no deliveries yet/i)).toBeInTheDocument();
  });

  it("shows the failure reason when history can't be loaded", async () => {
    const loadDeliveries = vi.fn().mockRejectedValue(new Error("Only a super admin can manage integrations."));
    render(<DeliveryHistoryModal integration={INTEGRATION} onClose={vi.fn()} loadDeliveries={loadDeliveries} />);

    expect(await screen.findByText("Only a super admin can manage integrations.")).toBeInTheDocument();
  });

  it("calls onClose when Close is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DeliveryHistoryModal
        integration={INTEGRATION}
        onClose={onClose}
        loadDeliveries={vi.fn().mockResolvedValue([])}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });
});
