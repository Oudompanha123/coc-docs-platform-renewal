"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** The app's theme is `data-theme` on `<html>` (ADR-104), not next-themes, so read it from there. */
function useAppTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

/**
 * shadcn/ui's Sonner `<Toaster />`, themed from the design tokens. Mounted once
 * in `Providers`; fire a toast anywhere with `toast.success(...)` from `sonner`.
 */
export function Toaster(props: ToasterProps) {
  const theme = useAppTheme();
  return (
    <Sonner
      theme={theme}
      position="top-right"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--surface-border)",
          "--border-radius": "var(--radius-xl, 12px)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
