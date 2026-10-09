import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

/**
 * These test the two things a shared primitive can get wrong in a way no
 * call site would notice until it shipped: losing an override, and quietly
 * becoming a different element.
 */
describe("Button", () => {
  it("renders a real button element, so forms still submit", () => {
    render(<Button type="submit">Login</Button>);

    const button = screen.getByRole("button", { name: "Login" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "submit");
  });

  it("lets a caller's class win over the variant's", () => {
    // The whole reason cn() wraps tailwind-merge. Plain concatenation would
    // emit both paddings and let Tailwind's output order pick the winner.
    render(<Button className="px-8">Wide</Button>);

    const className = screen.getByRole("button", { name: "Wide" }).className;
    expect(className).toContain("px-8");
    expect(className).not.toContain("px-4");
  });

  it("keeps a caller's additions that do not conflict", () => {
    render(<Button className="shadow-sm">Verify</Button>);

    const className = screen.getByRole("button", { name: "Verify" }).className;
    expect(className).toContain("shadow-sm");
    expect(className).toContain("from-brand-purple");
  });

  it("gives each variant its own treatment", () => {
    const { rerender } = render(<Button variant="outline">Back</Button>);
    expect(screen.getByRole("button").className).toContain("border-border");

    rerender(<Button variant="link">Resend</Button>);
    expect(screen.getByRole("button").className).toContain("text-brand-purple");

    rerender(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button").className).toContain("bg-destructive");
  });

  it("dims the link variant by going muted, never by stacking opacity on top", () => {
    // Both would apply if `disabled:opacity-60` sat in the shared base, and
    // the link would read fainter disabled than it ever did before.
    render(
      <Button variant="link" disabled>
        Resend code
      </Button>,
    );

    const className = screen.getByRole("button", { name: "Resend code" }).className;
    expect(className).toContain("disabled:text-muted");
    expect(className).not.toContain("disabled:opacity-60");
  });

  it("renders the child element instead of a button when asChild is set", () => {
    // An external href on purpose: next/link's lint rule rejects a bare <a>
    // pointing at one of this app's own routes, and what is under test here
    // is the Slot, not the destination.
    render(
      <Button asChild>
        <a href="https://example.com/docs">Sign in</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link.tagName).toBe("A");
    expect(link.className).toContain("from-brand-purple");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("passes disabled through rather than only styling it", () => {
    render(<Button disabled>Saving…</Button>);

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });
});
