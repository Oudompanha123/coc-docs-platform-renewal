import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AxRenewalAnalysis } from "@/lib/ax-renewal/api";
import { resetUnsavedForTests, unsavedSections } from "@/lib/ax-renewal/unsavedChanges";
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

/**
 * Leaving with unsaved edits (ADR-075): the section tells the workspace it has
 * something to lose — and only when the person actually changed something.
 */
describe("PagesSection unsaved-edits warning", () => {
  afterEach(() => resetUnsavedForTests());

  function renderWith(pages: { oldPath: string; newPath: string; notes: null; position: number }[], analysis: AxRenewalAnalysis | null) {
    render(
      <PagesSection
        pages={pages}
        analysis={analysis}
        confirmation={undefined}
        canEdit
        canConfirm
        onSave={vi.fn()}
        onConfirm={vi.fn()}
        onReopen={vi.fn()}
      />,
    );
  }

  it("registers once a saved mapping is edited", () => {
    renderWith([{ oldPath: "/old", newPath: "/new", notes: null, position: 0 }], null);
    expect(unsavedSections()).toEqual([]);

    fireEvent.change(screen.getByDisplayValue("/new"), { target: { value: "/newer" } });

    expect(unsavedSections()).toEqual(["Pages"]);
  });

  it("does not warn about a suggestion nobody has touched", () => {
    // Nothing saved yet, so the rows shown come from analysis — unsaved, but
    // not anybody's edits, and leaving loses nothing worth asking about.
    const analysis = { pagesDetected: [{ path: "/products", purpose: "catalogue" }] } as unknown as AxRenewalAnalysis;
    renderWith([], analysis);

    expect(screen.getByDisplayValue("/products")).toBeInTheDocument();
    expect(unsavedSections()).toEqual([]);
  });

  it("warns once that suggestion is edited", () => {
    const analysis = { pagesDetected: [{ path: "/products", purpose: "catalogue" }] } as unknown as AxRenewalAnalysis;
    renderWith([], analysis);

    fireEvent.change(screen.getAllByPlaceholderText("New route")[0]!, { target: { value: "/shop" } });

    expect(unsavedSections()).toEqual(["Pages"]);
  });
});
