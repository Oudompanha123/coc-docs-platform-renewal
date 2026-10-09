type Release = {
  date: string;
  title: string;
  items: React.ReactNode[];
};

/** Sourced from this repo's real git history — not fabricated version numbers. */
const RELEASES: Release[] = [
  {
    date: "2026-09-11",
    title: "Password sign-up, and a cleaner Register form",
    items: [
      <><strong>Email/password</strong> self-registration, alongside <strong>Google</strong> sign-in</>,
      <><strong>Backend</strong> logs to console and file, with more detail in development</>,
      <>Every <strong>backend</strong> environment variable is now documented</>,
    ],
  },
  {
    date: "2026-09-10",
    title: "Settings, Users & Roles, and a public Welcome page",
    items: [
      <><strong>Users & Roles</strong> admin page — manage accounts, roles, and access</>,
      <><strong>Settings</strong> page for personal preferences</>,
      <>Sign in with <strong>Google</strong>, brokered through <strong>Keycloak</strong></>,
      <>A 404 page that doesn&apos;t just show a blank screen</>,
    ],
  },
  {
    date: "2026-09-09",
    title: "The admin app goes live",
    items: [
      <>Authenticated app shell and the <strong>Overview</strong> dashboard</>,
      <><strong>Backend</strong> auth, accounts, and content <strong>API</strong> with default-deny authorization</>,
      <><strong>Google ID token</strong> verification, with real backend sessions</>,
    ],
  },
];

export default function ReleasesPage() {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">Releases</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">What&apos;s new.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Real, ongoing work on Coc Docs Platform — most recent first.</p>

      <div className="mt-8 space-y-8 border-l-2 border-surface-border pl-6">
        {RELEASES.map((release, i) => (
          <div key={release.date} className="relative">
            <span
              className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${
                i === 0 ? "bg-primary" : "border-2 border-surface-border bg-card"
              }`}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{release.date}</span>
              {i === 0 && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Latest
                </span>
              )}
            </div>
            <h2 className="mt-1 text-base font-semibold text-foreground">{release.title}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
              {release.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
