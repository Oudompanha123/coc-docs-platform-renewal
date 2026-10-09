import type { ReactNode } from "react";
import Link from "next/link";

/**
 * The repeated building blocks a legal section is made of. Keeping them here
 * means `content.tsx` stays a readable document rather than a wall of
 * Tailwind classes, and a spacing change lands in one place for both pages.
 *
 * <p>Plain document primitives — a paragraph, a bulleted list, a list of
 * links. Nothing here carries an icon or a card: these pages are a printed
 * legal document on screen, not a marketing page.
 */

/** One body paragraph. The last one in a section drops its bottom margin so the section gap stays even. */
export function Para({ children }: { children: ReactNode }) {
  return <p className="mt-0 mb-3.5 last:mb-0">{children}</p>;
}

/** Plain disc-marker list, for an enumeration inside a section. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-0 mb-3.5 flex list-disc flex-col gap-2 pl-[1.35rem] last:mb-0 marker:text-[#b6b4c0]">
      {items.map((item, index) => (
        <li key={index} className="pl-0.5">
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The "Related Policies" list — the one place these documents link out.
 *
 * <p>Every href resolves. The platform has no separate Acceptable Use or
 * Security Contacts page, so those two point at the section of this document
 * that actually carries the rule rather than at a route that would 404. Give
 * them their own pages later and only this list changes.
 */
export function PolicyLinks({ items }: { items: { label: string; href: string }[] }) {
  return (
    <ul className="mt-0 mb-3.5 flex list-disc flex-col gap-2 pl-[1.35rem] last:mb-0 marker:text-[#b6b4c0]">
      {items.map(({ label, href }) => (
        <li key={label} className="pl-0.5">
          <Link href={href} className="text-[#2f6fd0] hover:underline">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
