"use client";

import { LockIcon } from "@/components/auth/icons";
import { NavMenu, NavMenuItem, productPagesBlurb } from "@/components/ui/nav-menu";
import type { NavProduct } from "@/lib/docs/nav-api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * A single "Products ▾" menu holding one grid of every product — not one
 * dropdown per product. Each entry is a locked preview: choosing one closes
 * the menu and calls `onRequireAuth` rather than navigating, since a visitor
 * on /welcome is not signed in. The lock shows on hover, so the grid reads as
 * a catalogue first and a gate second.
 *
 * Shape and behaviour come from the shared `NavMenu` (ADR-104 r2.9): a pill
 * trigger, hover to open, and a two-column title-and-description panel.
 */
export function ProductsNavDropdown({
  products,
  onRequireAuth,
}: {
  products: NavProduct[];
  onRequireAuth: (productLabel: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <NavMenu label={t.nav.products} panelClassName="w-[440px] grid-cols-2">
      {products.map((product) => (
        <NavMenuItem
          key={product.key}
          title={product.label}
          description={productPagesBlurb(product.items) ?? t.nav.documentation}
          onSelect={() => onRequireAuth(product.label)}
          trailing={
            <LockIcon className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          }
        />
      ))}
    </NavMenu>
  );
}
