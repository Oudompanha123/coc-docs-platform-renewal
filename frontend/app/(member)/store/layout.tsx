import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Exists only to carry the tab title — `page.tsx` is a client component and
 * Next.js refuses a `metadata` export from one (same split as `/meeting`).
 */
export const metadata: Metadata = {
  title: "Store — Coc Docs Platform",
};

export default function StoreLayout({ children }: { children: ReactNode }) {
  return children;
}
