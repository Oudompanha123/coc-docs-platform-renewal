import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(searchParamsString),
}));

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));

const { useAxRenewalProjectContext } = vi.hoisted(() => ({ useAxRenewalProjectContext: vi.fn() }));
vi.mock("@/lib/ax-renewal/AxRenewalProjectContext", () => ({ useAxRenewalProjectContext }));

vi.mock("@/lib/ax-renewal/api", () => ({
  addComment: vi.fn(),
  chatWithAssistant: vi.fn(),
  confirmSection: vi.fn(),
  deleteComment: vi.fn(),
  reopenSection: vi.fn(),
  runAnalysis: vi.fn(),
  startImplementation: vi.fn(),
  // Added with the engine banner (ADR-043): the panel asks on mount whether
  // a model is connected. Resolving "not connected" keeps these tests on the
  // branch they were written for -- the banner they assert nothing about.
  fetchEngineStatus: vi.fn().mockResolvedValue({ connected: false, readsSource: false }),
}));

import {
  addComment,
  chatWithAssistant,
  confirmSection,
  deleteComment,
  fetchEngineStatus,
} from "@/lib/ax-renewal/api";
import { AxAssistantPanel } from "./AxAssistantPanel";
import type { AxRenewalProjectDetail } from "@/lib/ax-renewal/api";

/** Set by each test before rendering — read by the next/navigation mock above. */
let searchParamsString = "";

function detailFixture(): AxRenewalProjectDetail {
  return {
    project: {
      id: "p1",
      name: "Sample Project",
      description: null,
      status: "draft",
      manifestFilename: null,
      manifestAttachedAt: null,
      attachStats: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    analysis: null,
    stackLayers: [],
    architecture: null,
    pageMappings: [],
    dbChanges: [],
    dbConnection: null,
    destination: null,
    confirmations: {},
    latestImplementationRun: null,
    comments: [],
  };
}

describe("AxAssistantPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders 'no tab open' instead of crashing once every tab has been closed (section=none)", () => {
    // Reproduces the reported bug exactly: closing the last open tab
    // navigates to the shared NO_TAB_OPEN sentinel ("none"), and this panel
    // used to resolve `active` with its own `?? "attach"` fallback instead
    // of going through resolveActiveSection — so EXPLORER_META["none"] came
    // back undefined and reading `.group` off it threw.
    searchParamsString = "project=p1&section=none";
    useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
    useAxRenewalProjectContext.mockReturnValue({
      projectId: "p1",
      detail: detailFixture(),
      refresh: vi.fn(),
    });

    expect(() => render(<AxAssistantPanel />)).not.toThrow();
    expect(screen.getByText("no tab open")).toBeInTheDocument();
  });

  it("still renders its normal 'reading/acting on' header for a real open tab", () => {
    searchParamsString = "project=p1&section=attach";
    useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
    useAxRenewalProjectContext.mockReturnValue({
      projectId: "p1",
      detail: detailFixture(),
      refresh: vi.fn(),
    });

    render(<AxAssistantPanel />);
    expect(screen.getByText("understand / attach source")).toBeInTheDocument();
  });

  // The banner is the one line in this panel whose job is to be honest about
  // what the assistant can do, so each state gets pinned. It used to assert
  // "No model connected" unconditionally — true of every deployment, wrong on
  // a machine with a local Claude Code installation (ADR-043).
  describe("engine banner", () => {
    function renderWithEngine(engine: { connected: boolean; readsSource: boolean }) {
      vi.mocked(fetchEngineStatus).mockResolvedValue(engine);
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
      useAxRenewalProjectContext.mockReturnValue({
        projectId: "p1",
        detail: detailFixture(),
        refresh: vi.fn(),
      });
      render(<AxAssistantPanel />);
    }

    it("offers 'connect' when no model answers", async () => {
      renderWithEngine({ connected: false, readsSource: false });

      expect(await screen.findByText(/No model connected/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "connect" })).toBeInTheDocument();
    });

    it("says the source is read when the local model can see it", async () => {
      renderWithEngine({ connected: true, readsSource: true });

      expect(await screen.findByText(/Local model in use/)).toBeInTheDocument();
      expect(screen.getByText("reads your source")).toBeInTheDocument();
      // Nothing left to connect, so the button that offers it must be gone.
      expect(screen.queryByRole("button", { name: "connect" })).not.toBeInTheDocument();
    });

    it("does not claim the source was read when only the manifest was", async () => {
      // The distinction that matters: a connected model which has seen one
      // dependency file must never read as one that reviewed the codebase.
      renderWithEngine({ connected: true, readsSource: false });

      expect(await screen.findByText("reads the manifest only")).toBeInTheDocument();
      expect(screen.queryByText("reads your source")).not.toBeInTheDocument();
    });

    it("says nothing at all until the answer is known", () => {
      // A flash of "no model connected" that corrects itself would teach
      // people to distrust the line that exists to be trusted.
      vi.mocked(fetchEngineStatus).mockReturnValue(new Promise(() => {}));
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
      useAxRenewalProjectContext.mockReturnValue({
        projectId: "p1",
        detail: detailFixture(),
        refresh: vi.fn(),
      });

      render(<AxAssistantPanel />);

      expect(screen.queryByText(/No model connected/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Local model in use/)).not.toBeInTheDocument();
    });
  });

  // "Stop using" is deliberately not "disconnect". The path in .env.local is
  // untouched and the backend could still spawn the CLI — all this does is
  // stop asking for it, which is the only thing a web page honestly can do
  // about configuration it cannot edit (ADR-043).
  describe("stop using / use it", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    function renderConnected() {
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: true, readsSource: true });
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
      useAxRenewalProjectContext.mockReturnValue({
        projectId: "p1",
        detail: detailFixture(),
        refresh: vi.fn(),
      });
      render(<AxAssistantPanel />);
    }

    it("offers to stop using a model that is in use", async () => {
      renderConnected();

      expect(await screen.findByRole("button", { name: "stop using" })).toBeInTheDocument();
    });

    it("switches to the keyword analysis, and says the model is still there", async () => {
      renderConnected();

      (await screen.findByRole("button", { name: "stop using" })).click();

      // Not "disconnected": nothing was disconnected from anything.
      expect(await screen.findByText(/A model is available/)).toBeInTheDocument();
      expect(screen.getByText("not using it here")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "use it" })).toBeInTheDocument();
    });

    it("remembers the choice for the next visit", async () => {
      renderConnected();

      (await screen.findByRole("button", { name: "stop using" })).click();
      await screen.findByText(/A model is available/);

      expect(localStorage.getItem("coc-ax-renewal-use-model")).toBe("false");
    });

    it("turns it back on, leaving nothing behind in storage", async () => {
      localStorage.setItem("coc-ax-renewal-use-model", "false");
      renderConnected();

      (await screen.findByRole("button", { name: "use it" })).click();

      expect(await screen.findByText(/Local model in use/)).toBeInTheDocument();
      // Removed rather than set to "true": the default is to use it, and a
      // stored "true" would be a second way of saying the same thing.
      expect(localStorage.getItem("coc-ax-renewal-use-model")).toBeNull();
    });

    it("offers neither button when there is no model to use", async () => {
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: false, readsSource: false });
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
      useAxRenewalProjectContext.mockReturnValue({
        projectId: "p1",
        detail: detailFixture(),
        refresh: vi.fn(),
      });

      render(<AxAssistantPanel />);

      expect(await screen.findByRole("button", { name: "connect" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "stop using" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "use it" })).not.toBeInTheDocument();
    });
  });

  // Chat is the one thing in this workspace that deliberately persists
  // nothing (ADR-044). Each test here pins one half of that promise: the
  // reply reaches the panel, and nothing on the way there writes a row.
  describe("chat with the local model", () => {
    beforeEach(() => localStorage.clear());

    async function renderChatReady(engine = { connected: true, readsSource: true }) {
      vi.mocked(fetchEngineStatus).mockResolvedValue(engine);
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
      useAxRenewalProjectContext.mockReturnValue({
        projectId: "p1",
        detail: detailFixture(),
        refresh: vi.fn(),
      });
      render(<AxAssistantPanel />);
      if (engine.connected) {
        (await screen.findByRole("tab", { name: "chat" })).click();
      }
    }

    function send(message: string) {
      const box = screen.getByRole("textbox");
      fireEvent.change(box, { target: { value: message } });
      fireEvent.submit(box.closest("form")!);
    }

    it("is not offered where no model can answer", async () => {
      await renderChatReady({ connected: false, readsSource: false });

      expect(await screen.findByText(/No model connected/)).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "chat" })).not.toBeInTheDocument();
    });

    it("says plainly that the conversation is not saved", async () => {
      await renderChatReady();

      expect(await screen.findByText(/Not saved/)).toBeInTheDocument();
    });

    it("shows what was asked and what the model answered", async () => {
      vi.mocked(chatWithAssistant).mockResolvedValue({ reply: "It runs on PHP 5.6.", readSource: true });
      await renderChatReady();

      send("what does this run on?");

      expect(await screen.findByText("It runs on PHP 5.6.")).toBeInTheDocument();
      expect(screen.getByText("what does this run on?")).toBeInTheDocument();
    });

    it("writes nothing — a chat message is not a comment", async () => {
      vi.mocked(chatWithAssistant).mockResolvedValue({ reply: "ok", readSource: false });
      await renderChatReady();

      send("anything at all");

      await screen.findByText("ok");
      expect(addComment).not.toHaveBeenCalled();
    });

    it("does not execute a command typed into chat", async () => {
      // The trap this mode has to avoid: "confirm pages" is a question here,
      // not a confirmation. A mode that could silently change the project
      // would be worse than having no chat.
      vi.mocked(chatWithAssistant).mockResolvedValue({ reply: "That would confirm the Pages section.", readSource: false });
      await renderChatReady();

      send("confirm pages");

      await screen.findByText("That would confirm the Pages section.");
      expect(confirmSection).not.toHaveBeenCalled();
    });

    it("replays the conversation, since the backend keeps none of it", async () => {
      vi.mocked(chatWithAssistant)
        .mockResolvedValueOnce({ reply: "PHP 5.6.", readSource: false })
        .mockResolvedValueOnce({ reply: "Released in 2014.", readSource: false });
      await renderChatReady();

      send("what does it run on?");
      await screen.findByText("PHP 5.6.");
      send("how old is that?");
      await screen.findByText("Released in 2014.");

      await waitFor(() => expect(chatWithAssistant).toHaveBeenCalledTimes(2));
      const secondCall = vi.mocked(chatWithAssistant).mock.calls[1];
      expect(secondCall).toBeDefined();
      const [, message, history] = secondCall!;
      expect(message).toBe("how old is that?");
      expect(history).toEqual([
        { role: "you", text: "what does it run on?" },
        { role: "assistant", text: "PHP 5.6." },
      ]);
    });

    it("reports a refusal instead of a silent nothing", async () => {
      vi.mocked(chatWithAssistant).mockRejectedValue(new Error("the assistant is already answering"));
      await renderChatReady();

      send("hello");

      expect(await screen.findByText(/the assistant is already answering/)).toBeInTheDocument();
    });

    it("withdraws chat when the model is set aside", async () => {
      await renderChatReady();

      // "stop using" means the panel stops asking for the model at all —
      // leaving a chat tab that would now 409 would contradict that.
      (await screen.findByRole("button", { name: "stop using" })).click();

      await waitFor(() => expect(screen.queryByRole("tab", { name: "chat" })).not.toBeInTheDocument());
      expect(screen.queryByText(/Not saved/)).not.toBeInTheDocument();
    });
  });

  // A comment used to be write-once with no way back (ADR-045). Remove is
  // soft server-side; what these pin is that it is offered to the right
  // people and never fires on one click.
  describe("removing a comment", () => {
    function renderThreadWith(
      comments: { id: string; authorId: string; authorName: string; body: string; createdAt: string }[],
      me: { id: string; role: string },
    ) {
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: false, readsSource: false });
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { id: me.id, role: me.role, roles: [] } });
      const detail = detailFixture();
      detail.comments = comments;
      useAxRenewalProjectContext.mockReturnValue({ projectId: "p1", detail, refresh: vi.fn() });
      render(<AxAssistantPanel />);
    }

    const mine = {
      id: "c1",
      authorId: "u1",
      authorName: "Me",
      body: "typo here",
      createdAt: "2026-01-01T00:00:00Z",
    };
    const theirs = {
      id: "c2",
      authorId: "u2",
      authorName: "Someone else",
      body: "their remark",
      createdAt: "2026-01-01T00:00:00Z",
    };

    it("offers Remove on your own comment", () => {
      renderThreadWith([mine], { id: "u1", role: "user" });

      expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    });

    it("does not offer it on somebody else's", () => {
      renderThreadWith([theirs], { id: "u1", role: "admin" });

      // Admin is not enough — an Admin out-ranks a user but does not own
      // their words. Only the author or a super_admin, same as the backend.
      expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    });

    it("offers it to a super admin on anybody's comment", () => {
      renderThreadWith([theirs], { id: "u1", role: "super_admin" });

      expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    });

    it("takes two presses, and the first one changes nothing", () => {
      renderThreadWith([mine], { id: "u1", role: "user" });

      fireEvent.click(screen.getByRole("button", { name: "Remove" }));

      expect(deleteComment).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Really remove" })).toBeInTheDocument();
    });

    it("removes it on the second press", async () => {
      vi.mocked(deleteComment).mockResolvedValue(undefined);
      renderThreadWith([mine], { id: "u1", role: "user" });

      fireEvent.click(screen.getByRole("button", { name: "Remove" }));
      fireEvent.click(screen.getByRole("button", { name: "Really remove" }));

      await waitFor(() => expect(deleteComment).toHaveBeenCalledWith("p1", "c1"));
      expect(await screen.findByText(/comment removed/)).toBeInTheDocument();
    });

    it("lets you back out after the first press", () => {
      renderThreadWith([mine], { id: "u1", role: "user" });

      fireEvent.click(screen.getByRole("button", { name: "Remove" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(deleteComment).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    });

    it("says so when the server refuses", async () => {
      vi.mocked(deleteComment).mockRejectedValue(
        new Error("only its author or a super admin can remove a comment"),
      );
      renderThreadWith([mine], { id: "u1", role: "user" });

      fireEvent.click(screen.getByRole("button", { name: "Remove" }));
      fireEvent.click(screen.getByRole("button", { name: "Really remove" }));

      expect(await screen.findByText(/only its author or a super admin/)).toBeInTheDocument();
    });
  });
});
