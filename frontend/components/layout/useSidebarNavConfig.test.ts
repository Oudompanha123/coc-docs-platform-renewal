import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSidebarNavConfig } from "./useSidebarNavConfig";
import type { NavGroupConfig, NavItemOverrideConfig } from "@/lib/docs/nav-api";

const { fetchAdminNavConfig, updateNavItemOverride, createNavGroup, renameNavGroup, deleteNavGroup } = vi.hoisted(() => ({
  fetchAdminNavConfig: vi.fn(),
  updateNavItemOverride: vi.fn(),
  createNavGroup: vi.fn(),
  renameNavGroup: vi.fn(),
  deleteNavGroup: vi.fn(),
}));
vi.mock("@/lib/docs/nav-api", () => ({
  fetchAdminNavConfig,
  updateNavItemOverride,
  createNavGroup,
  renameNavGroup,
  deleteNavGroup,
}));

function group(overrides: Partial<NavGroupConfig> = {}): NavGroupConfig {
  return { id: "g1", name: "DEVELOPER", builtin: true, sortOrder: 2, ...overrides };
}

function override(overrides: Partial<NavItemOverrideConfig> = {}): NavItemOverrideConfig {
  return { itemKey: "/legal-pages", customLabel: null, groupId: null, sortOrder: null, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchAdminNavConfig.mockResolvedValue({ products: [], groups: [], itemOverrides: [] });
});

describe("useSidebarNavConfig", () => {
  it("does not fetch anything when the caller can't manage the sidebar", () => {
    renderHook(() => useSidebarNavConfig(false));
    expect(fetchAdminNavConfig).not.toHaveBeenCalled();
  });

  it("loads groups and item overrides for a caller who can manage the sidebar", async () => {
    fetchAdminNavConfig.mockResolvedValue({
      products: [],
      groups: [group()],
      itemOverrides: [override({ customLabel: "Legal Docs" })],
    });

    const { result } = renderHook(() => useSidebarNavConfig(true));

    await waitFor(() => expect(result.current.groups).toHaveLength(1));
    expect(result.current.itemOverrides[0]?.customLabel).toBe("Legal Docs");
  });

  it("renames an item optimistically, then reconciles with the server's response", async () => {
    updateNavItemOverride.mockResolvedValue(override({ customLabel: "Legal Docs" }));
    const { result } = renderHook(() => useSidebarNavConfig(true));
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    let promise!: Promise<void>;
    act(() => {
      promise = result.current.renameItem("/legal-pages", "Legal Docs");
    });
    // Applied immediately, before the request resolves.
    expect(result.current.itemOverrides[0]?.customLabel).toBe("Legal Docs");

    await act(() => promise);
    expect(updateNavItemOverride).toHaveBeenCalledWith("/legal-pages", { label: "Legal Docs" });
    expect(result.current.itemOverrides[0]?.customLabel).toBe("Legal Docs");
  });

  it("rolls back a rename when the request fails", async () => {
    updateNavItemOverride.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useSidebarNavConfig(true));
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await act(async () => {
      await expect(result.current.renameItem("/legal-pages", "Legal Docs")).rejects.toThrow("nope");
    });

    expect(result.current.itemOverrides).toHaveLength(0);
  });

  it("moves an item optimistically, then reconciles with the server's assigned position", async () => {
    updateNavItemOverride.mockResolvedValue(override({ groupId: "g1", sortOrder: 1 }));
    const { result } = renderHook(() => useSidebarNavConfig(true));
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await act(() => result.current.moveItem("/legal-pages", "g1"));

    expect(updateNavItemOverride).toHaveBeenCalledWith("/legal-pages", { groupId: "g1" });
    expect(result.current.itemOverrides[0]).toEqual(override({ groupId: "g1", sortOrder: 1 }));
  });

  it("rolls back a move when the request fails", async () => {
    updateNavItemOverride.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useSidebarNavConfig(true));
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await act(async () => {
      await expect(result.current.moveItem("/legal-pages", "g1")).rejects.toThrow("nope");
    });

    expect(result.current.itemOverrides).toHaveLength(0);
  });

  it("creates a group then moves the item into it", async () => {
    createNavGroup.mockResolvedValue(group({ id: "new-1", name: "Legal Team", builtin: false, sortOrder: 3 }));
    updateNavItemOverride.mockResolvedValue(override({ groupId: "new-1", sortOrder: 1 }));
    const { result } = renderHook(() => useSidebarNavConfig(true));
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await act(() => result.current.createGroupAndMove("/legal-pages", "Legal Team"));

    expect(createNavGroup).toHaveBeenCalledWith("Legal Team");
    expect(result.current.groups.map((g) => g.name)).toContain("Legal Team");
    expect(updateNavItemOverride).toHaveBeenCalledWith("/legal-pages", { groupId: "new-1" });
  });

  it("renames a custom group optimistically, rolling back on failure", async () => {
    fetchAdminNavConfig.mockResolvedValue({ products: [], groups: [group({ id: "g1", name: "Old Name" })], itemOverrides: [] });
    renameNavGroup.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useSidebarNavConfig(true));
    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    await act(async () => {
      await expect(result.current.renameGroup("g1", "New Name")).rejects.toThrow("nope");
    });

    expect(result.current.groups[0]?.name).toBe("Old Name");
  });

  it("deletes a group optimistically, rolling back on failure", async () => {
    fetchAdminNavConfig.mockResolvedValue({ products: [], groups: [group({ id: "g1" })], itemOverrides: [] });
    deleteNavGroup.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useSidebarNavConfig(true));
    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    await act(async () => {
      await expect(result.current.deleteGroup("g1")).rejects.toThrow("nope");
    });

    expect(result.current.groups).toHaveLength(1);
  });
});
