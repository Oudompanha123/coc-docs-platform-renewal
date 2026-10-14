import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeResponse } from "@/lib/auth/api";
import type { NavProduct } from "@/lib/docs/nav-api";

const DEFAULT_NAV: NavProduct[] = [
  {
    key: "ax-renewal-docs",
    label: "AX Renewal",
    icon: "layers",
    minRole: "user",
    items: [{ slug: "", label: "Overview" } as NavProduct["items"][number]],
  },
  {
    key: "jex3-0",
    label: "JEX 3.0",
    icon: "document",
    minRole: "user",
    items: [{ slug: "", label: "Overview" } as NavProduct["items"][number]],
  },
];

const { params, session, navProducts } = vi.hoisted(() => ({
  params: { current: { productKey: "ax-renewal-docs" } as { productKey: string; slug?: string } },
  session: {
    current: { status: "authenticated", user: { role: "user" } } as {
      status: "loading" | "authenticated" | "anonymous";
      user: Partial<MeResponse> | null;
    },
  },
  navProducts: { current: undefined as unknown as NavProduct[] },
}));

vi.mock("next/navigation", () => ({
  useParams: () => params.current,
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession: () => session.current }));
vi.mock("@/lib/docs/useNavStructure", () => ({
  useNavStructure: (): NavProduct[] => navProducts.current,
}));
// The page chrome around the gate is not what is under test here.
vi.mock("@/components/home/MemberHeader", () => ({ MemberHeader: () => <header>header</header> }));
vi.mock("@/components/home/HomeFooter", () => ({ HomeFooter: () => <footer>footer</footer> }));
vi.mock("@/components/docs/ProductTabBar", () => ({ ProductTabBar: () => <nav>tabs</nav> }));
vi.mock("@/components/layout/ProfileModal", () => ({ ProfileModal: () => null }));
vi.mock("@/components/home/NotificationsModal", () => ({ NotificationsModal: () => null }));

import ProductLayout from "./layout";

function renderAs(role: MeResponse["role"] | null, status: "loading" | "authenticated" | "anonymous" = "authenticated") {
  session.current = { status, user: role ? { role } : null };
  render(
    <ProductLayout>
      <p>docs content</p>
    </ProductLayout>,
  );
}

beforeEach(() => {
  navProducts.current = DEFAULT_NAV;
});

/** Products → AX Renewal (ADR-090): a plain user is told no, not shown the docs. */
describe("product docs layout — AX Renewal", () => {
  beforeEach(() => {
    params.current = { productKey: "ax-renewal-docs" };
  });

  it("tells a plain user they don't have permission, instead of showing the docs", () => {
    renderAs("user");

    expect(screen.getByRole("alert")).toHaveTextContent("You don’t have permission to access this page.");
    expect(screen.queryByText("docs content")).not.toBeInTheDocument();
    expect(screen.queryByText("tabs")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Products" })).toHaveAttribute("href", "/home");
  });

  it("tells a signed-out visitor the same", () => {
    renderAs(null, "anonymous");

    expect(screen.getByRole("alert")).toHaveTextContent("You don’t have permission to access this page.");
    expect(screen.queryByText("docs content")).not.toBeInTheDocument();
  });

  it.each(["developer", "reviewer", "lead", "admin", "super_admin"] as const)("shows the docs to a %s", (role) => {
    renderAs(role);

    expect(screen.getByText("docs content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows neither the docs nor the message while the session is still loading", () => {
    renderAs(null, "loading");

    expect(screen.queryByText("docs content")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("leaves every other product open to a plain user, without waiting for the session", () => {
    params.current = { productKey: "jex3-0" };
    renderAs(null, "loading");

    expect(screen.getByText("docs content")).toBeInTheDocument();
  });
});

/** The tab bar only earns its place once there's something to switch between. */
describe("product docs layout — tab bar visibility by item count", () => {
  function withItems(count: number) {
    const items = Array.from({ length: count }, (_, i) => ({
      slug: i === 0 ? "" : `item-${i}`,
      label: `Item ${i}`,
    })) as NavProduct["items"];
    navProducts.current = [
      { key: "jex3-0", label: "JEX 3.0", icon: "document", minRole: "user", items },
    ];
    params.current = { productKey: "jex3-0" };
  }

  it("hides the tab bar for a single item — content still renders", () => {
    withItems(1);
    renderAs("user");

    expect(screen.queryByText("tabs")).not.toBeInTheDocument();
    expect(screen.getByText("docs content")).toBeInTheDocument();
  });

  it("shows the tab bar for two items", () => {
    withItems(2);
    renderAs("user");

    expect(screen.getByText("tabs")).toBeInTheDocument();
    expect(screen.getByText("docs content")).toBeInTheDocument();
  });

  it("shows the tab bar for more than two items", () => {
    withItems(4);
    renderAs("user");

    expect(screen.getByText("tabs")).toBeInTheDocument();
  });

  it("renders neither the tab bar nor content for zero items (existing empty state)", () => {
    withItems(0);
    renderAs("user");

    expect(screen.queryByText("tabs")).not.toBeInTheDocument();
    expect(screen.queryByText("docs content")).not.toBeInTheDocument();
  });
});
