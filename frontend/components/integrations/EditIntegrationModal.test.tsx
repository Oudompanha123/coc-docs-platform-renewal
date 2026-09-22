import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditIntegrationModal } from "./EditIntegrationModal";
import type { Integration } from "@/lib/admin/integrations";

function integration(overrides: Partial<Integration> = {}): Integration {
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

describe("EditIntegrationModal", () => {
  it("pre-fills the current name and events", () => {
    render(<EditIntegrationModal integration={integration()} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByLabelText("Name")).toHaveValue("#eng-docs");
    expect(screen.getByRole("checkbox", { name: "A new account registers" })).toBeChecked();
  });

  it("saves the edited name and events, then closes", async () => {
    const onSave = vi.fn().mockResolvedValue(integration({ name: "renamed" }));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditIntegrationModal integration={integration()} onClose={onClose} onSave={onSave} />);

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "renamed");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).toHaveBeenCalledWith("renamed", ["account.registered"]);
    expect(onClose).toHaveBeenCalled();
  });

  it("unchecking every event disables submit rather than sending an empty list", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<EditIntegrationModal integration={integration()} onClose={vi.fn()} onSave={onSave} />);

    await user.click(screen.getByRole("checkbox", { name: "A new account registers" }));

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("shows the failure reason and stays open on a rejected save", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("that name is already in use"));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditIntegrationModal integration={integration()} onClose={onClose} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("that name is already in use")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked, without saving", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditIntegrationModal integration={integration()} onClose={onClose} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
