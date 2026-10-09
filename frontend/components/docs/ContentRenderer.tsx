"use client";

import Link from "next/link";
import { useState } from "react";
import { DocStep } from "./DocStep";
import { DocsCallout } from "./DocsCallout";
import { DocsCodeBlock } from "./DocsCodeBlock";
import { DownloadIcon } from "@/components/layout/icons";
import { HERO_DOWNLOAD_OS_ICON } from "./os-icons";
import { ICON_MAP } from "@/lib/docs/icon-map";
import {
  HERO_DOWNLOAD_OS_ORDER,
  isShownSecondaryCta,
  isValidHeroDownloadUrl,
  resolveHeroDownloadButton,
} from "@/lib/docs/content-types";
import type { DocContent, DownloadLink } from "@/lib/docs/content-types";
import { useSession } from "@/lib/auth/SessionProvider";
import { createUsageToken } from "@/lib/auth/api";
import {
  autoLabel,
  buildPersonalizedScript,
  downloadPersonalizedScript,
  GENERIC_TEMPLATE_URL,
  pointsAtLoopbackFromRemotePage,
} from "@/lib/admin/reporterConfig";

/**
 * Plain `<a download>` links for every file except one: `push-usage.mjs`
 * (`GENERIC_TEMPLATE_URL`) gets the same treatment `DownloadConfigPanel`
 * gives it (Claude Usage / Home) when the reader is signed in — mint a
 * token, fetch the template, embed their own config, download the result —
 * instead of the raw generic file, so this setup guide's own download link
 * doesn't hand out a script missing `USER_EMAIL` the way the plain static
 * link used to. Signed-out readers (this page needs no session to view) and
 * every other download here are untouched: a plain static file, same as
 * always — the only thing that could fetch it with no browser at all (a CI
 * job's `curl`) never runs this component's `onClick` regardless.
 */
function DownloadLinks({ downloads }: { downloads: DownloadLink[] }) {
  const { status, user } = useSession();
  const [busyHref, setBusyHref] = useState<string | null>(null);
  const [errorHref, setErrorHref] = useState<string | null>(null);

  async function personalizeAndDownload(href: string) {
    if (!user?.email) return;
    setBusyHref(href);
    setErrorHref(null);
    try {
      const minted = await createUsageToken(autoLabel());
      if (pointsAtLoopbackFromRemotePage(minted.ingestUrl, window.location.hostname)) {
        // Backend is misconfigured (no APP_PUBLIC_URL, and the request reached
        // it as localhost) — a script built from this would post to the
        // user's own PC. Fail visibly instead.
        throw new Error("ingest URL points at localhost from a non-local page");
      }
      // no-store: substituted into on every click, so a cached stale copy
      // of the template must never be served in its place.
      const templateRes = await fetch(href, { cache: "no-store" });
      if (!templateRes.ok) {
        throw new Error("template fetch failed");
      }
      const template = await templateRes.text();
      const script = buildPersonalizedScript(
        template,
        user.email,
        user.displayName ?? user.email.split("@")[0]!,
        minted.token,
        minted.ingestUrl,
      );
      downloadPersonalizedScript(script);
    } catch {
      setErrorHref(href);
    } finally {
      setBusyHref(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {downloads.map((d, i) => {
        const personalizable = d.href === GENERIC_TEMPLATE_URL && status === "authenticated" && Boolean(user?.email);
        return (
          <a
            key={`${d.href}-${i}`}
            href={d.href}
            download
            aria-busy={busyHref === d.href}
            onClick={
              personalizable
                ? (e) => {
                    e.preventDefault();
                    void personalizeAndDownload(d.href);
                  }
                : undefined
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-dash-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow aria-busy:cursor-wait aria-busy:opacity-60"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            {busyHref === d.href ? "Preparing…" : d.label}
          </a>
        );
      })}
      {errorHref && (
        <p role="alert" className="w-full text-xs text-danger">
          Couldn&apos;t personalize that download — try again, or use the plain file below and configure it by hand.
        </p>
      )}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}

/** `admin` = inside AppShell (Jex3.0's current location, text-dash-ink);
 *  `docs` = inside the standalone /docs layout (text-ink). Same content
 *  shapes render in either shell — only the heading token differs, since
 *  that's the one class the admin dark-mode override actually needs. */
/** The hero's second button: the same pill as the primary, outlined rather than filled. */
const HERO_SECONDARY_CTA_CLASS =
  "inline-flex items-center justify-center rounded-full border border-primary/40 bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-secondary";

export function ContentRenderer({ content, variant }: { content: DocContent; variant: "admin" | "docs" }) {
  const heading = variant === "admin" ? "text-dash-ink" : "text-ink";

  if (content.kind === "hero") {
    const isSplit = content.layout === "split";
    // Resolved once per OS — turns a legacy bare-URL string or a sparse
    // { show, label, url, version, size } object into every field a caller
    // needs, defaults included (resolveHeroDownloadButton). Only the ones
    // that resolve to shown-with-a-valid-URL render a button at all — an
    // empty downloadButtons (or none of the three set) leaves the Hero
    // looking exactly like it did before this field existed.
    const downloadButtons = HERO_DOWNLOAD_OS_ORDER.map((os) => ({
      os,
      ...resolveHeroDownloadButton(os, content.downloadButtons?.[os]),
    })).filter((button) => button.show && isValidHeroDownloadUrl(button.url) && button.url !== "");
    const heroText = (
      <>
        <h1 className={`text-3xl font-extrabold ${heading}`}>{content.heading}</h1>
        <p className={`mt-3 text-lg font-medium ${heading}`}>{content.tagline}</p>
        <p className="mt-1 text-sm text-muted">{content.subline}</p>
        {/* Row 1 — Get started alone, unchanged from before this field
            existed. Row 2 (16px below) is the download buttons, which no
            longer share this row — four buttons crowded into one flex-wrap
            line used to leave Linux stranded alone on a second line. */}
        <div className={`mt-7 flex flex-wrap gap-3 ${isSplit ? "justify-center sm:justify-start" : "justify-center"}`}>
          <Link
            href={content.ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            {content.ctaLabel}
          </Link>
          {/* An optional second button beside it — e.g. straight into the
              AX Renewal workspace from its docs. Same URL rule as the
              download buttons: a same-site path, or https:// (new tab). */}
          {isShownSecondaryCta(content.secondaryCta) &&
            (content.secondaryCta.href.startsWith("https://") ? (
              <a
                href={content.secondaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
                className={HERO_SECONDARY_CTA_CLASS}
              >
                {content.secondaryCta.label}
              </a>
            ) : (
              <Link href={content.secondaryCta.href} className={HERO_SECONDARY_CTA_CLASS}>
                {content.secondaryCta.label}
              </Link>
            ))}
        </div>
        {downloadButtons.length > 0 && (
          <div
            className={`mt-4 flex flex-col items-stretch gap-3 sm:flex-row ${
              isSplit ? "sm:justify-start" : "sm:justify-center"
            }`}
          >
            {downloadButtons.map(({ os, url, label, version, size }) => {
              const Icon = HERO_DOWNLOAD_OS_ICON[os];
              // isValidHeroDownloadUrl only ever lets this be an https://
              // URL or a same-site path starting with "/" — so "starts with
              // https://" is exactly "is an external URL" here, never a
              // false positive from some other scheme slipping through.
              const external = url.startsWith("https://");
              const meta = [version, size].filter((part) => part !== "").join(" · ");
              return (
                <a
                  key={os}
                  href={url}
                  {...(external ? { rel: "noopener noreferrer" } : {})}
                  className="flex w-full min-w-[200px] items-center gap-3 rounded-xl border border-border bg-white py-2.5 pl-2.5 pr-4 shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:w-auto"
                >
                  <span className={`hero-download-tile hero-download-tile--${os} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-sm font-semibold text-dash-ink">{label}</span>
                    {meta !== "" && <span className="block truncate text-xs text-muted">{meta}</span>}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </>
    );

    return (
      <div className="break-words">
        <div
          className={`rounded-[10px] border border-border bg-white p-8 shadow-sm sm:p-12 ${
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
                    className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary text-white"
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
          <p className="text-center">
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
              {content.eyebrow}
            </span>
          </p>
          <h2 className={`mt-1 text-center text-2xl font-bold ${heading}`}>{content.sectionHeading}</h2>
          {content.sectionIntro.includes("\n") ? (
            <ul className="mt-3 space-y-2 text-left text-base text-muted">
              {content.sectionIntro.split("\n").filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{renderInline(line.startsWith("• ") ? line.slice(2) : line)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-left text-base text-muted">{renderInline(content.sectionIntro)}</p>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {content.features.map((feature) => {
              const Icon = ICON_MAP[feature.icon];
              return (
                <div key={feature.title} className="rounded-[10px] border border-border bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary text-white">
                    {feature.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={feature.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className={`mt-3 text-base font-semibold ${heading}`}>{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted">{renderInline(feature.description)}</p>
                </div>
              );
            })}
          </div>

          {content.closingNote && (
            content.closingNote.includes("\n") ? (
              <div className="mt-6 space-y-2 rounded-[10px] border border-border bg-page p-4">
                {content.closingNote.split("\n").filter(Boolean).map((line, i) =>
                  line.startsWith("• ") ? (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-sm text-muted">{renderInline(line.slice(2))}</span>
                    </div>
                  ) : (
                    <p key={i} className={`text-sm font-semibold ${heading}`}>{renderInline(line)}</p>
                  )
                )}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">{content.closingNote}</p>
            )
          )}
        </div>
      </div>
    );
  }

  if (content.kind === "steps") {
    return (
      <div className="break-words rounded-[10px] border border-border bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
          {content.eyebrow}
        </span>
        <h1 className={`mt-1 text-3xl font-bold ${heading}`}>{content.heading}</h1>
        <p className="mt-3 text-base text-muted">{renderInline(content.intro)}</p>

        {content.calloutText && (
          <div className="mt-6">
            <DocsCallout tone={content.calloutTone ?? "info"}>{renderInline(content.calloutText)}</DocsCallout>
          </div>
        )}

        <div className="mt-4">
          {content.steps.map((step, i) => (
            <DocStep key={`${step.title}-${i}`} number={i + 1} title={step.title}>
              {step.body && (
                <div className="space-y-2">
                  {step.body.split("\n\n").map((para, pi) => {
                    const lines = para.split("\n");
                    const isList = lines.every((l) => l.startsWith("• "));
                    if (isList) {
                      return (
                        <ul key={pi} className="list-disc space-y-1 pl-5">
                          {lines.map((l, li) => (
                            <li key={li}>{renderInline(l.slice(2))}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={pi}>{renderInline(para)}</p>;
                  })}
                </div>
              )}
              {step.downloads && step.downloads.length > 0 && <DownloadLinks downloads={step.downloads} />}
              {step.command && <DocsCodeBlock code={step.command} output={step.output} />}
            </DocStep>
          ))}
        </div>
      </div>
    );
  }

  // sections
  return (
    <div className="break-words rounded-[10px] border border-border bg-white p-6 shadow-sm sm:p-8">
      <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
        {content.eyebrow}
      </span>
      <h1 className={`mt-1 text-3xl font-bold ${heading}`}>{content.heading}</h1>
      <p className="mt-3 text-base text-muted">{renderInline(content.intro)}</p>

      {content.calloutText && (
        <div className="mt-6">
          <DocsCallout>{renderInline(content.calloutText)}</DocsCallout>
        </div>
      )}

      <div className="mt-8 space-y-8">
        {content.sections.map((section, i) => (
          <div
            key={`${section.title}-${i}`}
            className={i < content.sections.length - 1 ? "border-b border-border pb-8" : ""}
          >
            <h2 className={`text-lg font-bold ${heading}`}>{section.title}</h2>
            {section.note && <p className="mt-2 text-sm text-muted">{renderInline(section.note)}</p>}
            {section.downloads && section.downloads.length > 0 && (
              <div className="mt-3">
                <DownloadLinks downloads={section.downloads} />
              </div>
            )}
            {section.command && (
              <div className="mt-3">
                <DocsCodeBlock code={section.command} />
              </div>
            )}
            {section.exampleCommand && (
              <details className="group mt-2 rounded-[10px] border border-border p-4">
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
