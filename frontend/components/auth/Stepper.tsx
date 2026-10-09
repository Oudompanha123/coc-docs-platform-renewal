type StepStatus = "complete" | "current" | "upcoming";

type StepperProps = {
  steps: string[];
  /** Zero-based index of the step in progress now. */
  currentIndex: number;
};

/**
 * A numbered progress indicator — circles joined by a line, the current step
 * (and anything already passed) filled in, what's left outlined and grey.
 *
 * Used across Register's three screens (form, code, done) so the applicant
 * always sees how far along they are and what's left (ADR-021).
 */
export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <nav aria-label="Registration progress">
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const status: StepStatus =
            index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
          const isLast = index === steps.length - 1;

          return (
            <li key={label} className={`flex items-start ${isLast ? "" : "flex-1"}`}>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    status === "upcoming"
                      ? "border-surface-border text-muted-foreground border bg-transparent"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  aria-current={status === "current" ? "step" : undefined}
                  className={`text-xs font-medium whitespace-nowrap ${
                    status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`mt-4 h-0.5 flex-1 ${
                    status === "complete" ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
