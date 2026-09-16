import Link from "next/link";
import { DocStep } from "./DocStep";
import { DocsCallout } from "./DocsCallout";
import { DocsCodeBlock } from "./DocsCodeBlock";
import { ICON_MAP } from "@/lib/docs/icon-map";
import type { DocContent } from "@/lib/docs/content-types";

/** `admin` = inside AppShell (Jex3.0's current location, text-dash-ink);
 *  `docs` = inside the standalone /docs layout (text-ink). Same content
 *  shapes render in either shell — only the heading token differs, since
 *  that's the one class the admin dark-mode override actually needs. */
export function ContentRenderer({ content, variant }: { content: DocContent; variant: "admin" | "docs" }) {
  const heading = variant === "admin" ? "text-dash-ink" : "text-ink";

  if (content.kind === "hero") {
    const isSplit = content.layout === "split";
    const heroText = (
      <>
        <h1 className={`text-3xl font-extrabold ${heading}`}>{content.heading}</h1>
        <p className={`mt-3 text-lg font-medium ${heading}`}>{content.tagline}</p>
        <p className="mt-1 text-sm text-muted">{content.subline}</p>
        <Link
          href={content.ctaHref}
          className="mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          {content.ctaLabel}
        </Link>
      </>
    );

    return (
      <div>
        <div
          className={`rounded-2xl border border-border bg-white p-8 shadow-sm sm:p-12 ${
            isSplit ? "text-center sm:flex sm:items-center sm:gap-10 sm:text-left" : "text-center"
          }`}
        >
          <div className={isSplit ? "sm:flex-1" : ""}>{heroText}</div>

          {isSplit && content.features.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-0 sm:w-48 sm:shrink-0">
              {content.features.slice(0, 4).map((feature, i) => {
                const Icon = ICON_MAP[feature.icon];
                return (
                  <div
                    key={i}
                    className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue text-white"
                  >
                    {feature.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={feature.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-7 w-7" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-center text-sm font-semibold text-brand-purple">{content.eyebrow}</p>
          <h2 className={`mt-1 text-center text-2xl font-bold ${heading}`}>{content.sectionHeading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-base text-muted">{content.sectionIntro}</p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {content.features.map((feature) => {
              const Icon = ICON_MAP[feature.icon];
              return (
                <div key={feature.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                    {feature.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={feature.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className={`mt-3 text-base font-semibold ${heading}`}>{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {content.closingNote && <p className="mt-6 text-sm text-muted">{content.closingNote}</p>}
        </div>
      </div>
    );
  }

  if (content.kind === "steps") {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-brand-purple">{content.eyebrow}</p>
        <h1 className={`mt-1 text-3xl font-bold ${heading}`}>{content.heading}</h1>
        <p className="mt-3 text-base text-muted">{content.intro}</p>

        {content.calloutText && (
          <div className="mt-6">
            <DocsCallout tone={content.calloutTone ?? "info"}>{content.calloutText}</DocsCallout>
          </div>
        )}

        <div className="mt-4">
          {content.steps.map((step, i) => (
            <DocStep key={`${step.title}-${i}`} number={i + 1} title={step.title}>
              {step.body && <p>{step.body}</p>}
              {step.command && <DocsCodeBlock code={step.command} output={step.output} />}
            </DocStep>
          ))}
        </div>
      </div>
    );
  }

  // sections
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-brand-purple">{content.eyebrow}</p>
      <h1 className={`mt-1 text-3xl font-bold ${heading}`}>{content.heading}</h1>
      <p className="mt-3 text-base text-muted">{content.intro}</p>

      {content.calloutText && (
        <div className="mt-6">
          <DocsCallout>{content.calloutText}</DocsCallout>
        </div>
      )}

      <div className="mt-8 space-y-8">
        {content.sections.map((section, i) => (
          <div
            key={`${section.title}-${i}`}
            className={i < content.sections.length - 1 ? "border-b border-border pb-8" : ""}
          >
            <h2 className={`text-lg font-bold ${heading}`}>{section.title}</h2>
            {section.note && <p className="mt-2 text-sm text-muted">{section.note}</p>}
            {section.command && (
              <div className="mt-3">
                <DocsCodeBlock code={section.command} />
              </div>
            )}
            {section.exampleCommand && (
              <details className="group mt-2 rounded-xl border border-border p-4">
                <summary className={`flex cursor-pointer list-none items-center gap-2 text-sm font-semibold ${heading}`}>
                  <span className="text-muted transition-transform group-open:rotate-45">+</span>
                  {section.exampleLabel ?? "Show example"}
                </summary>
                <div className="mt-3">
                  <DocsCodeBlock code={section.exampleCommand} />
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
