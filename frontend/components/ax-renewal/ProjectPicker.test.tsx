import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ax-renewal/api", () => ({
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
}));

vi.mock("@/lib/ax-renewal/engine-preference", () => ({
  writeSourcePathOverride: vi.fn(),
}));

import { createProject, deleteProject, updateProject, type AxRenewalProject } from "@/lib/ax-renewal/api";
import { writeSourcePathOverride } from "@/lib/ax-renewal/engine-preference";
import { ProjectPicker } from "./ProjectPicker";

function project(overrides: Partial<AxRenewalProject> = {}): AxRenewalProject {
  return {
    id: "p1",
    name: "Legacy Portal",
    description: null,
    status: "draft",
    manifestFilename: null,
    manifestAttachedAt: null,
    attachStats: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    revision: 0,
    member: true,
    ...overrides,
  };
}

describe("ProjectPicker", () => {
  it("offers neither New project nor Delete project to somebody who can't edit", () => {
    render(
      <ProjectPicker
        projects={[project()]}
        projectId="p1"
        canEdit={false}
        onSelect={vi.fn()}
        onCreated={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "New project" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete project" })).not.toBeInTheDocument();
  });

  it("does not offer Delete project when no project is selected yet", () => {
    render(
      <ProjectPicker
        projects={[]}
        projectId={null}
        canEdit={true}
        onSelect={vi.fn()}
        onCreated={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete project" })).not.toBeInTheDocument();
  });

  describe("deleting the open project", () => {
    function renderWithOneProject() {
      render(
        <ProjectPicker
          projects={[project()]}
          projectId="p1"
          canEdit={true}
          onSelect={vi.fn()}
          onCreated={vi.fn()}
          onDeleted={vi.fn()}
        />,
      );
    }

    it("takes two presses, and the first one opens a confirmation popup that changes nothing yet", () => {
      renderWithOneProject();

      fireEvent.click(screen.getByRole("button", { name: "Delete project" }));

      expect(deleteProject).not.toHaveBeenCalled();
      const dialog = screen.getByRole("dialog", { name: "Delete project" });
      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
      expect(screen.getByText(/can.?t be undone/)).toBeInTheDocument();
    });

    it("lets you back out with Cancel", () => {
      renderWithOneProject();

      fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(deleteProject).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete project" })).toBeInTheDocument();
    });

    it("closes on a click outside the card (the backdrop)", () => {
      renderWithOneProject();

      fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
      fireEvent.click(screen.getByRole("dialog", { name: "Delete project" }));

      expect(deleteProject).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on Escape", () => {
      renderWithOneProject();

      fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
      fireEvent.keyDown(document, { key: "Escape" });

      expect(deleteProject).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // ADR-072: nothing of a deleted project is kept, the browser included.
    it("forgets the source path this browser saved for the project once it is deleted", async () => {
      vi.mocked(deleteProject).mockResolvedValue(undefined);
      renderWithOneProject();

      fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
      fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

      await waitFor(() => expect(writeSourcePathOverride).toHaveBeenCalledWith("p1", ""));
    });

    it("keeps that saved path when the delete is refused — the project still exists", async () => {
      vi.mocked(writeSourcePathOverride).mockClear();
      vi.mocked(deleteProject).mockRejectedValue(new Error("stop the local run before deleting this project"));
      renderWithOneProject();

      fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
      fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("stop the local run");
      expect(writeSourcePathOverride).not.toHaveBeenCalled();
    });

    it("deletes on the second press, tells the caller, and shows a success message", async () => {
      vi.mocked(deleteProject).mockResolvedValue(undefined);
      const onDeleted = vi.fn();
      render(
        <ProjectPicker
          projects={[project()]}
          projectId="p1"
          canEdit={true}
          onSelect={vi.fn()}
          onCreated={vi.fn()}
          onDeleted={onDeleted}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
      fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

      await waitFor(() => expect(deleteProject).toHaveBeenCalledWith("p1"));
      await waitFor(() => expect(onDeleted).toHaveBeenCalled());
      expect(await screen.findByRole("status")).toHaveTextContent("Project deleted successfully");
    });

    it("regression: does not stay stuck on 'Deleting…' once a different project becomes active afterward", async () => {
      // What the real page does on a successful delete: re-fetch the
      // project list and clear the `project=` query param, which can land
      // on a *different* remaining project rather than none at all. Without
      // a `key` tying the confirm popup to the project it is about, React
      // would keep reusing the same popup instance — including its stale
      // `busy`/`confirming` state — for whatever project is active now.
      vi.mocked(deleteProject).mockResolvedValue(undefined);
      const { rerender } = render(
        <ProjectPicker
          projects={[project()]}
          projectId="p1"
          canEdit={true}
          onSelect={vi.fn()}
          onCreated={vi.fn()}
          onDeleted={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
      fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));
      await waitFor(() => expect(deleteProject).toHaveBeenCalledWith("p1"));

      const otherProject = project({ id: "p2", name: "Another Project" });
      rerender(
        <ProjectPicker
          projects={[otherProject]}
          projectId="p2"
          canEdit={true}
          onSelect={vi.fn()}
          onCreated={vi.fn()}
          onDeleted={vi.fn()}
        />,
      );

      expect(screen.queryByText("Deleting…")).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      const freshButton = screen.getByRole("button", { name: "Delete project" });
      expect(freshButton).toBeEnabled();

      // And it works correctly for the new project, not stuck on the old one.
      fireEvent.click(freshButton);
      const newDialog = screen.getByRole("dialog", { name: "Delete project" });
      expect(newDialog).toHaveTextContent("Another Project");
      fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));
      await waitFor(() => expect(deleteProject).toHaveBeenCalledWith("p2"));
    });

    it("says so when the server refuses, and does not report success", async () => {
      vi.mocked(deleteProject).mockRejectedValue(
        new Error("cancel or resolve the active implementation run before deleting this project"),
      );
      const onDeleted = vi.fn();
      render(
        <ProjectPicker
          projects={[project()]}
          projectId="p1"
          canEdit={true}
          onSelect={vi.fn()}
          onCreated={vi.fn()}
          onDeleted={onDeleted}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
      fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

      expect(await screen.findByText(/active implementation run/)).toBeInTheDocument();
      expect(onDeleted).not.toHaveBeenCalled();
      // The popup stays open on failure — there is still a "Delete project?" decision to make.
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    describe("the success message", () => {
      beforeEach(() => vi.useFakeTimers());
      afterEach(() => vi.useRealTimers());

      it("clears itself after a few seconds", async () => {
        vi.mocked(deleteProject).mockResolvedValue(undefined);
        render(
          <ProjectPicker
            projects={[project()]}
            projectId="p1"
            canEdit={true}
            onSelect={vi.fn()}
            onCreated={vi.fn()}
            onDeleted={vi.fn()}
          />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Delete project" }));
        await vi.waitFor(() => fireEvent.click(screen.getByRole("button", { name: "Yes, delete" })));
        await vi.waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());

        act(() => vi.advanceTimersByTime(5000));

        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });
  });

  it("creates a project and reports it to the caller", async () => {
    vi.mocked(createProject).mockResolvedValue(project({ id: "p2", name: "New One" }));
    const onCreated = vi.fn();
    render(
      <ProjectPicker
        projects={[]}
        projectId={null}
        canEdit={true}
        onSelect={vi.fn()}
        onCreated={onCreated}
        onDeleted={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New project" }));
    fireEvent.change(screen.getByPlaceholderText("Project name"), { target: { value: "New One" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createProject).toHaveBeenCalledWith("New One", null));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(project({ id: "p2", name: "New One" })));
  });
});

/** Renaming a project and editing its description (ADR-076). */
describe("ProjectPicker editing a project's details", () => {
  function renderPicker(options: { canDelete?: boolean; onUpdated?: (p: AxRenewalProject) => void } = {}) {
    render(
      <ProjectPicker
        projects={[project({ description: "Old notes" })]}
        projectId="p1"
        canEdit={true}
        canDelete={options.canDelete ?? true}
        onSelect={vi.fn()}
        onCreated={vi.fn()}
        onDeleted={vi.fn()}
        onUpdated={options.onUpdated}
      />,
    );
  }

  it("shows the project's description", () => {
    renderPicker();

    expect(screen.getByText("Old notes")).toBeInTheDocument();
  });

  it("is not offered to someone who may not change the project", () => {
    renderPicker({ canDelete: false });

    expect(screen.queryByRole("button", { name: "Edit details" })).not.toBeInTheDocument();
  });

  it("opens filled with the current name and description", () => {
    renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "Edit details" }));

    expect(screen.getByRole("dialog", { name: "Edit project details" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Legacy Portal");
    expect(screen.getByLabelText(/Description/)).toHaveValue("Old notes");
  });

  it("saves the trimmed name, clears a blanked description, and hands back the result", async () => {
    const renamed = project({ name: "Legacy Portal v2", description: null });
    vi.mocked(updateProject).mockResolvedValue(renamed);
    const onUpdated = vi.fn();
    renderPicker({ onUpdated });

    fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Legacy Portal v2  " } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateProject).toHaveBeenCalledWith("p1", "Legacy Portal v2", null));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(renamed));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("refuses a blank name without calling the server", () => {
    vi.mocked(updateProject).mockClear();
    renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } });
    fireEvent.submit(screen.getByRole("dialog", { name: "Edit project details" }).querySelector("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent("needs a name");
    expect(updateProject).not.toHaveBeenCalled();
  });

  it("keeps the dialog open with the reason when the save is refused", async () => {
    vi.mocked(updateProject).mockRejectedValue(new Error("project not found"));
    renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("project not found");
    expect(screen.getByRole("dialog", { name: "Edit project details" })).toBeInTheDocument();
  });

  it("backs out on Cancel without saving", () => {
    vi.mocked(updateProject).mockClear();
    renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(updateProject).not.toHaveBeenCalled();
  });
});
