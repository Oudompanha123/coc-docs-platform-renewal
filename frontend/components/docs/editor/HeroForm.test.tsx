import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { HeroContent } from "@/lib/docs/content-types";
import { HeroForm } from "./HeroForm";

function baseHero(overrides: Partial<HeroContent> = {}): HeroContent {
  return {
    kind: "hero",
    heading: "jexmcp",
    tagline: "Tagline",
    subline: "",
    ctaLabel: "Get started",
    ctaHref: "/docs/jex3-0/get-started",
    eyebrow: "Overview",
    sectionHeading: "Section heading",
    sectionIntro: "",
    features: [],
    ...overrides,
  };
}

/** Feeds every onChange back into `value`, the way `content/[id]/page.tsx`'s
 *  own `setDraft` does — a raw `vi.fn()` spy alone leaves `value` frozen
 *  across a whole `user.type()` call, so a second keystroke's commit would
 *  overwrite the first one's field instead of accumulating onto it. */
function Controlled({ initial, onChangeSpy }: { initial: HeroContent; onChangeSpy: (next: HeroContent) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <HeroForm
      value={value}
      onChange={(next) => {
        setValue(next);
        onChangeSpy(next);
      }}
    />
  );
}

describe("HeroForm — Download buttons", () => {
  it("renders the group with the three OS rows, all empty, no errors", () => {
    render(<HeroForm value={baseHero()} onChange={vi.fn()} />);

    expect(screen.getByText("Download buttons")).toBeInTheDocument();
    expect(screen.getByText("Paste a download URL. Leave empty to hide that button.")).toBeInTheDocument();
    for (const label of ["Windows", "macOS", "Linux"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText(/must be an https/i)).not.toBeInTheDocument();
  });

  it("shows pre-existing saved URLs, and old content with no downloadButtons field at all loads with no errors", () => {
    render(
      <HeroForm
        value={baseHero({ downloadButtons: { windows: "https://example.com/app.exe" } })}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText("https://… .exe / .msi")).toHaveValue("https://example.com/app.exe");
    expect(screen.getByPlaceholderText("https://… .dmg / .pkg")).toHaveValue("");
    expect(screen.queryByText(/must be an https/i)).not.toBeInTheDocument();
  });

  it("shows an inline error for an invalid URL and never commits it via onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HeroForm value={baseHero()} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("https://… .exe / .msi"), "javascript:alert(1)");

    expect(screen.getByText("Must be an https:// URL or a path starting with /.")).toBeInTheDocument();
    for (const call of onChange.mock.calls) {
      expect((call[0] as HeroContent).downloadButtons?.windows).toBeUndefined();
    }
  });

  it("commits a valid https:// URL and clears the error", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HeroForm value={baseHero()} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("https://… .exe / .msi"), "https://example.com/app.exe");

    expect(screen.queryByText(/must be an https/i)).not.toBeInTheDocument();
    const last = onChange.mock.calls.at(-1)?.[0] as HeroContent;
    expect(last.downloadButtons?.windows).toEqual({ url: "https://example.com/app.exe" });
  });

  it("commits a relative path starting with /", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<HeroForm value={baseHero()} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("https://… .dmg / .pkg"), "/downloads/app.dmg");

    expect(screen.queryByText(/must be an https/i)).not.toBeInTheDocument();
    const last = onChange.mock.calls.at(-1)?.[0] as HeroContent;
    expect(last.downloadButtons?.macos).toEqual({ url: "/downloads/app.dmg" });
  });

  it("edits label, version and file size independently, and keeps them as plain text fields", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={baseHero()} onChangeSpy={onChange} />);

    await user.type(screen.getAllByPlaceholderText(/download for/i)[0]!, "Get it now");
    await user.type(screen.getAllByPlaceholderText("v2.1.0")[0]!, "v2.1.0");
    await user.type(screen.getAllByPlaceholderText("84 MB")[0]!, "84 MB");

    const last = onChange.mock.calls.at(-1)?.[0] as HeroContent;
    expect(last.downloadButtons?.windows).toEqual({ label: "Get it now", version: "v2.1.0", size: "84 MB" });
  });

  it("caps Version at 20 characters and File size at 12, via maxLength", () => {
    render(<HeroForm value={baseHero()} onChange={vi.fn()} />);

    for (const input of screen.getAllByPlaceholderText("v2.1.0")) {
      expect(input).toHaveAttribute("maxLength", "20");
    }
    for (const input of screen.getAllByPlaceholderText("84 MB")) {
      expect(input).toHaveAttribute("maxLength", "12");
    }
  });

  it("Show defaults to on when a URL already exists, off when nothing is saved yet", () => {
    render(
      <HeroForm
        value={baseHero({ downloadButtons: { windows: "https://example.com/app.exe" } })}
        onChange={vi.fn()}
      />,
    );

    const toggles = screen.getAllByRole("switch");
    expect(toggles[0]).toHaveAttribute("aria-checked", "true"); // Windows — has a URL
    expect(toggles[1]).toHaveAttribute("aria-checked", "false"); // macOS — nothing saved
  });

  it("toggling Show off hides the button (via onChange) without deleting the saved fields", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <HeroForm
        value={baseHero({
          downloadButtons: { windows: { url: "https://example.com/app.exe", label: "Custom", version: "v1" } },
        })}
        onChange={onChange}
      />,
    );

    await user.click(screen.getAllByRole("switch")[0]!);

    const last = onChange.mock.calls.at(-1)?.[0] as HeroContent;
    expect(last.downloadButtons?.windows).toEqual({
      url: "https://example.com/app.exe",
      label: "Custom",
      version: "v1",
      show: false,
    });
  });

  it("shows 'Add a URL to show this button' only when Show is on and the URL is empty", async () => {
    const user = userEvent.setup();
    render(<Controlled initial={baseHero({ downloadButtons: { windows: { show: true } } })} onChangeSpy={vi.fn()} />);

    expect(screen.getByText("Add a URL to show this button.")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("https://… .exe / .msi"), "https://example.com/app.exe");

    expect(screen.queryByText("Add a URL to show this button.")).not.toBeInTheDocument();
  });

  it("does not show the hint when Show is off, even with an empty URL", () => {
    render(<HeroForm value={baseHero()} onChange={vi.fn()} />);
    expect(screen.queryByText("Add a URL to show this button.")).not.toBeInTheDocument();
  });
});

describe("HeroForm — Second button", () => {
  it("starts empty when there is no second button", () => {
    render(<HeroForm value={baseHero()} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Second button label")).toHaveValue("");
    expect(screen.getByLabelText("Second button link")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a saved second button", () => {
    render(<HeroForm value={baseHero({ secondaryCta: { label: "AX Renewal", href: "/ax-renewal" } })} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Second button label")).toHaveValue("AX Renewal");
    expect(screen.getByLabelText("Second button link")).toHaveValue("/ax-renewal");
  });

  it("commits a label and a link as the second button", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled initial={baseHero()} onChangeSpy={spy} />);

    await user.type(screen.getByLabelText("Second button label"), "AX Renewal");
    await user.type(screen.getByLabelText("Second button link"), "/ax-renewal");

    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ secondaryCta: { label: "AX Renewal", href: "/ax-renewal" } }),
    );
  });

  it("clearing both fields removes the second button rather than saving an empty one", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled initial={baseHero({ secondaryCta: { label: "X", href: "/x" } })} onChangeSpy={spy} />);

    await user.clear(screen.getByLabelText("Second button label"));
    await user.clear(screen.getByLabelText("Second button link"));

    const last = spy.mock.calls.at(-1)?.[0] as HeroContent;
    expect("secondaryCta" in last).toBe(false);
  });

  it("warns about a link it would not show", () => {
    render(<HeroForm value={baseHero({ secondaryCta: { label: "AX Renewal", href: "http://localhost:3000/ax-renewal" } })} onChange={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Use a path starting with / or an https:// URL");
  });
});
