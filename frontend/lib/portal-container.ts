"use client";

import { useLayoutEffect, useState } from "react";

/**
 * Where a floating layer (a select's list, a dropdown menu) should portal to.
 *
 * Radix portals to `<body>` by default, to escape clipping. In this app that
 * also escapes the theme: dark mode is scoped to `[data-shell]` (and
 * `.landing-dark` on /welcome), deliberately, so /login and /register stay
 * light (ADR-104 decision 3). A list portalled to `<body>` sat outside that
 * scope and drew with the light tokens — a white panel in dark mode.
 * Portalling into the page's own shell keeps it inside the theme and still
 * outside any clipping container (the layer is `position: fixed`).
 *
 * A hook rather than a lookup during render: on the first render the
 * component's own tree — the shell included — is not in the document yet, so
 * a render-time query finds nothing. The effect runs after mount, long before
 * anyone can open the layer.
 */
export function useThemedPortalContainer(): HTMLElement | undefined {
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);
  useLayoutEffect(() => {
    setContainer((document.querySelector("[data-shell], .landing-dark, .landing-auto") as HTMLElement | null) ?? undefined);
  }, []);
  return container;
}
