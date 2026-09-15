import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsMobileNav } from "@/components/docs/DocsMobileNav";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <DocsSidebar />
      <div className="min-w-0 flex-1">
        <DocsMobileNav />
        <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">{children}</main>
      </div>
    </div>
  );
}
