type Workflow = {
  title: string;
  description: React.ReactNode;
};

const WORKFLOWS: Workflow[] = [
  {
    title: "Write and publish in Doc Studio",
    description: (
      <><strong>Doc Studio</strong> is where documents actually get written — create a new page, organize it into the right workspace, and publish when it&apos;s ready.</>
    ),
  },
  {
    title: "Keep teams separate with Workspaces",
    description: (
      <>Every team or project gets its own <strong>Workspace</strong>. Documents and members in one workspace don&apos;t show up in another unless you explicitly share access.</>
    ),
  },
  {
    title: "Control access from Users & Roles",
    description: (
      <>Every teammate has a role — <strong>User</strong>, <strong>Admin</strong>, or <strong>Super Admin</strong> — that decides what they can see and change. Deactivate an account here to cut off access without deleting their history.</>
    ),
  },
  {
    title: "Watch what's happening in Activity",
    description: (
      <>The <strong>Activity</strong> page is a live feed of who published, edited, or joined what — useful for catching a change before it becomes a problem.</>
    ),
  },
  {
    title: "Track Claude Code usage",
    description: (
      <>If your team uses <strong>Claude Code</strong>, the <strong>Claude Code Usage</strong> page tracks opt-in, per-person <strong>token usage</strong> against a soft <strong>budget</strong> your team sets — an estimate, not a hard limit, and never a way to see anyone&apos;s actual account.</>
    ),
  },
  {
    title: "Check on System Health",
    description: "A quick status view for the parts of the platform that keep documents saved and searchable.",
  },
];

export default function HowToUsePage() {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">How to use</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">The core workflows.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Coc Docs Platform is a small set of focused pages, not a maze of settings. Here&apos;s what each
        one is actually for.
      </p>

      <div className="mt-6 space-y-5">
        {WORKFLOWS.map((workflow) => (
          <div key={workflow.title} className="border-b border-surface-border pb-5 last:border-b-0">
            <h2 className="text-base font-semibold text-foreground">{workflow.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{workflow.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
