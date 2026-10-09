import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductsNavDropdown } from "./ProductsNavDropdown";
import type { NavProduct } from "@/lib/docs/nav-api";

const PRODUCTS: NavProduct[] = [
  { key: "jex3-0", label: "Jex3.0", icon: "layers", minRole: "guest", items: [] },
  { key: "jex2-0", label: "Jex2.0", icon: "folder", minRole: "guest", items: [] },
];

describe("ProductsNavDropdown (public /welcome page)", () => {
  it("opens one grid of every product, not a dropdown per product", async () => {
    const user = userEvent.setup();
    const onRequireAuth = vi.fn();
    render(<ProductsNavDropdown products={PRODUCTS} onRequireAuth={onRequireAuth} />);

    expect(screen.getAllByRole("button", { name: /products/i })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /products/i }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /jex3\.0/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /jex2\.0/i })).toBeInTheDocument();
    expect(onRequireAuth).not.toHaveBeenCalled();
  });

  it("clicking a product tile closes the menu and prompts sign-in", async () => {
    const user = userEvent.setup();
    const onRequireAuth = vi.fn();
    render(<ProductsNavDropdown products={PRODUCTS} onRequireAuth={onRequireAuth} />);

    await user.click(screen.getByRole("button", { name: /products/i }));
    await user.click(screen.getByRole("menuitem", { name: /jex3\.0/i }));

    expect(onRequireAuth).toHaveBeenCalledWith("Jex3.0");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("toggles closed on a second click of the trigger", async () => {
    const user = userEvent.setup();
    render(<ProductsNavDropdown products={PRODUCTS} onRequireAuth={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: /products/i });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
