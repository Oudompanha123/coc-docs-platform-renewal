"use client";

import { useState } from "react";

/** Terminal-style copy-able command block — dark regardless of page theme,
 *  the normal convention for code blocks in docs (matches the pattern the
 *  reference docs site uses), built on Coc Docs Platform's own dark token
 *  (bg-sidebar) instead of a new color. */
export function DocsCodeBlock({ code, output }: { code: string; output?: string }) {
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
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="px-4 pb-4 font-mono text-sm text-white">
        <p className="whitespace-pre-line">{code}</p>
        {output && <p className="mt-2 whitespace-pre-line text-[#3ddb9c]">{output}</p>}
      </div>
    </div>
  );
}
