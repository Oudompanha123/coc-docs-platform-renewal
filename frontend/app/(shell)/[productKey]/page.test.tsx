import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellProvider, useShell } from "@/lib/layout/ShellContext";
import type { NavProduct } from "@/lib/docs/nav-api";

const { params, products, redirectHint } = vi.hoisted(() => ({
  params: { current: { productKey: "jex3-0" } },
  products: { current: null as NavProduct[] | null },
  redirectHint: { current: null as string | null },
}));

vi.mock("next/navigation", () => ({
  useParams: () => params.current,
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("@/lib/docs/useNavStructure", () => ({
  useNavStructure: () => products.current,
  peekRedirectHint: (key: string) => (key === params.current.productKey ? redirectHint.current : null),
}));
// Its own data-fetching/editing behaviour isn't what this page's routing
// logic is responsible for — kept shallow so a change in there can't make
// this file's own tests fail for an unrelated reason.
vi.mock("@/components/docs/editor/ProductContentTable", () => ({
  ProductContentTable: ({ productKey }: { productKey: string }) => <div>content table for {productKey}</div>,
}));

import ProductManagePage from "./page";

function product(overrides: Partial<NavProduct> = {}): NavProduct {
  return { key: "jex3-0", label: "Jex3.0", icon: "layers", minRole: "user", items: [], ...overrides };
}

function HeaderProbe() {
  const { header } = useShell();
  return <p data-testid="header-probe">{header.title} — {header.subtitle}</p>;
}

function renderPage() {
  return render(
    <ShellProvider>
      <HeaderProbe />
      <ProductManagePage />
    </ShellProvider>,
  );
}

beforeEach(() => {
  params.current = { productKey: "jex3-0" };
  products.current = [product()];
  redirectHint.current = null;
});

describe("ProductManagePage", () => {
  it("shows the product's title and subtitle in the shared shell header", () => {
    renderPage();

    expect(screen.getByTestId("header-probe")).toHaveTextContent("Jex3.0 — Manage Jex3.0's knowledge base content");
    expect(screen.getByText("content table for jex3-0")).toBeInTheDocument();
  });

  it("renders nothing while the product list is still loading, rather than 404ing early", () => {
    products.current = null;
    renderPage();

    expect(screen.queryByText(/content table/)).not.toBeInTheDocument();
  });

  it("404s once products have loaded and none of them match the URL's key", () => {
    products.current = [product({ key: "something-else" })];

    expect(() => renderPage()).toThrow("notFound");
  });

  it("renders nothing instead of 404ing while a rename's redirect to this key's new URL is in flight", () => {
    products.current = [product({ key: "jex" })]; // the rename already landed in the shared cache...
    redirectHint.current = "jex"; // ...and router.replace is on its way, but hasn't landed in the URL yet.

    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByText(/content table/)).not.toBeInTheDocument();
  });

  it("the header reflects a rename immediately, without remounting the page", () => {
    const { rerender } = renderPage();
    expect(screen.getByTestId("header-probe")).toHaveTextContent("Jex3.0");

    // Simulates what the shared store's `applyProductRename` does to every
    // mounted `useNavStructure()` consumer, including this page, the instant
    // a rename succeeds (task: "no window.location.reload()").
    products.current = [product({ key: "jex", label: "Jex" })];
    params.current = { productKey: "jex" };
    rerender(
      <ShellProvider>
        <HeaderProbe />
        <ProductManagePage />
      </ShellProvider>,
    );

    expect(screen.getByTestId("header-probe")).toHaveTextContent("Jex — Manage Jex's knowledge base content");
  });
});
