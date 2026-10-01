import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AxRenewalConfirmation } from "@/lib/ax-renewal/api";
import { ConfirmationBar } from "./ConfirmationBar";

/** Who confirmed a Plan section, not only when (ADR-075). */
describe("ConfirmationBar", () => {
  function confirmation(overrides: Partial<AxRenewalConfirmation> = {}): AxRenewalConfirmation {
    return {
      section: "pages",
      confirmedAt: "2026-10-01T09:30:00Z",
      confirmedBy: "u1",
      confirmedVia: "super_admin",
      confirmedByName: "Dara",
      ...overrides,
    };
  }

  function renderBar(c: AxRenewalConfirmation | undefined) {
    render(
      <ConfirmationBar section="pages" confirmation={c} canConfirm busy={false} onConfirm={vi.fn()} onReopen={vi.fn()} />,
    );
  }

  it("names who confirmed it, then when", () => {
    renderBar(confirmation());

    const when = new Date("2026-10-01T09:30:00Z").toLocaleString();
    expect(screen.getByText(`Confirmed by Dara · ${when}`)).toBeInTheDocument();
  });

  it("still says how, when it was confirmed through the Developer role", () => {
    renderBar(confirmation({ confirmedVia: "developer_role" }));

    expect(screen.getByText(/Confirmed by Dara · .* · via Developer role/)).toBeInTheDocument();
  });

  it("falls back to the date alone when the name is not known", () => {
    renderBar(confirmation({ confirmedByName: null }));

    const when = new Date("2026-10-01T09:30:00Z").toLocaleString();
    expect(screen.getByText(`Confirmed · ${when}`)).toBeInTheDocument();
  });

  it("says plainly when nobody has confirmed it yet", () => {
    renderBar(undefined);

    expect(screen.getByText("Not confirmed yet.")).toBeInTheDocument();
  });
});
