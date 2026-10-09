import Link from "next/link";
import { DocumentIcon, LayersIcon, PulseIcon, SparklesIcon } from "@/components/layout/icons";
import { ShieldIcon } from "@/components/auth/icons";

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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
          <DocumentIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-4xl font-extrabold text-ink">Coc Docs Platform</h1>
        <p className="mt-3 text-lg font-medium text-ink">Documentation, organized for your whole team.</p>
        <p className="mt-1 text-sm text-muted">One platform. Every workspace.</p>
        <Link
          href="/register"
          className="mt-7 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
        >
          Get started
        </Link>
      </div>

      <div className="animate-entrance mt-16 [animation-delay:120ms]">
        <p className="text-center text-sm font-semibold text-foreground">Overview</p>
        <h2 className="mt-1 text-center text-2xl font-bold text-ink">
          Everything your team&apos;s docs need, in one place.
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="animate-entrance rounded-[10px] border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                style={{ animationDelay: `${180 + i * 60}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-ink">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
