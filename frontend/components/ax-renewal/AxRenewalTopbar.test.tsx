import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useAxRenewalProjectContext } = vi.hoisted(() => ({ useAxRenewalProjectContext: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("project=p1&section=attach"),
}));
vi.mock("@/lib/ax-renewal/AxRenewalProjectContext", () => ({ useAxRenewalProjectContext }));
vi.mock("@/lib/ax-renewal/tabs", () => ({ useAxRenewalTabs: () => ({ tabs: [], closeTab: vi.fn() }) }));
vi.mock("./AxRenewalTabBar", () => ({ AxRenewalTabBar: () => <div>tabs</div> }));
vi.mock("./AxRenewalBreadcrumb", () => ({ AxRenewalBreadcrumb: () => <div>breadcrumb</div> }));
// Stands in for the real bell, whose own behaviour AxRenewalNotificationsBell.test covers.
vi.mock("./AxRenewalNotificationsBell", () => ({ AxRenewalNotificationsBell: () => <div>notifications bell</div> }));

import { AxRenewalTopbar } from "./AxRenewalTopbar";

/**
 * The workspace header mounts the notification bell (ADR-075).
 *
 * <p>The regression this pins: the AX Renewal workspace has its own layout,
 * without the admin shell's Topbar, and its bell component existed but was
 * never mounted. With nothing listening, a notification that arrived while
 * somebody worked here raised no browser banner and the bell never updated.
 */
describe("AxRenewalTopbar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mounts the notification bell while a project is open", () => {
    useAxRenewalProjectContext.mockReturnValue({ projectId: "p1", detail: { project: { id: "p1" } } });

    render(<AxRenewalTopbar onMenuClick={vi.fn()} />);

    expect(screen.getByText("notifications bell")).toBeInTheDocument();
  });

  it("mounts it with no project open too — an invitation can arrive on the landing screen", () => {
    useAxRenewalProjectContext.mockReturnValue({ projectId: null, detail: null });

    render(<AxRenewalTopbar onMenuClick={vi.fn()} />);

    expect(screen.getByText("notifications bell")).toBeInTheDocument();
  });
});
