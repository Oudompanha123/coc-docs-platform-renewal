"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Plays the shared `.animate-entrance` fade-and-rise (globals.css, the same
 * one the admin Overview page uses on mount) once this section scrolls into
 * view, instead of on page load — most of `/welcome` is below the fold on
 * first paint, so a mount-triggered animation there would already have
 * finished, invisibly, before a reader ever scrolls down to see it.
 *
 * No IntersectionObserver (older Safari, JS disabled) falls back to
 * already-visible rather than permanently hidden — this is polish, not a
 * gate content should ever fail to pass through.
 */
export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${visible ? "animate-entrance" : "opacity-0"} ${className}`}
      style={visible && delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
