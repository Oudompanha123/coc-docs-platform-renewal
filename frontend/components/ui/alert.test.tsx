import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("an error is announced at once (role=alert); other variants politely (role=status)", () => {
    const { rerender } = render(<Alert variant="destructive">Couldn&apos;t save.</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't save.");
    rerender(<Alert variant="success">Saved.</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Saved.");
  });

  it("an explicit role wins", () => {
    render(
      <Alert variant="warning" role="alert">
        Read only.
      </Alert>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Read only.");
  });

  it("carries an icon by default, so the state isn't colour alone; icon={false} removes it", () => {
    const { container, rerender } = render(<Alert variant="warning">Heads up</Alert>);
    expect(container.querySelector("svg")).not.toBeNull();
    rerender(
      <Alert variant="warning" icon={false}>
        Heads up
      </Alert>,
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders a title, a description, an action and a dismiss button", async () => {
    const onDismiss = vi.fn();
    const onRetry = vi.fn();
    render(
      <Alert variant="destructive" onDismiss={onDismiss} action={<button onClick={onRetry}>Retry</button>}>
        <AlertTitle>Upload failed</AlertTitle>
        <AlertDescription>The server didn&apos;t answer.</AlertDescription>
      </Alert>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onRetry).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failedThe server didn't answer.");
  });
});
