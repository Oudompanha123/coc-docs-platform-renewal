"use client";

import { useState } from "react";
import { IconTemplate } from "@/components/store/AppIconPicker";
import { absoluteUrl, type StoreApp } from "@/lib/store/store-api";

/**
 * An app's icon, or — with no icon, or one that fails to load — the app-icon
 * template grid, so a card never shows a broken image.
 */
export function AppLogo({ app, className = "h-14 w-14" }: { app: Pick<StoreApp, "name" | "logoUrl">; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (app.logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served by the backend, not by Next's image pipeline
      <img
        src={absoluteUrl(app.logoUrl)}
        alt=""
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-[22%] border border-surface-border bg-background object-cover`}
      />
    );
  }
  return (
    <span aria-hidden="true" className={`${className} block shrink-0 overflow-hidden rounded-[22%] border border-surface-border`}>
      <IconTemplate className="h-full w-full" />
    </span>
  );
}
