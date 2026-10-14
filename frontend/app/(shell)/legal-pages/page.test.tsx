import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellProvider } from "@/lib/layout/ShellContext";

const { sessionRole } = vi.hoisted(() => ({ sessionRole: { current: "super_admin" as string | undefined } }));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ user: { role: sessionRole.current } }),
}));

const { termsDirtySetter, privacyDirtySetter } = vi.hoisted(() => ({
  termsDirtySetter: { current: (d: boolean) => { void d; } },
  privacyDirtySetter: { current: (d: boolean) => { void d; } },
}));

vi.mock("@/components/legal/LegalPageEditor", () => ({
  LegalPageEditor: ({ slug, active, onDirtyChange }: { slug: string; active?: boolean; onDirtyChange?: (d: boolean) => void }) => {
    if (onDirtyChange) (slug === "terms" ? termsDirtySetter : privacyDirtySetter).current = onDirtyChange;
    return <div data-active={active ? "yes" : "no"}>{slug === "terms" ? "Terms editor" : "Privacy editor"}</div>;
  },
}));

import LegalPagesAdminPage from "./page";

function renderPage() {
  return render(
    <ShellProvider>
      <LegalPagesAdminPage />
    </ShellProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionRole.current = "super_admin";
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("LegalPagesAdminPage", () => {
  it("shows the Terms tab by default, with the Privacy editor mounted but hidden", () => {
    renderPage();
    expect(screen.getByText("Terms editor")).toBeVisible();
    expect(screen.getByText("Terms editor")).toHaveAttribute("data-active", "yes");
    expect(screen.getByText("Privacy editor", { selector: "div" })).not.toBeVisible();
    expect(screen.getByRole("tab", { name: "Terms of Service" })).toHaveAttribute("aria-selected", "true");
  });

  it("switches tabs without asking, even with unsaved changes — the hidden editor keeps its work", async () => {
    const user = userEvent.setup();
    renderPage();
    act(() => termsDirtySetter.current(true));

    await user.click(screen.getByRole("tab", { name: /Privacy Policy/ }));

    expect(window.confirm).not.toHaveBeenCalled();
    expect(screen.getByText("Privacy editor")).toBeVisible();
    expect(screen.getByText("Privacy editor")).toHaveAttribute("data-active", "yes");
    expect(screen.getByText("Terms editor")).toHaveAttribute("data-active", "no");
  });

  it("marks a tab with unsaved changes", () => {
    renderPage();
    act(() => privacyDirtySetter.current(true));
    expect(screen.getByRole("tab", { name: /Privacy Policy/ })).toContainElement(screen.getByRole("img", { name: "unsaved changes" }));
  });

  it("asks before following an in-app link while anything is unsaved", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderPage();
    act(() => termsDirtySetter.current(true));
    const link = document.createElement("a");
    link.href = "/overview";
    link.textContent = "Overview";
    document.body.appendChild(link);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(window.confirm).toHaveBeenCalledWith("You have unsaved changes on the legal pages. Leave without saving?");
    expect(event.defaultPrevented).toBe(true);
    link.remove();
  });

  it("passes each editor the same onDirtyChange reference across re-renders", async () => {
    // Each editor's `useEffect(() => onDirtyChange?.(unsaved), [unsaved, onDirtyChange])`
    // re-fires whenever this identity changes; an inline arrow here would loop
    // ("Maximum update depth exceeded").
    const user = userEvent.setup();
    renderPage();
    const firstTerms = termsDirtySetter.current;
    const firstPrivacy = privacyDirtySetter.current;
    await user.click(screen.getByRole("tab", { name: /Privacy Policy/ }));
    await user.click(screen.getByRole("tab", { name: /Terms of Service/ }));
    expect(termsDirtySetter.current).toBe(firstTerms);
    expect(privacyDirtySetter.current).toBe(firstPrivacy);
  });
});
