import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PagesSection } from "./PagesSection";

/**
 * A refused Confirm must be visible (ADR-067). Confirm used to be
 * fire-and-forget, which was harmless while it could only fail on a network
 * error — but a teammate's save in between now makes it a real, expected
 * 409, and a sign-off that silently did nothing would leave the person
 * believing the section was confirmed.
 *
 * PagesSection stands in for all four plan sections: StackMove,
 * Architecture and Database share the same handleConfirm shape.
 */
describe("PagesSection confirm", () => {
  const saved = [{ oldPath: "/old", newPath: "/new", notes: null, position: 0 }];

  function renderSection(onConfirm: () => Promise<void>) {
    render(
      <PagesSection
        pages={saved}
        analysis={null}
        confirmation={undefined}
        canEdit
        canConfirm
        onSave={vi.fn()}
        onConfirm={onConfirm}
        onReopen={vi.fn()}
      />,
    );
  }

  it("shows the reason a confirm was refused on the section's error line", async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValue(new Error("this project's plan was changed by someone else since you opened it. Reload"));
    renderSection(onConfirm);

    fireEvent.click(screen.getByRole("button", { name: "Confirm Pages" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("changed by someone else");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("stays busy until the confirm has actually finished, then releases the button", async () => {
    let finish: () => void = () => {};
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    renderSection(onConfirm);

    fireEvent.click(screen.getByRole("button", { name: "Confirm Pages" }));
    expect(await screen.findByRole("button", { name: "Confirming…" })).toBeDisabled();

    finish();
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm Pages" })).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
