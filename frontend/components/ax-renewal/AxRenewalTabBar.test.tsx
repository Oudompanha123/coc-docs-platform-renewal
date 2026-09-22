import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AxRenewalTabBar } from "./AxRenewalTabBar";

describe("AxRenewalTabBar", () => {
  it("renders nothing once every tab has been closed — AxRenewalBreadcrumb owns the single 'no tab open' message for this area", () => {
    const { container } = render(<AxRenewalTabBar tabs={[]} active={null} onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a tab per open key while any tab is open", () => {
    render(<AxRenewalTabBar tabs={["attach", "codebase"]} active="attach" onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Attach source")).toBeInTheDocument();
    expect(screen.getByText("Codebase")).toBeInTheDocument();
  });
});
