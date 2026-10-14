import { PageSkeleton } from "@/components/layout/ShellSkeleton";

/** Shown inside the shell between a navigation and the next page's first
 *  render — the page's outline instead of the previous page frozen in place. */
export default function ShellLoading() {
  return <PageSkeleton />;
}
