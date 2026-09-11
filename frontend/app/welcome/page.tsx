import Link from "next/link";
import { DocumentIcon, LayersIcon, PulseIcon, SparklesIcon } from "@/components/layout/icons";
import { ShieldIcon } from "@/components/auth/icons";

/**
 * Public landing page — ADR-013.
 *
 * Structure and section order are ported from jexmcp's real Overview page
 * (Small Service/content/en/jex3.0.tsx), adapted to Coc Docs Platform's own
 * design tokens (brand-purple/brand-blue, ink, muted, border, page — the
 * same ones used by /login and /register) rather than jexmcp's.
 *
 * Every line that named jexmcp's own technical internals (JEX Studio, WSVC,
 * IDO, MCP tools, Claude Code, its doctor/status commands) is left as an
 * explicit placeholder below instead of being ported or reworded — see the
 * ADR-013 report for the full flagged list.
 *
 * // req: ADR-013
 */

type FeatureCard = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  flagged?: boolean;
};

const FEATURES: FeatureCard[] = [
  {
    icon: SparklesIcon,
    title: "Doc Studio, ready instantly",
    description:
      "Create, edit, and organize documents and templates across every workspace — no manual folders, no broken links.",
  },
  {
    icon: LayersIcon,
    title: "Knows your workspace",
    // TODO(ADR-013): jexmcp original description — "Auto-detects each
    // workspace's prefix and JexStudio project. Open Claude Code at the
    // root — it figures out the rest." Names jexmcp-specific tooling;
    // needs real Coc Docs Platform copy.
    description: "Placeholder description — needs Coc Docs Platform copy (see ADR-013 flagged-lines report).",
    flagged: true,
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

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue text-white">
              <DocumentIcon className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-ink">Coc Docs Platform</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted sm:flex">
            <a href="#overview" className="hover:text-ink">Overview</a>
            <a href="#features" className="hover:text-ink">Features</a>
          </nav>
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section id="overview" className="mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md">
            <DocumentIcon className="h-8 w-8 text-brand-purple" />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold text-ink sm:text-5xl">Coc Docs Platform</h1>
          <p className="mt-4 text-xl font-medium text-ink">
            Coc Docs Platform — documentation, organized for your whole team.
          </p>
          <p className="mt-2 text-base text-muted">One platform. Every workspace.</p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </section>

        <section id="features" className="mx-auto max-w-5xl px-6 pb-20">
          <p className="text-center text-sm font-semibold text-brand-purple">Overview</p>
          {/* TODO(ADR-013): jexmcp original heading — "Your whole JEX
              workflow. In one plugin." Names jexmcp's own product/plugin
              model; needs real Coc Docs Platform copy. */}
          <h2 className="mt-1 text-center text-3xl font-bold text-ink">Placeholder heading — needs Coc Docs Platform copy</h2>
          {/* TODO(ADR-013): jexmcp original intro — "Scaffolding.
              Guardrails. Automation. Open any JEX workspace and everything
              is ready — no copying folders, no fixing paths." Describes
              jexmcp's own workspace-bootstrapping mechanics; needs real
              Coc Docs Platform copy. */}
          <p className="mx-auto mt-3 max-w-xl text-center text-base text-muted">
            Placeholder intro paragraph — needs Coc Docs Platform copy (see ADR-013 flagged-lines report).
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title + feature.description} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        {/* TODO(ADR-013): jexmcp original footer credited its own author
            ("Built by Socheat Hun") — that's jexmcp-specific attribution,
            not ported. Whether Coc Docs Platform wants a "Built by" credit
            line at all is an open question, not guessed here. */}
        <p>© 2026 Coc Docs Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
