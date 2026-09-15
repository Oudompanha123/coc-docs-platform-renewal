import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  it("marks only the current step with aria-current", () => {
    render(<Stepper steps={["Account", "Verify", "Confirm"]} currentIndex={1} />);

    expect(screen.getByText("Account")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Verify")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Confirm")).not.toHaveAttribute("aria-current");
  });

  it("renders every step's number and label", () => {
    render(<Stepper steps={["Account", "Verify", "Confirm"]} currentIndex={0} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("exposes the step list as a navigation landmark", () => {
    render(<Stepper steps={["Account", "Verify", "Confirm"]} currentIndex={2} />);

    expect(screen.getByRole("navigation", { name: "Registration progress" })).toBeInTheDocument();
    expect(screen.getByRole("list").children).toHaveLength(3);
  });
});
