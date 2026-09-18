"use client";

import { useEffect, type ReactNode } from "react";

/** No modal primitive exists elsewhere in this app yet — this is the minimal
 *  shell both AddAccountModal and DeactivateModal need, styled to match the
 *  existing card convention (rounded-2xl border-border bg-white shadow).
 *  `title` is optional so a caller that needs a custom header (icon above
 *  the heading, e.g. DeactivateModal's warning state) can build it as part
 *  of `children` instead. */
const DEFAULT_CLASS_NAME = "w-full max-w-md overflow-y-auto rounded-[10px] border border-border bg-white p-5 shadow-xl";

export function Modal({
  title,
  onClose,
  children,
  className = DEFAULT_CLASS_NAME,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  /** Replaces the whole default class list (not merged) — for a caller that
   *  wants its own padding (e.g. ProfileModal removing the horizontal p-5
   *  so its internal scroll region's scrollbar sits at the true edge, and
   *  re-adding that inset itself around its own content instead). Every
   *  other caller omits this and keeps the shared look unchanged. */
  className?: string;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-[50px]" onClick={onClose}>
      <div
        className={className}
        style={{ maxHeight: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-base font-bold text-dash-ink">{title}</h2>}
        <div className={title ? "mt-4" : undefined}>{children}</div>
      </div>
    </div>
  );
}
