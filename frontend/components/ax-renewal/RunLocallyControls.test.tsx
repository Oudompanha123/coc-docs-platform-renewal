import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RunLocallyControls } from "./RunLocallyControls";

/** A promise the test resolves by hand, to hold a request in flight. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("RunLocallyControls", () => {
  it("shows Starting… the moment Start is clicked, before the request returns", () => {
    const start = deferred();
    render(<RunLocallyControls state="stopped" onStart={() => start.promise} onStop={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    const loading = screen.getByRole("button", { name: /Starting/ });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("aria-busy", "true");
    // No process exists yet, so there is nothing to cancel.
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("sends one start for a double click", () => {
    const onStart = vi.fn(() => deferred().promise);
    render(<RunLocallyControls state={null} onStart={onStart} onStop={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Start" });

    // Same tick, before React re-renders the button as disabled.
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("stays loading while the dev server is starting, with Cancel to stop it", async () => {
    const start = deferred();
    const onStop = vi.fn(() => Promise.resolve());
    const { rerender } = render(
      <RunLocallyControls state="stopped" onStart={() => start.promise} onStop={onStop} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    // The request returns; the server is still coming up.
    rerender(<RunLocallyControls state="starting" onStart={() => start.promise} onStop={onStop} />);
    await act(async () => start.resolve());

    expect(screen.getByRole("button", { name: /Starting/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("offers Stop once the server is running", () => {
    render(<RunLocallyControls state="running" onStart={vi.fn()} onStop={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Stop" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Starting/ })).not.toBeInTheDocument();
  });

  it.each(["failed", "stopped"] as const)("offers Start again once the run has %s", (state) => {
    render(<RunLocallyControls state={state} onStart={vi.fn()} onStop={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
  });

  it("returns to Start when the start request itself fails", async () => {
    // The panel reports the error; the control just must not stay stuck.
    const start = deferred();
    render(<RunLocallyControls state="failed" onStart={() => start.promise} onStop={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    await act(async () => start.resolve());

    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
  });

  it("shows Stopping… while a stop is in flight, and takes no second click", () => {
    const onStop = vi.fn(() => deferred().promise);
    render(<RunLocallyControls state="running" onStart={vi.fn()} onStop={onStop} />);
    const stop = screen.getByRole("button", { name: "Stop" });

    fireEvent.click(stop);
    fireEvent.click(stop);

    expect(screen.getByRole("button", { name: /Stopping/ })).toBeDisabled();
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
