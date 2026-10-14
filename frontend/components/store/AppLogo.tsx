"use client";

import { useState } from "react";
import { absoluteUrl, type StoreApp } from "@/lib/store/store-api";

/**
 * An app's logo, or — with no logo, or one that fails to load — its first
 * letter on the brand gradient, so a card never shows a broken image.
 */
export function AppLogo({ app, className = "h-14 w-14 text-xl" }: { app: Pick<StoreApp, "name" | "logoUrl">; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (app.logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served by the backend, not by Next's image pipeline
      <img
        src={absoluteUrl(app.logoUrl)}
        alt=""
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-2xl border border-border bg-white object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue font-bold text-white`}
    >
      {app.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
