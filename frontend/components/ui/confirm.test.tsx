import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmProvider, useConfirm } from "./confirm";

function Asker({ destructive }: { destructive?: boolean }) {
  const confirm = useConfirm();
  const [answer, setAnswer] = useState<string>("none");
  return (
    <>
      <button
        type="button"
        onClick={async () => setAnswer(String(await confirm({ title: "Remove this step?", description: "It can't be undone.", confirmLabel: "Remove", destructive })))}
      >
        Ask
      </button>
      <output>{answer}</output>
    </>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("useConfirm", () => {
  it("asks in the app's own dialog and resolves true on the action", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmProvider>
        <Asker />
      </ConfirmProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));
    const dialog = screen.getByRole("alertdialog", { name: "Remove this step?" });
    expect(dialog).toHaveTextContent("It can't be undone.");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("true"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("resolves false on Cancel and on Escape, and starts focus on Cancel", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmProvider>
        <Asker destructive />
      </ConfirmProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("false"));

    await user.click(screen.getByRole("button", { name: "Ask" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("false");
  });

  it("without a provider it falls back to window.confirm", async () => {
    const native = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<Asker />);
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(native).toHaveBeenCalledWith("Remove this step?\n\nIt can't be undone.");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("true"));
  });
});
