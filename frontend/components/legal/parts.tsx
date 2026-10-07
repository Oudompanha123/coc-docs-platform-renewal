import type { ComponentType, ReactNode } from "react";
import { CheckCircleIcon } from "@/components/layout/icons";
import { DotIcon } from "@/components/legal/icons";

/** Icon shape shared by `components/layout/icons.tsx` and `components/auth/icons.tsx`. */
export type LegalIcon = ComponentType<{ className?: string }>;

/**
 * The repeated building blocks a legal section is made of. Keeping them here
 * means `content.tsx` stays a readable document rather than a wall of
 * Tailwind classes, and a spacing change lands in one place for both pages.
 */

/** Bulleted list. `marker="check"` for things we commit to, `"dot"` for a plain enumeration. */
export function Bullets({ items, marker = "check" }: { items: ReactNode[]; marker?: "check" | "dot" }) {
  const Marker = marker === "check" ? CheckCircleIcon : DotIcon;
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {items.map((item, index) => (
        <li key={index} className="grid max-w-[68ch] grid-cols-[1rem_minmax(0,1fr)] items-start gap-2.5">
          <Marker className="mt-1 h-4 w-4 shrink-0 text-brand-purple" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
