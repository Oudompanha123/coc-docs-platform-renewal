import Link from "next/link";
import { DocumentIcon, LayersIcon, PulseIcon, SparklesIcon } from "@/components/layout/icons";
import { ShieldIcon } from "@/components/auth/icons";
import { Button } from "@/components/ui/button";

type FeatureCard = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

/** Real copy carried over from the earlier version of the /welcome page
 *  (ADR-013) — genuine, non-fabricated descriptions of what this app does. */
const FEATURES: FeatureCard[] = [
  {
    icon: SparklesIcon,
    title: "Doc Studio, ready instantly",
    description:
      "Create, edit, and organize documents and templates across every workspace — no manual folders, no broken links.",
  },
  {
    icon: LayersIcon,
    title: "Organized by workspace",
    description:
      "Give every team or project its own space to organize work — with access shared only with the people who need it.",
  },
  {
    icon: ShieldIcon,
    title: "Guarded by design",
    description: "Every change is validated before it's saved. Destructive actions are locked out.",
  },
  {
    icon: PulseIcon,
    title: "Built for accountability",
    description:
      "Every change is logged and versioned. If something looks off, your team can see exactly what changed and when.",
  },
];

export default function DocsOverviewPage() {
  return (
    <div>
      <div className="animate-entrance text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <DocumentIcon className="size-6" />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground">Coc Docs Platform</h1>
        <p className="mt-2 text-base font-medium text-foreground">Documentation, organized for your whole team.</p>
        <p className="mt-1 text-sm text-muted-foreground">One platform. Every workspace.</p>
        <Button asChild className="mt-6">
          <Link href="/register">Get started</Link>
        </Button>
      </div>

      <div className="animate-entrance mt-12 [animation-delay:120ms]">
        <p className="text-center text-sm font-semibold text-foreground">Overview</p>
        <h2 className="mt-1 text-center text-xl font-semibold text-foreground">
          Everything your team&apos;s docs need, in one place.
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="animate-entrance rounded-xl border border-surface-border bg-card p-4 transition-colors duration-200 hover:bg-accent/40"
                style={{ animationDelay: `${180 + i * 60}ms` }}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="size-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
