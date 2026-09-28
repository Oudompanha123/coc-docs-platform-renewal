import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ax-renewal/api", () => ({
  createProject: vi.fn(),
  deleteProject: vi.fn(),
}));

import { createProject, deleteProject, type AxRenewalProject } from "@/lib/ax-renewal/api";
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
