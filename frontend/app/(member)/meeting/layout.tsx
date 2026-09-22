import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Exists only to carry the tab title. `page.tsx` is a client component —
 * it listens for arrow keys — and Next.js refuses a `metadata` export from
 * one, so the title lives in this server layout instead.
 */
export const metadata: Metadata = {
  title: "AX Team Share — Coc Docs Platform",
};

export default function MeetingLayout({ children }: { children: ReactNode }) {
  return children;
}
