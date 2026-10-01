"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Unsaved Plan edits, and a warning before they are lost (ADR-076).
 *
 * <p>Each Plan section keeps its edits in its own state until Save, and the
 * workspace renders only the active section — so moving to another explorer
 * item, tab, or project unmounts it and the edits are gone. Each section
 * already knows whether it has unsaved changes (it uses that to block
 * Confirm); this module lets it say so to the rest of the workspace:
 *
 * <ul>
 *   <li>{@link useUnsavedChangesGuard} — a section registers while it has
 *       unsaved changes;
 *   <li>{@link useGuardedRouter} — the workspace navigates through this, which
 *       asks before leaving while anything is registered;
 *   <li>the browser's own leave/reload prompt (`beforeunload`) is attached
 *       while anything is registered, and only then.
 * </ul>
 *
 * <p>A native `confirm()` on purpose: navigation here is a synchronous
 * `router.push`, and the browser's leave prompt is native anyway, so the two
 * warnings read the same. The browser's Back button is not intercepted.
 */

/** Labels of the sections with unsaved changes right now, by registration. */
const unsaved = new Map<symbol, string>();

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (unsaved.size === 0) return;
  // Both, for the browsers that still read returnValue.
  event.preventDefault();
  event.returnValue = "";
}

function sync() {
  if (typeof window === "undefined") return;
  // Attached only while something is unsaved: a page with nothing to lose
  // must not make the browser ask "leave site?" on every reload.
  window.removeEventListener("beforeunload", onBeforeUnload);
  if (unsaved.size > 0) window.addEventListener("beforeunload", onBeforeUnload);
}

export function markUnsaved(id: symbol, label: string): void {
  unsaved.set(id, label);
  sync();
}

export function clearUnsaved(id: symbol): void {
  if (unsaved.delete(id)) sync();
}

/** The section labels with unsaved changes, for a message — empty when nothing is at risk. */
export function unsavedSections(): string[] {
  return Array.from(new Set(unsaved.values()));
}

/**
 * True when it is fine to leave: nothing is unsaved, or the person confirmed
 * they want to discard it.
 */
export function confirmDiscardUnsaved(): boolean {
  const labels = unsavedSections();
  if (labels.length === 0) return true;
  return window.confirm(
    `You have unsaved changes in ${labels.join(", ")}. Leave and discard them?`,
  );
}

/**
 * Registers a section as having unsaved changes while `dirty` is true, and
 * withdraws it when it is saved, reset, or unmounted.
 */
export function useUnsavedChangesGuard(dirty: boolean, label: string): void {
  const id = useRef<symbol>(Symbol(label));
  useEffect(() => {
    const key = id.current;
    if (dirty) markUnsaved(key, label);
    else clearUnsaved(key);
    return () => clearUnsaved(key);
  }, [dirty, label]);
}

/**
 * `useRouter()`, with `push` asking first while a section has unsaved changes.
 * A drop-in replacement for the workspace's navigation — everything else on
 * the router is passed through unchanged.
 */
export function useGuardedRouter(): ReturnType<typeof useRouter> {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<typeof router.push>) => {
        if (confirmDiscardUnsaved()) router.push(...args);
      },
    }),
    [router],
  );
}

/** For tests: forget every registration. */
export function resetUnsavedForTests(): void {
  unsaved.clear();
  sync();
}
