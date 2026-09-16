type Workflow = {
  title: string;
  description: string;
};

const WORKFLOWS: Workflow[] = [
  {
    title: "Write and publish in Doc Studio",
    description:
      "Doc Studio is where documents actually get written — create a new page, organize it into the right workspace, and publish when it's ready.",
  },
  {
    title: "Keep teams separate with Workspaces",
    description:
      "Every team or project gets its own Workspace. Documents and members in one workspace don't show up in another unless you explicitly share access.",
  },
  {
    title: "Control access from Users & Roles",
    description:
      "Every teammate has a role — User, Admin, or Super Admin — that decides what they can see and change. Deactivate an account here to cut off access without deleting their history.",
  },
  {
    title: "Watch what's happening in Activity",
    description:
      "The Activity page is a live feed of who published, edited, or joined what — useful for catching a change before it becomes a problem.",
  },
  {
    title: "Track Claude Code usage",
    description:
      "If your team uses Claude Code, the Claude Code Usage page tracks opt-in, per-person token usage against a soft budget your team sets — an estimate, not a hard limit, and never a way to see anyone's actual account.",
  },
  {
    title: "Check on System Health",
    description: "A quick status view for the parts of the platform that keep documents saved and searchable.",
  },
];

export default function HowToUsePage() {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-purple">How to use</p>
      <h1 className="mt-1 text-3xl font-bold text-ink">The core workflows.</h1>
      <p className="mt-3 text-base text-muted">
        Coc Docs Platform is a small set of focused pages, not a maze of settings. Here&apos;s what each
        one is actually for.
      </p>

      <div className="mt-8 space-y-6">
        {WORKFLOWS.map((workflow) => (
          <div key={workflow.title} className="border-b border-border pb-6 last:border-b-0">
            <h2 className="text-lg font-bold text-ink">{workflow.title}</h2>
            <p className="mt-2 text-sm text-muted">{workflow.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
