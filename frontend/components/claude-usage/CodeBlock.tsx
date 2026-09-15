"use client";

import { useState } from "react";

/** A copy-able code snippet — reuses the platform's own dark sidebar tone
 *  instead of the reference tool's macOS-traffic-light terminal look, so it
 *  reads as part of Coc Docs Platform rather than a copied widget. */
export function CodeBlock({ label, code }: { label?: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — nothing to fall back to in this context.
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-sidebar">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-sidebar-muted">
          {label ?? "Code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 pb-4 font-mono text-xs leading-relaxed text-white">{code}</pre>
    </div>
  );
}
