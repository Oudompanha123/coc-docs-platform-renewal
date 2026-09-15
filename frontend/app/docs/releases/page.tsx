type Release = {
  date: string;
  title: string;
  items: string[];
};

/** Sourced from this repo's real git history — not fabricated version numbers. */
const RELEASES: Release[] = [
  {
    date: "2026-09-11",
    title: "Password sign-up, and a cleaner Register form",
    items: [
      "Email/password self-registration, alongside Google sign-in",
      "Backend logs to console and file, with more detail in development",
      "Every backend environment variable is now documented",
    ],
  },
  {
    date: "2026-09-10",
    title: "Settings, Users & Roles, and a public Welcome page",
    items: [
      "Users & Roles admin page — manage accounts, roles, and access",
      "Settings page for personal preferences",
      "Sign in with Google, brokered through Keycloak",
      "A 404 page that doesn't just show a blank screen",
    ],
  },
  {
    date: "2026-09-09",
    title: "The admin app goes live",
    items: [
      "Authenticated app shell and the Overview dashboard",
      "Backend auth, accounts, and content API with default-deny authorization",
      "Google ID token verification, with real backend sessions",
    ],
  },
];

export default function ReleasesPage() {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-purple">Releases</p>
      <h1 className="mt-1 text-3xl font-bold text-ink">What&apos;s new.</h1>
      <p className="mt-3 text-base text-muted">Real, ongoing work on Coc Docs Platform — most recent first.</p>

      <div className="mt-10 space-y-10 border-l-2 border-border pl-6">
        {RELEASES.map((release, i) => (
          <div key={release.date} className="relative">
            <span
              className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${
                i === 0 ? "bg-brand-purple" : "border-2 border-border bg-white"
              }`}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-brand-purple">{release.date}</span>
              {i === 0 && (
                <span className="rounded-full bg-[#e1f5ec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1f9d6b]">
                  Latest
                </span>
              )}
            </div>
            <h2 className="mt-1 text-lg font-bold text-ink">{release.title}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted">
              {release.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
