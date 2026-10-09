import { render, screen } from "@testing-library/react";
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

vi.mock("@/components/legal/TermsDocumentEditor", () => ({
  TermsDocumentEditor: ({ onDirtyChange }: { canEdit: boolean; onDirtyChange?: (d: boolean) => void }) => {
    if (onDirtyChange) termsDirtySetter.current = onDirtyChange;
    return <div>Terms editor</div>;
  },
}));
vi.mock("@/components/legal/PrivacyLegalPageEditor", () => ({
  PrivacyLegalPageEditor: ({ onDirtyChange }: { canEdit: boolean; onDirtyChange?: (d: boolean) => void }) => {
    if (onDirtyChange) privacyDirtySetter.current = onDirtyChange;
    return <div>Privacy editor</div>;
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
  it("shows the Terms tab by default", () => {
    renderPage();
    expect(screen.getByText("Terms editor")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Terms of Service" })).toHaveAttribute("aria-selected", "true");
  });

  it("switches to the Privacy tab", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("tab", { name: "Privacy Policy" }));

    expect(screen.getByText("Privacy editor")).toBeInTheDocument();
    expect(screen.queryByText("Terms editor")).not.toBeInTheDocument();
  });

  it("confirms before switching away from a tab with unsaved changes", async () => {
    const user = userEvent.setup();
    renderPage();
    termsDirtySetter.current(true);

    await user.click(screen.getByRole("tab", { name: "Privacy Policy" }));

    expect(window.confirm).toHaveBeenCalledWith("You have unsaved changes. Switch pages without saving?");
    expect(screen.getByText("Privacy editor")).toBeInTheDocument();
  });

  it("does not switch tabs when the confirmation is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderPage();
    termsDirtySetter.current(true);

    await user.click(screen.getByRole("tab", { name: "Privacy Policy" }));

    expect(screen.getByText("Terms editor")).toBeInTheDocument();
  });

  it("does not ask for confirmation when the active tab has no unsaved changes", async () => {
    const user = userEvent.setup();
    renderPage();
    termsDirtySetter.current(false);

    await user.click(screen.getByRole("tab", { name: "Privacy Policy" }));

    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("passes each editor the same onDirtyChange reference across re-renders", async () => {
    // Regression test: each editor's own `useEffect(() => onDirtyChange?.
    // (unsaved), [unsaved, onDirtyChange])` re-fires whenever this identity
    // changes. A page.tsx that passed an inline arrow instead of a `useCallback`
    // (as this one briefly did) hands down a NEW function every render, which
    // re-fires that effect, which calls `setDirty` here, which re-renders this
    // page with yet another new arrow — "Maximum update depth exceeded" in a
    // real browser. The two mocked editors above only capture whichever
    // reference they were LAST given, which can't tell a stable prop from an
    // unstable one the way this identity check can.
    const user = userEvent.setup();
    renderPage();
    const firstTerms = termsDirtySetter.current;

    // Privacy's editor isn't mounted until its tab is first opened, so its
    // own captured reference only becomes meaningful from here on.
    await user.click(screen.getByRole("tab", { name: "Privacy Policy" }));
    const firstPrivacy = privacyDirtySetter.current;
    await user.click(screen.getByRole("tab", { name: "Terms of Service" }));
    await user.click(screen.getByRole("tab", { name: "Privacy Policy" }));

    expect(termsDirtySetter.current).toBe(firstTerms);
    expect(privacyDirtySetter.current).toBe(firstPrivacy);
  });
});
