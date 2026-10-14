import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** The app's one spinner — shadcn/ui's, which is Lucide's `LoaderCircle`
 *  turning on `animate-spin` (ADR-104 r2.5). It replaced a bordered CSS ring.
 *  Coloured by `currentColor`, so it takes the text colour of the button or
 *  line it sits in — a primary button's foreground, a muted label's grey.
 *
 *  Older call sites still pass the ring's `border-2`. Preflight gives every
 *  element `border: 0 solid`, so on an SVG that would draw a square box round
 *  the spinner; border utilities are dropped here rather than trusted to every
 *  caller having been updated. */
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  const sizing = className
    .split(/\s+/)
    .filter((c) => c && !/^border(-|$)/.test(c))
    .join(" ");
  return <LoaderCircle aria-hidden="true" className={cn("shrink-0 animate-spin", sizing)} />;
}
