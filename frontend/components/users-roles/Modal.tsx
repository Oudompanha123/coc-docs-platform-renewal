"use client";

import type { ReactNode } from "react";

/** No modal primitive exists elsewhere in this app yet — this is the minimal
 *  shell both AddAccountModal and DeactivateModal need, styled to match the
 *  existing card convention (rounded-2xl border-border bg-white shadow).
 *  `title` is optional so a caller that needs a custom header (icon above
 *  the heading, e.g. DeactivateModal's warning state) can build it as part
 *  of `children` instead. */
export function Modal({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-base font-bold text-dash-ink">{title}</h2>}
        <div className={title ? "mt-4" : undefined}>{children}</div>
      </div>
    </div>
  );
}
