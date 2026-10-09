import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

/**
 * These test the two things a shared primitive can get wrong in a way no
 * call site would notice until it shipped: losing an override, and quietly
 * becoming a different element.
 *
 * The class assertions name the *token* a variant should resolve to, never a
 * literal colour. The palette changed once already (brand gradient → shadcn
 * neutral) and tests pinned to hex values would have had to change with it
 * while testing nothing that mattered.
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
    expect(className).not.toContain("px-5");
  });

  it("keeps a caller's additions that do not conflict", () => {
    render(<Button className="w-full">Verify</Button>);

    const className = screen.getByRole("button", { name: "Verify" }).className;
    expect(className).toContain("w-full");
    expect(className).toContain("bg-primary");
  });

  it("gives each variant its own treatment", () => {
    const { rerender } = render(<Button variant="outline">Back</Button>);
    expect(screen.getByRole("button").className).toContain("border-surface-border");

    rerender(<Button variant="secondary">Later</Button>);
    expect(screen.getByRole("button").className).toContain("bg-secondary");

    rerender(<Button variant="link">Resend</Button>);
    expect(screen.getByRole("button").className).toContain("hover:underline");

    rerender(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button").className).toContain("bg-destructive");

    rerender(<Button variant="destructiveOutline">Revoke</Button>);
    expect(screen.getByRole("button").className).toContain("text-destructive");
  });

  it("uses the design system's control radius by default, not a pill", () => {
    render(<Button>Sign in</Button>);

    const className = screen.getByRole("button", { name: "Sign in" }).className;
    expect(className).toContain("rounded-control");
    expect(className).not.toContain("rounded-full");
  });

  it("lets a caller override the corner, and the override replaces the default", () => {
    // `rounded-control` is a project radius tailwind-merge does not know by
    // default; if `cn` stops registering it, both classes survive and this
    // fails rather than the override quietly losing to stylesheet order.
    render(<Button className="rounded-md">Square</Button>);

    const className = screen.getByRole("button", { name: "Square" }).className;
    expect(className).toContain("rounded-md");
    expect(className).not.toContain("rounded-control");
  });

  it("is a pill when asked — the sign-in pages' shape", () => {
    render(<Button shape="pill">Continue with Google</Button>);

    const className = screen.getByRole("button", { name: "Continue with Google" }).className;
    expect(className).toContain("rounded-full");
    expect(className).not.toContain("rounded-control");
  });

  it("keeps an inline button boxless whatever its shape", () => {
    // `shape` is declared before `size` so `rounded-none` is emitted last and
    // wins; reorder the variants and this fails.
    render(
      <Button shape="pill" variant="link" size="inline">
        Resend
      </Button>,
    );

    const className = screen.getByRole("button", { name: "Resend" }).className;
    expect(className).toContain("rounded-none");
    expect(className).not.toContain("rounded-full");
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
    expect(link.className).toContain("bg-primary");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("passes disabled through rather than only styling it", () => {
    render(<Button disabled>Saving…</Button>);

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });
});
