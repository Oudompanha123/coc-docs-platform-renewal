import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AxRenewalProject } from "@/lib/ax-renewal/api";
import { ProjectSwitcher } from "./ProjectSwitcher";

/**
 * The switcher lists exactly what the backend served (ADR-070) — which, for
 * everyone but a super admin, is only the projects they are a member of.
 * Mine / All is a super-admin-only convenience over that list; it never
 * decides what may be seen.
 */
describe("ProjectSwitcher", () => {
  function project(id: string, name: string, member: boolean): AxRenewalProject {
    return {
      id,
      name,
      description: null,
      status: "draft",
      manifestFilename: null,
      manifestAttachedAt: null,
      attachStats: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      revision: 0,
      member,
    };
  }

  const mine = project("p1", "Billing Portal", true);
  const alsoMine = project("p3", "Payroll", true);
  const theirs = project("p2", "HR Legacy", false);

  function open(projects: AxRenewalProject[], projectId: string | null = null) {
    render(<ProjectSwitcher projects={projects} projectId={projectId} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));
  }

  function optionNames(): string[] {
    return screen.queryAllByRole("option").map((o) => o.textContent ?? "");
  }

  describe("for a member (everything served is theirs)", () => {
    it("lists every project it was given, with no Mine / All toggle — the two would be the same list", () => {
      open([mine, alsoMine]);

      expect(optionNames()).toEqual(["Billing Portal", "Payroll"]);
      expect(screen.queryByRole("group", { name: "Which projects to list" })).not.toBeInTheDocument();
    });

    it("has nothing to open when the caller is on no project", () => {
      render(<ProjectSwitcher projects={[]} projectId={null} onSelect={vi.fn()} />);

      const trigger = screen.getByRole("button", { expanded: false });
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveTextContent("No projects yet");
    });
  });

  describe("for a super admin (served every project, on some of them)", () => {
    it("opens on Mine when they are on at least one project", () => {
      open([mine, theirs]);

      expect(screen.getByRole("button", { name: "Mine" })).toHaveAttribute("aria-pressed", "true");
      expect(optionNames()).toEqual(["Billing Portal"]);
    });

    it("shows every project under All", () => {
      open([mine, theirs]);

      fireEvent.click(screen.getByRole("button", { name: "All" }));

      expect(optionNames()).toEqual(["Billing Portal", "HR Legacy"]);
    });

    it("opens on All when they are on no project, rather than an empty list", () => {
      open([theirs]);

      expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
      expect(optionNames()).toEqual(["HR Legacy"]);
    });

    it("says so when Mine is chosen and there is nothing in it", () => {
      open([theirs]);

      fireEvent.click(screen.getByRole("button", { name: "Mine" }));

      expect(optionNames()).toEqual([]);
      expect(screen.getByText(/not a member of any project yet/)).toBeInTheDocument();
    });

    it("still names the open project even when Mine hides it", () => {
      render(<ProjectSwitcher projects={[mine, theirs]} projectId="p2" onSelect={vi.fn()} />);

      expect(screen.getByRole("button", { expanded: false })).toHaveTextContent("HR Legacy");
    });
  });
});
