"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createNavGroup,
  deleteNavGroup as deleteNavGroupApi,
  fetchAdminNavConfig,
  renameNavGroup as renameNavGroupApi,
  updateNavItemOverride,
  type NavGroupConfig,
  type NavItemOverrideConfig,
} from "@/lib/docs/nav-api";

function upsertOverride(
  current: NavItemOverrideConfig[],
  itemKey: string,
  patch: Partial<Pick<NavItemOverrideConfig, "customLabel" | "groupId" | "sortOrder">>,
): NavItemOverrideConfig[] {
  const existing = current.find((o) => o.itemKey === itemKey);
  const next: NavItemOverrideConfig = {
    itemKey,
    customLabel: existing?.customLabel ?? null,
    groupId: existing?.groupId ?? null,
    sortOrder: existing?.sortOrder ?? null,
    ...patch,
  };
  return existing ? current.map((o) => (o.itemKey === itemKey ? next : o)) : [...current, next];
}

/**
 * Live groups + per-item overrides for the sidebar's "⋮" kebab menu
 * (task: Rename/Move to group/Delete) — fetched once for a caller who can
 * manage the sidebar (admin/super_admin, the only roles a kebab ever shows
 * for), with optimistic local updates that roll back on a failed request.
 */
export function useSidebarNavConfig(canManage: boolean) {
  const [groups, setGroups] = useState<NavGroupConfig[]>([]);
  const [itemOverrides, setItemOverrides] = useState<NavItemOverrideConfig[]>([]);

  useEffect(() => {
    if (!canManage) return;
    fetchAdminNavConfig()
      .then((config) => {
        setGroups(config.groups);
        setItemOverrides(config.itemOverrides);
      })
      .catch(() => {
        // The sidebar still renders the code-defined defaults if this fails
        // — same resilience fetchNavStructure already has for products.
      });
  }, [canManage]);

  const renameItem = useCallback(async (itemKey: string, label: string) => {
    const previous = itemOverrides;
    setItemOverrides((current) => upsertOverride(current, itemKey, { customLabel: label }));
    try {
      const saved = await updateNavItemOverride(itemKey, { label });
      setItemOverrides((current) => current.map((o) => (o.itemKey === itemKey ? saved : o)));
    } catch (err) {
      setItemOverrides(previous);
      throw err;
    }
  }, [itemOverrides]);

  const moveItem = useCallback(async (itemKey: string, groupId: string) => {
    const previous = itemOverrides;
    // The real position ("end of the target group") is only known once the
    // server assigns it — guess the very end for the optimistic render, then
    // reconcile with the authoritative row the request returns.
    setItemOverrides((current) => upsertOverride(current, itemKey, { groupId, sortOrder: Number.MAX_SAFE_INTEGER }));
    try {
      const saved = await updateNavItemOverride(itemKey, { groupId });
      setItemOverrides((current) => current.map((o) => (o.itemKey === itemKey ? saved : o)));
    } catch (err) {
      setItemOverrides(previous);
      throw err;
    }
  }, [itemOverrides]);

  const createGroupAndMove = useCallback(
    async (itemKey: string, name: string) => {
      // Creation isn't optimistic — moving into it needs the server's real
      // id, so there is nothing useful to render before this resolves.
      const created = await createNavGroup(name);
      setGroups((current) => [...current, created]);
      await moveItem(itemKey, created.id);
      return created;
    },
    [moveItem],
  );

  const renameGroup = useCallback(async (id: string, name: string) => {
    const previous = groups;
    setGroups((current) => current.map((g) => (g.id === id ? { ...g, name } : g)));
    try {
      await renameNavGroupApi(id, name);
    } catch (err) {
      setGroups(previous);
      throw err;
    }
  }, [groups]);

  const deleteGroup = useCallback(async (id: string) => {
    const previous = groups;
    setGroups((current) => current.filter((g) => g.id !== id));
    try {
      await deleteNavGroupApi(id);
    } catch (err) {
      setGroups(previous);
      throw err;
    }
  }, [groups]);

  return { groups, itemOverrides, renameItem, moveItem, createGroupAndMove, renameGroup, deleteGroup };
}
