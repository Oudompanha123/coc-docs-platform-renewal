type FaqItem = {
  question: string;
  answer: string;
};

/** Real, verifiable answers grounded in this app's actual behavior — not
 *  invented support content. */
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Who can sign up?",
    answer:
      "Anyone can self-register with an email/password or a Google account. A Super Admin reviews and approves new accounts before they get full access.",
  },
  {
    question: "Do I need to install anything?",
    answer: "No. Coc Docs Platform runs entirely in your browser — there's no desktop app or CLI to set up.",
  },
  {
    question: "What roles exist, and what's the difference?",
    answer:
      "Three fixed roles: User, Admin, and Super Admin. Roles are fixed rather than custom-built, so access stays predictable across every workspace.",
  },
  {
    question: "Is my data safe if I make a mistake?",
    answer:
      "Every change is validated before it's saved, and every change is logged and versioned — so if something looks off, your team can see exactly what changed and when.",
  },
  {
    question: "What is the Claude Code Usage page for?",
    answer:
      "It tracks opt-in, per-person Claude Code token usage against a soft budget your team sets. It's an estimate, not a hard limit or an invoice, and it never reads or controls anyone's actual Claude Code account.",
  },
  {
    question: "Can I remove someone's access without deleting their history?",
    answer:
      "Yes — deactivating an account in Users & Roles cuts off access immediately while keeping their past activity and documents intact.",
  },
];

export default function FaqPage() {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-purple">FAQ</p>
      <h1 className="mt-1 text-3xl font-bold text-ink">Quick answers.</h1>
      <p className="mt-3 text-base text-muted">The most common questions about how Coc Docs Platform works.</p>

      <div className="mt-8 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group rounded-[10px] border border-border p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
              {item.question}
              <span className="shrink-0 text-lg font-normal text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
