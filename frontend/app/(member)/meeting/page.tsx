"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

/**
 * The AX team share-out, as a slide deck rather than a scrolling page.
 *
 * <p>Sits under `(member)` so it inherits that group's SessionProvider and
 * RequireMemberSession gate — signing in is the only thing between a
 * teammate and this deck. Deliberately NOT under `(shell)`: that group wraps
 * everything in the admin sidebar and topbar, which is chrome nobody wants
 * on a projector, and it is admin-only, which would shut out the `user`-role
 * teammates who are presenting.
 *
 * <p><b>One idea per screen, advanced by arrow key.</b> A deck and a long
 * page carry the same words, but a room reads them differently: a page
 * invites everyone to scroll ahead and stop listening, and a slide holds
 * one thought until the speaker is done with it. Arrow keys, space, and
 * on-screen buttons all work, because presenters reach for different ones
 * and finding out which in front of an audience is not the moment.
 *
 * <p><b>The presenter prompts are questions, not claims.</b> Nobody has told
 * this deck what any individual actually learned, so it must not put words
 * in their mouth. The harness numbers, by contrast, are read off this
 * repository (`.claude/skills/`, `.claude/agents/`) and are safe to assert.
 */
export default function MeetingDeck() {
  const [index, setIndex] = useState(0);
  const total = SLIDES.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(total - 1, Math.max(0, i + delta))),
    [total],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        setIndex(0);
      } else if (e.key === "End") {
        setIndex(total - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  // `go` clamps to [0, total-1], so this can never actually miss — the
  // fallback is here because the compiler cannot see that, and an
  // assertion would hide a real out-of-range bug if the clamp ever changed.
  const Slide = SLIDES[index] ?? TitleSlide;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-12 sm:px-10">
        <div className="w-full max-w-4xl">
          <Slide />
        </div>
      </main>

      {/* --- Controls, kept quiet at the bottom -------------------------- */}
      <footer className="flex items-center justify-between border-t border-border px-6 py-3 sm:px-10">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === index ? "w-6 bg-brand-purple" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous slide"
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-dash-ink transition-colors hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple disabled:cursor-not-allowed disabled:text-muted/50"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === total - 1}
            aria-label="Next slide"
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-dash-ink transition-colors hover:bg-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple disabled:cursor-not-allowed disabled:text-muted/50"
          >
            →
          </button>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-purple">{children}</p>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-3 text-3xl font-extrabold leading-tight text-dash-ink sm:text-4xl">
      {children}
    </h2>
  );
}

/** A box in a diagram. `tone` marks who owns that step. */
function Node({ label, tone = "ai" }: { label: string; tone?: "ai" | "human" | "plain" }) {
  const styles = {
    ai: "border-brand-purple/30 bg-brand-purple/5 text-brand-purple",
    human: "border-brand-blue/40 bg-brand-blue/10 text-brand-blue",
    plain: "border-border bg-white text-dash-ink",
  }[tone];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-center text-sm font-semibold sm:text-base ${styles}`}
    >
      {label}
    </span>
  );
}

/** Connector between diagram nodes. Rotates to vertical when the row stacks. */
function Arrow() {
  return (
    <span aria-hidden="true" className="text-lg text-muted/60 sm:text-xl">
      <span className="hidden sm:inline">→</span>
      <span className="sm:hidden">↓</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------

function TitleSlide() {
  return (
    <div className="text-center">
      <Eyebrow>[AX] Flow Parallel</Eyebrow>
      <h1 className="mt-5 text-4xl font-extrabold leading-tight text-dash-ink sm:text-6xl">
        How we work with AI
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
        What we learned, what we tried, and what we do next.
      </p>
      <p className="mt-10 text-sm text-muted">Wednesday, 23 September 2026</p>
    </div>
  );
}

const AGENDA = [
  "What we learned about AI and the Harness (A2A)",
  "Our research, findings, and real experience",
  "How we apply AI and the Harness to our projects",
  "Project Domo — discuss and collaborate",
];

function AgendaSlide() {
  return (
    <div>
      <Eyebrow>Today</Eyebrow>
      <Title>Four things</Title>
      <ol className="mt-10 space-y-5">
        {AGENDA.map((item, i) => (
          <li key={item} className="flex items-start gap-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-base font-bold text-brand-purple">
              {i + 1}
            </span>
            <p className="pt-1 text-lg text-dash-ink sm:text-xl">{item}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

const HARNESS_FACTS = [
  { value: "10", label: "Skills", detail: "Plan → requirements → design → build → review → finalize" },
  { value: "13", label: "Agent roles", detail: "Architect, backend, frontend, reviewer, security, QA, docs…" },
  { value: "3", label: "Human gates", detail: "A person approves. Never the AI." },
];

function HarnessSlide() {
  return (
    <div>
      <Eyebrow>Shared words</Eyebrow>
      <Title>What the harness is</Title>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {HARNESS_FACTS.map((fact) => (
          <div key={fact.label} className="rounded-xl border border-border p-6">
            <p className="text-5xl font-extrabold text-brand-purple">{fact.value}</p>
            <p className="mt-2 text-base font-bold text-dash-ink">{fact.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{fact.detail}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 border-l-[3px] border-brand-blue pl-5 text-lg leading-relaxed text-dash-ink">
        The harness is not about the AI writing more code. It is about the work leaving a trail —
        a decision becomes a document, a requirement gets an ID, and a person signs off.
      </p>
    </div>
  );
}

const PIPELINE = ["Plan", "Requirements", "Design", "Build", "Review"];

/** Which pipeline step each human gate sits after — index into PIPELINE. */
const GATES: Record<number, string> = { 1: "G1", 2: "G2", 4: "G3" };

function WorkflowSlide() {
  return (
    <div>
      <Eyebrow>Diagram — the flow</Eyebrow>
      <Title>AI does the work. We decide.</Title>

      <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-2">
        {PIPELINE.map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-3 sm:flex-row sm:gap-2">
            <div className="flex flex-col items-center gap-2">
              <Node label={step} />
              {GATES[i] ? (
                <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-bold text-brand-blue">
                  {GATES[i]} · human
                </span>
              ) : (
                // Keeps every column the same height so the boxes stay on one
                // baseline whether or not a gate hangs beneath them.
                <span aria-hidden="true" className="h-[22px]" />
              )}
            </div>
            {i < PIPELINE.length - 1 && <Arrow />}
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-purple/30 bg-brand-purple/5 p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-purple">The AI does</p>
          <ul className="mt-3 space-y-2 text-base text-dash-ink">
            <li>Drafts the plan, the code, the tests</li>
            <li>Writes down why, as an ADR</li>
            <li>Reviews its own work first</li>
          </ul>
        </div>
        <div className="rounded-xl border border-brand-blue/40 bg-brand-blue/10 p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-blue">We decide</p>
          <ul className="mt-3 space-y-2 text-base text-dash-ink">
            <li>Is this the right problem?</li>
            <li>Is this design the one we want?</li>
            <li>Approve the gate — or send it back</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const AGENTS = ["Architect", "Backend", "Frontend", "Security", "QA"];

function A2ASlide() {
  return (
    <div>
      <Eyebrow>Diagram — A2A</Eyebrow>
      <Title>Agents talk to each other, not only to us</Title>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Node label="One request from us" tone="human" />
        <span aria-hidden="true" className="text-xl text-muted/60">
          ↓
        </span>
        <Node label="Team Leader" tone="plain" />

        {/* The fan-out. A plain wrapping row rather than drawn connectors:
            five labelled boxes side by side read as "at the same time"
            without needing lines, and it survives a narrow screen. */}
        <span aria-hidden="true" className="text-xl text-muted/60">
          ↓
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {AGENTS.map((agent) => (
            <Node key={agent} label={agent} />
          ))}
        </div>
        <p className="text-sm font-medium text-muted">…all working at the same time</p>

        <span aria-hidden="true" className="text-xl text-muted/60">
          ↓
        </span>
        <Node label="One report back" tone="plain" />
        <span aria-hidden="true" className="text-xl text-muted/60">
          ↓
        </span>
        <Node label="We read it and decide" tone="human" />
      </div>

      <p className="mt-10 text-center text-lg text-muted">
        Five specialists, one conversation to follow — not five.
      </p>
    </div>
  );
}

/**
 * The five presenting members of [AX] Flow Parallel, in speaking order.
 * Taken from the Flow project's own participant list; the two members who
 * are not presenting are absent rather than listed and greyed out.
 */
const PRESENTERS = [
  { korean: "짠티", english: "NEO CHANTHY" },
  { korean: "빤냐", english: "PANHA" },
  { korean: "소판나", english: "SAM SOPHANNA" },
  { korean: "파커", english: "EK SARAYUTH" },
  { korean: "슬리", english: "LONG SREYLY" },
];

function PresentersSlide() {
  return (
    <div>
      <Eyebrow>Over to you</Eyebrow>
      <Title>Who shares what</Title>
      <p className="mt-3 text-lg text-muted">
        A few minutes each — what you tried, what worked, what you would use again.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PRESENTERS.map((person, i) => (
          <div
            key={person.english}
            className="flex items-center gap-4 rounded-xl border border-border p-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-base font-bold text-white">
              {i + 1}
            </span>
            <div>
              {/* Pretendard, not Inter: Inter carries no Hangul and the
                  browser would silently fall back to whatever it has. */}
              <p className="font-pretendard text-lg font-bold text-dash-ink">{person.korean}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {person.english}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SLIDES = [
  TitleSlide,
  AgendaSlide,
  HarnessSlide,
  WorkflowSlide,
  A2ASlide,
  PresentersSlide,
];
