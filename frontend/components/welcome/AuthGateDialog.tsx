"use client";

import Link from "next/link";
import { ShieldIcon } from "@/components/auth/icons";
import { Button } from "@/components/ui/button";

/**
 * The "Sign in to access X" prompt a signed-out visitor gets from a product
 * item in a public header (`/welcome`, and `/store` without a session).
 * Rendered inside the page root so it inherits that page's theme tokens.
 * `product` is the name clicked; null hides the dialog.
 */
export function AuthGateDialog({ product, onClose }: { product: string | null; onClose: () => void }) {
  if (product === null) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-auth-gate-title"
        className="w-full max-w-sm rounded-xl border border-surface-border bg-popover p-6 text-popover-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <ShieldIcon className="size-5" />
        </div>
        <h2 id="welcome-auth-gate-title" className="text-lg font-semibold tracking-tight">
          Sign in to access {product}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {product} documentation is only available to signed-in members. Create a free account or log in to continue.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/register" onClick={onClose}>
              Get started free
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login" onClick={onClose}>
              Log in
            </Link>
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="mt-2 w-full text-muted-foreground hover:text-foreground">
          Maybe later
        </Button>
      </div>
    </div>
  );
}
