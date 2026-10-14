---
name: coc-docs-blog-10-free-community-registries
description: Design system skill for coc-docs. Activate when building UI components, pages, or any visual elements. Provides exact color tokens, typography scale, spacing grid, component patterns, and craft rules. Read references/DESIGN.md before writing any CSS or JSX. For motion and layout details, read references/ANIMATIONS.md, references/LAYOUT.md, references/COMPONENTS.md, and references/INTERACTIONS.md for full motion and layout details.
---

# coc-docs Design System

You are building UI for **coc-docs**. Dark-themed, warm palette, sans-serif typography (calSansHeading), compact density on a 4px grid, expressive motion.

## Reference Files

This package includes extended documentation. **Read these files before implementing:**

| File | Contents |
|------|----------|
| `references/DESIGN.md` | Full design system tokens, colors, typography, spacing |
| `references/ANIMATIONS.md` | CSS keyframes, scroll triggers, motion library stack, video specs |
| `references/LAYOUT.md` | Flex/grid containers, page structure, spacing relationships |
| `references/COMPONENTS.md` | DOM component patterns, HTML structure, class fingerprints |
| `references/INTERACTIONS.md` | Hover/focus states with before/after style diffs |

### Animation Stack Detected

- **Web Animations API (1 active)** — animation

## Design Philosophy

- **Layered depth** — use shadow tokens to create a sense of physical layering. Each elevation level has a specific shadow.
- **Gradient accents** — gradients are used thoughtfully for emphasis, not decoration.
- **Type pairing** — calSansHeading for body/UI text, Inter for headings/display. Never introduce a third typeface.
- **compact density** — 4px base grid. Every dimension is a multiple of 4.
- **warm palette** — the color temperature runs warm, matching the sans-serif typography.
- **Restrained accent** — `#ff667f` is the only pop of color. Used exclusively for CTAs, links, focus rings, and active states.
- **Expressive motion** — animations are an integral part of the experience. Use spring physics and layout animations.

## Color System

### Core Palette

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Background | `--background` | `#000000` | Page/app background |
| Surface | `--surface` | `#18181b` | Cards, panels, modals |
| Text Primary | `--text-primary` | `#ffffff` | Headings, body text |
| Text Muted | `--text-muted` | `#3f3f46` | Captions, placeholders |
| Accent | `--accent` | `#ff667f` | CTAs, links, focus rings |
| Border | `--border` | `#27272a` | Dividers, card borders |

### Status Colors

| Status | Hex | Use |
|--------|-----|-----|
| Success | `#f0fdf4` | Confirmations, positive trends |
| Danger | `#fef2f2` | Errors, destructive actions |

### Extended Palette

- **color-slate-200:** `#e2e8f0` — Light surface or highlight color
- **color-gray-300:** `#d1d5dc`
- **color-zinc-950:** `#09090b` — Deep background layer or shadow color
- **color-red-950:** `#460809`
- **color-green-600:** `#00a544`
- **color-sky-400:** `#00bcfe`
- **color-sky-600:** `#0084cc`
- **color-zinc-500:** `#71717b`

### CSS Variable Tokens

```css
--color-background: var(--background);
--color-muted: var(--muted);
--color-border: var(--border);
--card-spacing: calc(var(--spacing)*6);
--primary: var(--color-emerald-500);
--primary: var(--color-indigo-500);
--primary: var(--color-indigo-500);
--card-spacing: calc(var(--spacing)*4);
--card: #fff;
--card-foreground: #0a0a0a;
--popover: #fff;
--popover-foreground: #0a0a0a;
--primary: #171717;
--primary-foreground: #fafafa;
--secondary: #f5f5f5;
--secondary-foreground: #171717;
--muted: #f5f5f5;
--muted-foreground: #737373;
--accent: #f5f5f5;
--accent-foreground: #171717;
```

## Typography

### Font Stack

- **calSansHeading** — Heading 1, Heading 2
- **Inter** — Body, Caption
- **SFMono-Regular** — Code

### Font Sources

```css
@font-face {
  font-family: "Inter";
  src: url("fonts/Inter-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Inter";
  src: url("fonts/Inter-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "calSansHeading";
  src: url("fonts/calSansHeading-600.woff2") format("woff2");
  font-weight: 600;
}
@font-face {
  font-family: "Mynerve";
  src: url("fonts/Mynerve-Regular.ttf") format("truetype");
  font-weight: 400;
}
```

### Type Scale

| Role | Family | Size | Weight |
|------|--------|------|--------|
| Heading 1 | calSansHeading | clamp(3rem,15vw,15rem) | 700 |
| Heading 2 | calSansHeading | 2.75rem | 700 |
| Body | Inter | 13px | 400 |
| Caption | Inter | 15px | 400 |
| Code | SFMono-Regular | 14px | 400 |

### Typography Rules

- Body/UI: **calSansHeading**, Headings: **Inter** — these are the only display fonts
- Max 3-4 font sizes per screen
- Headings: weight 600-700, body: weight 400
- Use color and opacity for text hierarchy, not additional font sizes
- Line height: 1.5 for body, 1.2 for headings

## Spacing & Layout

### Base Grid: 4px

Every dimension (margin, padding, gap, width, height) must be a multiple of **4px**.

### Spacing Scale

`2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 32` px

### Spacing as Meaning

| Spacing | Use |
|---------|-----|
| 4-8px | Tight: related items (icon + label, avatar + name) |
| 12-16px | Medium: between groups within a section |
| 24-32px | Wide: between distinct sections |
| 48px+ | Vast: major page section breaks |

### Border Radius

Scale: `.25rem, .3125rem, .375rem, 2px, 3px, 4px, 5px, 6px, 7.2px, 11.2px, 15.2px, 19.2px, 22%, 23.2px, 23.2px 23.2px 0px 0px, 24%, 24px, 26%, 60px, inherit`
Default: `15.2px`

### Container

Max-width: `1350px`, centered with auto margins.

### Breakpoints

| Name | Value |
|------|-------|
| sm | 40rem |
| md | 48rem |
| lg | 64rem |
| xl | 80rem |
| 2xl | 96rem |
| xs | 400px |
| 2xl | 1500px |

Mobile-first: design for small screens, layer on responsive overrides.

## Component Patterns

### Card

```css
.card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 16px;
  box-shadow: 0 0 0 1px var(--tw-prose-kbd-shadows),0 3px 0 var(--tw-prose-kbd-shadows);
}
```

```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>
```

### Button

```css
/* Primary */
.btn-primary {
  background: #ff667f;
  color: #ffffff;
  border-radius: 15.2px;
  padding: 8px 16px;
  font-weight: 500;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.9; }

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid #27272a;
  color: #ffffff;
  border-radius: 15.2px;
  padding: 8px 16px;
}
```

```html
<button class="btn-primary">Get Started</button>
<button class="btn-ghost">Learn More</button>
```

### Input

```css
.input {
  background: #000000;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 14px;
}
.input:focus { border-color: #ff667f; outline: none; }
```

```html
<input class="input" type="text" placeholder="Search..." />
```

### Badge / Chip

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: #18181b;
  color: #3f3f46;
}
```

```html
<span class="badge">New</span>
<span class="badge">Beta</span>
```

### Modal / Dialog

```css
.modal-backdrop { background: rgba(0, 0, 0, 0.6); }
.modal {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: inherit;
  padding: 24px;
  max-width: 480px;
  width: 90vw;
  box-shadow: 0 0 10px var(--color-blue-500),0 0 5px var(--color-blue-500);
}
```

```html
<div class="modal-backdrop">
  <div class="modal">
    <h2>Dialog Title</h2>
    <p>Dialog content.</p>
    <button class="btn-primary">Confirm</button>
    <button class="btn-ghost">Cancel</button>
  </div>
</div>
```

### Table

```css
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 500;
  font-size: 12px;
  color: #3f3f46;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #27272a;
}
.table td {
  padding: 12px;
  border-bottom: 1px solid #27272a;
}
```

```html
<table class="table">
  <thead><tr><th>Name</th><th>Status</th><th>Date</th></tr></thead>
  <tbody>
    <tr><td>Item One</td><td>Active</td><td>Jan 1</td></tr>
    <tr><td>Item Two</td><td>Pending</td><td>Jan 2</td></tr>
  </tbody>
</table>
```

### Navigation

```css
.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #27272a;
}
.nav-link {
  color: #3f3f46;
  padding: 8px 12px;
  border-radius: 15.2px;
  transition: color 150ms;
}
.nav-link:hover { color: #ffffff; }
.nav-link.active { color: #ff667f; }
```

```html
<nav class="nav">
  <a href="/" class="nav-link active">Home</a>
  <a href="/about" class="nav-link">About</a>
  <a href="/pricing" class="nav-link">Pricing</a>
  <button class="btn-primary" style="margin-left: auto">Get Started</button>
</nav>
```

### Components

These components were found in the codebase:

**Button** (`html`)

**Input** (`html`)

**Card** (`html`)
- Variants: `foreground`, `spacing)`, `header`

**Navigation** (`html`)

**List** (`html`)

## Page Structure

The following page sections were detected:

- **Navigation** — Top navigation bar (4 items)
- **Hero** — Hero section (detected from heading structure)
- **Faq** — FAQ/accordion section
- **Footer** — Page footer with links and info (156 items)
- **Cards** — Grid of 4 card elements (4 items)

When building pages, follow this section order and structure.

## Animation & Motion

This project uses **expressive motion**. Animations are part of the design language.

### CSS Animations

- `embla-progress`
- `spin`
- `ping`
- `pulse`
- `bounce`

### Motion Tokens

- **Duration scale:** `.1s`, `.15s`, `.2s`, `.3s`, `.4s`, `.5s`, `.7s`, `1s`, `75ms`
- **Easing functions:** `cubic-bezier(.16,1,.3,1)`, `cubic-bezier(.22,1,.36,1)`, `linear`, `cubic-bezier(.7,0,.84,0)`, `cubic-bezier(.23,1,.32,1)`, `cubic-bezier(.8,0,1,1)`, `cubic-bezier(0,0,.2,1)`

### Motion Guidelines

- **Duration:** Use values from the duration scale above. Short (.1s) for micro-interactions, long (75ms) for page transitions
- **Easing:** Use `cubic-bezier(.16,1,.3,1)` as the default easing curve
- **Direction:** Elements enter from bottom/right, exit to top/left
- **Reduced motion:** Always respect `prefers-reduced-motion` — disable animations when set

## Dark Mode

This project supports **light and dark mode** via CSS variables.

### Token Mapping

| Variable | Light | Dark |
|----------|-------|------|
| `--card` | `lab(100% 0 0)` | `lab(7.78201% -.0000149012 0)` |
| `--card-foreground` | `lab(2.75381% 0 0)` | `lab(98.26% 0 0)` |
| `--popover` | `lab(100% 0 0)` | `lab(7.78201% -.0000149012 0)` |
| `--popover-foreground` | `lab(2.75381% 0 0)` | `lab(98.26% 0 0)` |
| `--primary` | `lab(7.78201% -.0000149012 0)` | `lab(90.952% 0 -.0000119209)` |
| `--primary-foreground` | `lab(98.26% 0 0)` | `lab(7.78201% -.0000149012 0)` |
| `--secondary` | `lab(96.52% -.0000298023 .0000119209)` | `lab(15.204% 0 -.00000596046)` |
| `--secondary-foreground` | `lab(7.78201% -.0000149012 0)` | `lab(98.26% 0 0)` |
| `--muted` | `lab(96.52% -.0000298023 .0000119209)` | `lab(15.204% 0 -.00000596046)` |
| `--muted-foreground` | `lab(48.496% 0 0)` | `lab(66.128% -.0000298023 .0000119209)` |
| `--accent` | `lab(96.52% -.0000298023 .0000119209)` | `lab(15.204% 0 -.00000596046)` |
| `--accent-foreground` | `lab(7.78201% -.0000149012 0)` | `lab(98.26% 0 0)` |
| `--destructive` | `lab(48.4493% 77.4328 61.5452)` | `lab(63.7053% 60.745 31.3109)` |
| `--border` | `lab(90.952% 0 -.0000119209)` | `lab(100% 0 0/.1)` |
| `--input` | `lab(90.952% 0 -.0000119209)` | `lab(100% 0 0/.15)` |

### Implementation

- Toggle via `.dark` class on `<html>` or `[data-theme="dark"]`
- Always use CSS variables for colors — never hardcode hex values
- Test both modes for contrast and readability

## Depth & Elevation

### Shadow Tokens

- Subtle: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
- Raised (cards, buttons): `0 0 0 1px var(--tw-prose-kbd-shadows),0 3px 0 var(--tw-prose-kbd-shadows)`
- Raised (cards, buttons): `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.145 -0.00000143796 0.00000340492 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px`
- Floating (dropdowns, popovers): `0 0 10px var(--color-blue-500),0 0 5px var(--color-blue-500)`

### Z-Index Scale

`0, 1, 10, 20, 30, 40, 50, 999, 1600, 9999999`

Use these exact values — never invent z-index values.

## Anti-Patterns (Never Do)

- **No zebra striping** — tables and lists use borders for separation
- **No invented colors** — every hex value must come from the palette above
- **No arbitrary spacing** — every dimension is a multiple of 4px
- **No extra fonts** — only calSansHeading and Inter and SFMono-Regular are allowed
- **No arbitrary border-radius** — use the scale: .25rem, .3125rem, .375rem, 2px, 3px, 4px, 5px, 6px, 7.2px, 11.2px
- **No opacity for disabled states** — use muted colors instead

## Workflow

1. **Read** `references/DESIGN.md` before writing any UI code
2. **Pick colors** from the Color System section — never invent new ones
3. **Set typography** — calSansHeading, Inter, SFMono-Regular only, using the type scale
4. **Build layout** on the 4px grid — check every margin, padding, gap
5. **Match components** to patterns above before creating new ones
6. **Apply elevation** — use shadow tokens
7. **Validate** — every value traces back to a design token. No magic numbers.

## Brand Spec

- **Favicon:** `/favicon.ico`
- **Brand color:** `#ff667f`
- **Brand typeface:** calSansHeading

## Quick Reference

```
Background:     #000000
Surface:        #18181b
Text:           #ffffff / #3f3f46
Accent:         #ff667f
Border:         #27272a
Font:           calSansHeading
Spacing:        4px grid
Radius:         15.2px
Components:     10 detected
```

## When to Trigger

Activate this skill when:
- Creating new components, pages, or visual elements for coc-docs
- Writing CSS, Tailwind classes, styled-components, or inline styles
- Building page layouts, templates, or responsive designs
- Reviewing UI code for design consistency
- The user mentions "coc-docs" design, style, UI, or theme
- Generating mockups, wireframes, or visual prototypes

---

# Full Reference Files

> Every output file is embedded below. Claude has full design system context from /skills alone.

## Design System Tokens (DESIGN.md)

# coc-docs DESIGN.md

> Auto-generated design system.
> Frameworks: None detected
> Colors: 20 · Fonts: 3 · Components: 10
> Icon library: not detected · State: not detected
> Primary theme: dark · Dark mode toggle: yes · Motion: expressive

---

## 1. Visual Theme & Atmosphere

This is a **dark-themed** interface with a warm tone. Depth is expressed through layered shadows and subtle surface color variation. Typography pairs **Inter** for display/headings with **calSansHeading** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **4px base grid** (compact density), with scale: 2, 4, 6, 8, 10, 12, 14, 16px. The accent color **#ff667f** anchors interactive elements (buttons, links, focus rings). Motion is expressive — spring physics, layout animations, and staggered reveals are part of the visual language.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| color-black | `#000000` | background | Page background, darkest surface |
| color-zinc-900 | `#18181b` | surface | Card and panel backgrounds |
| tw-ring-offset-color | `#ffffff` | text-primary | Headings and body text |
| color-zinc-700 | `#3f3f46` | text-muted | Captions, placeholders, secondary info |
| color-zinc-800 | `#27272a` | border | Dividers, card borders, outlines |
| color-rose-400 | `#ff667f` | accent | CTAs, links, focus rings, active states |
| color-red-50 | `#fef2f2` | danger | Error states, destructive actions |
| color-green-50 | `#f0fdf4` | success | Success states, positive indicators |
| color-slate-200 | `#e2e8f0` | info | Informational highlights |
| color-gray-300 | `#d1d5dc` | unknown | Palette color |
| color-zinc-950 | `#09090b` | unknown | Palette color |
| color-red-950 | `#460809` | unknown | Palette color |
| color-green-600 | `#00a544` | unknown | Palette color |
| color-sky-400 | `#00bcfe` | unknown | Palette color |
| color-sky-600 | `#0084cc` | unknown | Palette color |
| color-zinc-500 | `#71717b` | unknown | Palette color |
| color-rose-600 | `#e70044` | unknown | Palette color |
| color-gray-900 | `#101828` | unknown | Palette color |
| color-zinc-400 | `#9f9fa9` | unknown | Palette color |
| color-orange-900 | `#7e2a0c` | unknown | Palette color |

### Dark Mode Token Mapping

| Variable | Light | Dark |
|---|---|---|
| `--card` | `lab(100% 0 0)` | `lab(7.78201% -.0000149012 0)` |
| `--card-foreground` | `lab(2.75381% 0 0)` | `lab(98.26% 0 0)` |
| `--popover` | `lab(100% 0 0)` | `lab(7.78201% -.0000149012 0)` |
| `--popover-foreground` | `lab(2.75381% 0 0)` | `lab(98.26% 0 0)` |
| `--primary` | `lab(7.78201% -.0000149012 0)` | `lab(90.952% 0 -.0000119209)` |
| `--primary-foreground` | `lab(98.26% 0 0)` | `lab(7.78201% -.0000149012 0)` |
| `--secondary` | `lab(96.52% -.0000298023 .0000119209)` | `lab(15.204% 0 -.00000596046)` |
| `--secondary-foreground` | `lab(7.78201% -.0000149012 0)` | `lab(98.26% 0 0)` |
| `--muted` | `lab(96.52% -.0000298023 .0000119209)` | `lab(15.204% 0 -.00000596046)` |
| `--muted-foreground` | `lab(48.496% 0 0)` | `lab(66.128% -.0000298023 .0000119209)` |
| `--accent` | `lab(96.52% -.0000298023 .0000119209)` | `lab(15.204% 0 -.00000596046)` |
| `--accent-foreground` | `lab(7.78201% -.0000149012 0)` | `lab(98.26% 0 0)` |
| `--destructive` | `lab(48.4493% 77.4328 61.5452)` | `lab(63.7053% 60.745 31.3109)` |
| `--border` | `lab(90.952% 0 -.0000119209)` | `lab(100% 0 0/.1)` |
| `--input` | `lab(90.952% 0 -.0000119209)` | `lab(100% 0 0/.15)` |
| `--ring` | `lab(66.128% -.0000298023 .0000119209)` | `lab(48.496% 0 0)` |
| `--sidebar` | `lab(98.26% 0 0)` | `lab(7.78201% -.0000149012 0)` |
| `--sidebar-foreground` | `lab(2.75381% 0 0)` | `lab(98.26% 0 0)` |
| `--sidebar-primary` | `lab(7.78201% -.0000149012 0)` | `lab(36.9089% 35.0961 -85.6872)` |
| `--sidebar-accent` | `lab(96.52% -.0000298023 .0000119209)` | `lab(15.204% 0 -.00000596046)` |

### CSS Variable Tokens

```css
--tw-border-style: solid;
--color-background: var(--background);
--color-muted: var(--muted);
--color-border: var(--border);
--tw-prose-quote-borders: #e5e7eb;
--tw-prose-th-borders: #d1d5dc;
--tw-prose-td-borders: #e5e7eb;
--tw-prose-invert-quote-borders: #364153;
--tw-prose-invert-th-borders: #4a5565;
--tw-prose-invert-td-borders: #364153;
--tw-prose-quote-borders: lab(91.6229% -.159115-2.26791);
--tw-prose-th-borders: lab(85.1236% -.612259-3.7138);
--tw-prose-td-borders: lab(91.6229% -.159115-2.26791);
--tw-prose-invert-quote-borders: lab(27.1134% -.956401-12.3224);
--tw-prose-invert-th-borders: lab(35.6337% -1.58697-10.8425);
--tw-prose-invert-td-borders: lab(27.1134% -.956401-12.3224);
--tw-border-style: dashed;
--tw-border-style: dashed;
--tw-border-style: none;
--tw-prose-quote-borders: #e5e5e5;
```

---

## 3. Typography Rules

**Font Stack:**
- **calSansHeading** — Heading 1, Heading 2
- **Inter** — Body, Caption
- **SFMono-Regular** — Code

**Font Sources:**

```css
@font-face {
  font-family: "Inter";
  src: url("fonts/Inter-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Inter";
  src: url("fonts/Inter-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "calSansHeading";
  src: url("fonts/calSansHeading-600.woff2") format("woff2");
  font-weight: 600;
}
@font-face {
  font-family: "Mynerve";
  src: url("fonts/Mynerve-Regular.ttf") format("truetype");
  font-weight: 400;
}
```

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | calSansHeading | clamp(3rem,15vw,15rem) | 700 |
| Heading 2 | calSansHeading | 2.75rem | 700 |
| Body | Inter | 13px | 400 |
| Caption | Inter | 15px | 400 |
| Code | SFMono-Regular | 14px | 400 |

**Typographic Rules:**
- Limit to 3 font families max per screen
- Use **calSansHeading** for body/UI text, **Inter** for display/headings
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes

---

## 4. Component Stylings

### Layout (1)

**Footer** — `html`

### Navigation (1)

**Navigation** — `html`

### Data Display (3)

**Card** — `html`
- Variants: `foreground`, `spacing)`, `header`

**Badge** — `html`

**List** — `html`

### Data Input (2)

**Button** — `html`
- Animation: 

**Input** — `html`
- State: :focus, :placeholder

### Overlay (1)

**Modal** — `html`

### Media (2)

**Image** — `html`

**Icon** — `html`

---

## 5. Layout Principles

- **Base spacing unit:** 4px
- **Spacing scale:** 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 32
- **Border radius:** .25rem, .3125rem, .375rem, 2px, 3px, 4px, 5px, 6px, 7.2px, 11.2px, 15.2px, 19.2px, 22%, 23.2px, 23.2px 23.2px 0px 0px, 24%, 24px, 26%, 60px, inherit
- **Max content width:** 1350px

**Spacing as Meaning:**
| Spacing | Use |
|---|---|
| 4-8px | Tight: related items within a group |
| 12-16px | Medium: between groups |
| 24-32px | Wide: between sections |
| 48px+ | Vast: major section breaks |

---

## 6. Depth & Elevation

### Flat — subtle depth hints

- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`

### Raised — cards, buttons, interactive elements

- `0 0 0 1px var(--tw-prose-kbd-shadows),0 3px 0 var(--tw-prose-kbd-shadows)`
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.145 -0.00000143796 0.00000340492 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px`

### Floating — dropdowns, popovers, modals

- `0 0 10px var(--color-blue-500),0 0 5px var(--color-blue-500)`

### Z-Index Scale

`0, 1, 10, 20, 30, 40, 50, 999, 1600, 9999999`

---

## 7. Animation & Motion

This project uses **expressive motion**. Animations are an integral part of the experience.

### CSS Animations

- `@keyframes embla-progress`
- `@keyframes spin`
- `@keyframes ping`
- `@keyframes pulse`
- `@keyframes bounce`
- `@keyframes enter`
- `@keyframes exit`
- `@keyframes accordion-down`

### Animated Components

- **Button**: 

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`

---

## 8. Do's and Don'ts

### Do's

- Use `#ff667f` for interactive elements (buttons, links, focus rings)
- Use `#000000` as the primary page background
- Pair **calSansHeading** (body) with **Inter** (display) — these are the only allowed fonts
- Follow the **4px** spacing grid for all margins, padding, and gaps
- Use the defined shadow tokens for elevation — see Section 6
- Use border-radius from the scale: .25rem, .3125rem, .375rem, 2px, 3px
- Reuse existing components from Section 4 before creating new ones
- Always use CSS variables for colors — never hardcode hex
- Test both light and dark modes for contrast

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't introduce additional font families beyond calSansHeading and Inter and SFMono-Regular
- Don't use arbitrary spacing values — stick to multiples of 4px
- Don't create custom box-shadow values outside the system tokens
- Don't use arbitrary border-radius values — pick from the defined scale
- Don't duplicate component patterns — check Section 4 first

---

## 9. Responsive Behavior

| Name | Value | Source |
|---|---|---|
| sm | 40rem | css |
| md | 48rem | css |
| lg | 64rem | css |
| xl | 80rem | css |
| 2xl | 96rem | css |
| xs | 400px | css |
| 2xl | 1500px | css |

**Approach:** Use `@media (min-width: ...)` queries matching the breakpoints above.

---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #18181b
Border: 1px solid #27272a
Radius: 15.2px
Padding: 16px
Font: calSansHeading
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #ff667f, text white
Ghost: bg transparent, border #27272a
Padding: 8px 16px
Radius: 15.2px
Hover: opacity 0.9 or lighter shade
Focus: ring with #ff667f
```

### Build a Page Layout

```
Background: #000000
Max-width: 1350px, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #18181b
Label: #3f3f46 (muted, 12px, uppercase)
Value: #ffffff (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #000000
Input border: 1px solid #27272a
Focus: border-color #ff667f
Label: #3f3f46 12px
Spacing: 16px between fields
Radius: 15.2px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: calSansHeading, type scale from Section 3
4. Spacing: 4px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```

# Animation Reference

> Follow these specs exactly to recreate the experience.

## Motion Technology Stack

| Library | Type | Notes |
|---------|------|-------|
| **Web Animations API (1 active)** | animation |  |

## Scroll Animation Patterns

| Pattern | Library | Element Count | Duration | Delay | Easing |
|---------|---------|---------------|----------|-------|--------|
| parallax / sticky scroll | CSS | 1 | — | — | — |

### CSS Implementation

## CSS Keyframes (25)

### `@keyframes embla-progress`

Duration: `auto` · Easing: `linear` · Delay: `0s` · Iteration: `1` · Fill: `forwards`

Used by: `.embla__progress__bar`

```css
@keyframes embla-progress {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}
```

> Transform/motion animation

### `@keyframes swipe-out-left`

Used by: `[data-sonner-toast][data-swipe-out="true"][data-swipe-direction="left"]`

```css
@keyframes swipe-out-left {
  0% {
    transform: var(--y) translateX(var(--swipe-amount-x));
    opacity: 1;
  }
  100% {
    transform: var(--y) translateX(calc(var(--swipe-amount-x) - 100%));
    opacity: 0;
  }
}
```

> Fade + motion enter animation

### `@keyframes swipe-out-right`

Used by: `[data-sonner-toast][data-swipe-out="true"][data-swipe-direction="right"]`

```css
@keyframes swipe-out-right {
  0% {
    transform: var(--y) translateX(var(--swipe-amount-x));
    opacity: 1;
  }
  100% {
    transform: var(--y) translateX(calc(var(--swipe-amount-x) + 100%));
    opacity: 0;
  }
}
```

> Fade + motion enter animation

### `@keyframes swipe-out-up`

Used by: `[data-sonner-toast][data-swipe-out="true"][data-swipe-direction="up"]`

```css
@keyframes swipe-out-up {
  0% {
    transform: var(--y) translateY(var(--swipe-amount-y));
    opacity: 1;
  }
  100% {
    transform: var(--y) translateY(calc(var(--swipe-amount-y) - 100%));
    opacity: 0;
  }
}
```

> Fade + motion enter animation

### `@keyframes swipe-out-down`

Used by: `[data-sonner-toast][data-swipe-out="true"][data-swipe-direction="down"]`

```css
@keyframes swipe-out-down {
  0% {
    transform: var(--y) translateY(var(--swipe-amount-y));
    opacity: 1;
  }
  100% {
    transform: var(--y) translateY(calc(var(--swipe-amount-y) + 100%));
    opacity: 0;
  }
}
```

> Fade + motion enter animation

### `@keyframes sonner-fade-in`

Duration: `0.3s` · Easing: `ease` · Delay: `0s` · Iteration: `1` · Fill: `forwards`

Used by: `[data-sonner-toast][data-promise="true"] [data-icon] > svg`

```css
@keyframes sonner-fade-in {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

> Fade + motion enter animation

### `@keyframes sonner-fade-out`

Duration: `0.2s` · Easing: `ease` · Delay: `0s` · Iteration: `1` · Fill: `forwards`

Used by: `.sonner-loading-wrapper[data-visible="false"]`

```css
@keyframes sonner-fade-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}
```

> Fade + motion enter animation

### `@keyframes sonner-spin`

Duration: `1.2s` · Easing: `linear` · Delay: `0s` · Iteration: `infinite` · Fill: `none`

Used by: `.sonner-loading-bar`

```css
@keyframes sonner-spin {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.15;
  }
}
```

> Opacity fade

### `@keyframes nprogress-spinner`

Duration: `400ms` · Easing: `linear` · Delay: `0s` · Iteration: `infinite` · Fill: `none`

Used by: `#nprogress .spinner-icon`

```css
@keyframes nprogress-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

> Transform/motion animation

### `@keyframes nprogress-spinner`

Duration: `400ms` · Easing: `linear` · Delay: `0s` · Iteration: `infinite` · Fill: `none`

Used by: `#nprogress .spinner-icon`

```css
@keyframes nprogress-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
```

> Transform/motion animation

### `@keyframes spin`

```css
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
```

> Transform/motion animation

### `@keyframes ping`

```css
@keyframes ping {
  75%, 100% {
    opacity: 0;
    transform: scale(2);
  }
}
```

> Fade + motion enter animation

### `@keyframes pulse`

```css
@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
```

> Opacity fade

### `@keyframes bounce`

```css
@keyframes bounce {
  0%, 100% {
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    transform: translateY(-25%);
  }
  50% {
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    transform: none;
  }
}
```

> Transform/motion animation

### `@keyframes enter`

```css
@keyframes enter {
  0% {
    opacity: var(--tw-enter-opacity,1);
    transform: translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0)scale3d(var(--tw-enter-scale,1),var(--tw-enter-scale,1),var(--tw-enter-scale,1))rotate(var(--tw-enter-rotate,0));
    filter: blur(var(--tw-enter-blur,0));
  }
}
```

> Fade + motion enter animation · Filter effect (blur/brightness)

### `@keyframes exit`

```css
@keyframes exit {
  100% {
    opacity: var(--tw-exit-opacity,1);
    transform: translate3d(var(--tw-exit-translate-x,0),var(--tw-exit-translate-y,0),0)scale3d(var(--tw-exit-scale,1),var(--tw-exit-scale,1),var(--tw-exit-scale,1))rotate(var(--tw-exit-rotate,0));
    filter: blur(var(--tw-exit-blur,0));
  }
}
```

> Fade + motion enter animation · Filter effect (blur/brightness)

### `@keyframes accordion-down`

```css
@keyframes accordion-down {
  0% {
    height: 0px;
  }
  100% {
    height: var(--radix-accordion-content-height,var(--accordion-panel-height,auto));
  }
}
```

> Dimension expand/collapse

### `@keyframes accordion-up`

```css
@keyframes accordion-up {
  0% {
    height: var(--radix-accordion-content-height,var(--accordion-panel-height,auto));
  }
  100% {
    height: 0px;
  }
}
```

> Dimension expand/collapse

### `@keyframes collapsible-down`

```css
@keyframes collapsible-down {
  0% {
    height: 0px;
  }
  100% {
    height: var(--radix-collapsible-content-height,var(--bits-collapsible-content-height,var(--reka-collapsible-content-height,var(--kb-collapsible-content-height,auto))));
  }
}
```

> Dimension expand/collapse

### `@keyframes collapsible-up`

```css
@keyframes collapsible-up {
  0% {
    height: var(--radix-collapsible-content-height,var(--bits-collapsible-content-height,var(--reka-collapsible-content-height,var(--kb-collapsible-content-height,auto))));
  }
  100% {
    height: 0px;
  }
}
```

> Dimension expand/collapse

### `@keyframes caret-blink`

```css
@keyframes caret-blink {
  0%, 70%, 100% {
    opacity: 1;
  }
  20%, 50% {
    opacity: 0;
  }
}
```

> Opacity fade

### `@keyframes scroll-fade-reveal-b`

```css
@keyframes scroll-fade-reveal-b {
  0% {
    --scroll-fade-b: var(--_scroll-fade-size-b,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))));
  }
  100% {
    --scroll-fade-b: 0px;
  }
}
```

### `@keyframes scroll-fade-reveal-s`

```css
@keyframes scroll-fade-reveal-s {
  0% {
    --scroll-fade-s: 0px;
  }
  100% {
    --scroll-fade-s: var(--_scroll-fade-size-s,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))));
  }
}
```

### `@keyframes scroll-fade-reveal-e`

```css
@keyframes scroll-fade-reveal-e {
  0% {
    --scroll-fade-e: var(--_scroll-fade-size-e,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))));
  }
  100% {
    --scroll-fade-e: 0px;
  }
}
```

### `@keyframes tw-shimmer`

```css
@keyframes tw-shimmer {
  0% {
    background-position-x: 100%;
    background-position-y: 0px;
  }
  100% {
    background-position-x: 0px;
    background-position-y: 0px;
  }
}
```

> Background color/gradient shift · Background position (shimmer/scroll)

## Motion Tokens (CSS Variables)

### Duration Tokens

```css
--default-transition-duration: .15s;
```

### Easing Tokens

```css
--default-transition-timing-function: cubic-bezier(.4, 0, .2, 1);
--ease-out: cubic-bezier(0, 0, .2, 1);
--ease-in-out: cubic-bezier(.4, 0, .2, 1);
```

### Delay Tokens

```css
--tw-animation-delay: 0s;
```

### Animation Tokens

```css
--tw-animation-iteration-count: 1;
--tw-animation-direction: normal;
--tw-animation-fill-mode: none;
```

### Other Tokens

```css
--animate-bounce: bounce 1s infinite;
```

## Global Transition Declarations

These `transition` values are used across the system:

```css
transition: transform 0.4s;
transition: transform 0.4s, opacity 0.4s, height 0.4s, box-shadow 0.2s;
transition: opacity 0.4s, box-shadow 0.2s;
transition: opacity 0.1s, background 0.2s, border-color 0.2s;
transition: opacity 0.4s;
transition: transform 0.5s, opacity 0.2s;
transition: opacity 0.2s, transform 0.2s;
```

## How to Recreate This Motion Design

### Step 1 — Install Dependencies

```bash
```

### Step 2 — Scroll-Reveal Pattern

Elements that animate into view follow this pattern:

```css
/* Initial hidden state */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity .15s cubic-bezier(.4, 0, .2, 1),
              transform .15s cubic-bezier(.4, 0, .2, 1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Step 3 — Key Motion Principles

- **Duration scale:** `.15s` · `0.4s` · `0.2s` — use these values, never invent new durations
- **Always add** `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

## Layout & Grid (LAYOUT.md)

# Layout Reference

> Use this to understand how the site is structured spatially.

## Spacing System

**Base grid:** 4px

**Scale:** `2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 32, 40, 48, 56` px

| Spacing | Semantic Use |
|---------|-------------|
| 4px | Tight — within a component |
| 8px | Medium — between sibling items |
| 16px | Wide — between sections |
| 32px | Vast — major section breaks |

## Flex Layouts

| Element | Direction | Justify | Align | Gap | Children |
|---------|-----------|---------|-------|-----|----------|
| `div.relative.container` | row | space-between | center | 8px | 3 |
| `a.z-10.flex` | row | center | center | 6px 12px | 3 |
| `div.flex.items-center` | row | — | center | 20px | 1 |
| `div.flex.items-center` | row | — | center | 12px | 1 |
| `div.container.flex` | row | space-between | center | — | 2 |
| `div.flex.items-center` | row | — | center | 48px | 2 |
| `div.flex.items-center` | row | — | center | 8px | 3 |
| `div.mb-8.flex` | row | space-between | end | 16px | 2 |
| `a.flex.items-center` | row | — | center | 10px | 1 |
| `div.text-muted-foreground.hidden` | row | — | center | 0px | 1 |
| `div.hidden.gap-1` | row | — | — | 4px | 4 |
| `div.ms-2.flex` | row | — | center | 8px | 2 |
| `a.group/button.inline-flex` | row | center | center | 4px | 1 |
| `a.group.flex` | column | — | — | 20px | 2 |
| `a.group.flex` | column | — | — | 20px | 2 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `div.container.grid` | `339.5px 339.5px 339.5px 339.5px` | — | 4 |
| `div.grid.gap-x-8` | `431.328px 431.328px 431.344px` | 48px 32px | 3 |
| `div.grid.gap-4` | `252.391px 252.391px 252.391px 252.406px 252.391px` | 24px | 4 |

## Structural Containers

### `<nav>` (`nav.bg-background/40.sticky`)

```
display:          block
children:         2
```

### `<main>` (`main.divide-y`)

```
display:          block
children:         2
```

### `<footer>` 

```
display:          block
children:         3
```

### `<section>` (`section.divide-y`)

```
display:          block
children:         2
```

### `<article>` (`article.mx-auto.max-w-3xl`)

```
display:          block
max-width:        768px
children:         3
```

### `<header>` (`header.mb-10.space-y-4`)

```
display:          block
padding:          0px 0px 40px
children:         3
```

### `<nav>` (`nav.group/navigation-menu.relative`)

```
display:          flex
flex-direction:   row
justify-content:  center
align-items:      center
max-width:        max-content
children:         1
```

## Layout Rules

- **Container max-width:** `768px` — always center with `margin: auto`
- Primary layout system: **Flexbox**
- Secondary layout system: **CSS Grid** (used for card grids and multi-column layouts)
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

## Component Patterns (COMPONENTS.md)

# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Font Bold** | unknown | 9× | `.font-bold`, `.font-sans`, `.mb-4` |
| **[& A]:Block** | unknown | 9× | `.[&_a]:block`, `.[&_a]:hover:text-foreground`, `.[&_a]:hover:underline` |
| **[&>Svg]:Pointer Events None** | unknown | 8× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Flex** | unknown | 3× | `.flex`, `.flex-col`, `.gap-5` |
| **Aspect [4/3]** | unknown | 3× | `.aspect-[4/3]`, `.bg-muted`, `.border` |
| **Duration 300** | form-field | 3× | `.duration-300`, `.group-hover:scale-105`, `.object-cover` |
| **Flex** | unknown | 3× | `.flex`, `.flex-1`, `.flex-col` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.text-balance` |
| **Leading Relaxed** | unknown | 3× | `.leading-relaxed`, `.text-muted-foreground`, `.text-sm` |
| **Font Medium** | card | 3× | `.font-medium`, `.gap-1`, `.group-hover:underline` |

## Cards

### Font Medium

**Instances found:** 3

**CSS classes:** `.font-medium` `.gap-1` `.group-hover:underline` `.inline-flex` `.items-center` `.mt-2`

**HTML structure:**

```html
<span class="text-foreground mt-2 inline-flex items-center gap-1 text-sm font-medium group-hover:underline">Read more<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></span>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

## List Items

### Relative

**Instances found:** 3

**CSS classes:** `.relative`

**HTML structure:**

```html
<li data-slot="navigation-menu-item" class="relative"><button id="radix-_R_16aiv5b_-trigger-radix-_R_176aiv5b_" data-state="closed" aria-expanded="false" data-slot="navigation-menu-trigger" class="group/navigation-menu-trigger inline-flex w-max items-center justify-center rounded-3xl transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted group h-auto bg-transparent px-2.5 
```

**Base styles (from design tokens):**

```css
.relative {
  padding: 4px 0;
  border-bottom: 1px solid #27272a;
}```

## Buttons

### Bg Transparent

**Instances found:** 3

**CSS classes:** `.bg-transparent` `.data-[state=open]:bg-transparent` `.data-open:bg-muted/50` `.data-open:focus:bg-muted` `.data-open:hover:bg-muted` `.data-popup-open:bg-muted/50`

**HTML structure:**

```html
<button id="radix-_R_16aiv5b_-trigger-radix-_R_176aiv5b_" data-state="closed" aria-expanded="false" data-slot="navigation-menu-trigger" class="group/navigation-menu-trigger inline-flex w-max items-center justify-center rounded-3xl transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted group h-auto bg-transparent px-2.5 py-2 text-sm font-normal shadow-none hover:bg-transpar
```

**Base styles (from design tokens):**

```css
.bg-transparent {
  background: #ff667f;
  color: #ffffff;
  border-radius: 15.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Form Fields

### Duration 300

**Instances found:** 3

**CSS classes:** `.duration-300` `.group-hover:scale-105` `.object-cover` `.size-full` `.transition-transform`

**HTML structure:**

```html
<img alt="How to Build a Website with Blocks" loading="lazy" width="800" height="600" decoding="async" data-nimg="1" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" style="color:transparent" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" srcset="/_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=256&amp;q=75 256w, /_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=384&amp;q=75 384w, /_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp
```

**Base styles (from design tokens):**

```css
.duration-300 {
  background: #18181b;
  padding: 4px;
}```

## Other Components

### Font Bold

**Instances found:** 9

**CSS classes:** `.font-bold` `.font-sans` `.mb-4`

**HTML structure:**

```html
<div class="mb-4 font-sans font-bold">Products</div>
```

**Base styles (from design tokens):**

```css
.font-bold {
  background: #18181b;
  padding: 4px;
}```

### [& A]:Block

**Instances found:** 9

**CSS classes:** `.[&_a]:block` `.[&_a]:hover:text-foreground` `.[&_a]:hover:underline` `.[&_a]:text-muted-foreground` `.[&_a]:text-sm` `.flex`

**HTML structure:**

```html
<ul class="[&amp;_a]:text-muted-foreground [&amp;_a]:hover:text-foreground flex flex-col gap-4 [&amp;_a]:block [&amp;_a]:text-sm [&amp;_a]:hover:underline"><li><a href="/admin-dashboard">Admin Dashboards</a></li><li><a href="/components">Components</a></li><li><a href="/blocks">Blocks</a></li><li><a href="/examples">Examples</a></li><li><a href="/illustrations">Illustrations</a></li><li><a href="/templates">Templates</a></li></ul>
```

**Base styles (from design tokens):**

```css
.[&_a]:block {
  background: #18181b;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 8

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-muted` `.[a]:hover:text-muted-foreground` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20`

**HTML structure:**

```html
<span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! border-border text-foreground [a]:hover:bg-muted [a]:hover:t
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.flex-col` `.gap-5` `.group`

**HTML structure:**

```html
<a class="group flex flex-col gap-5" href="/blog/build-a-website-with-blocks"><div class="bg-muted aspect-[4/3] w-full overflow-hidden rounded-xl border"><img alt="How to Build a Website with Blocks" loading="lazy" width="800" height="600" decoding="async" data-nimg="1" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" style="color:transparent" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" srcset="/_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=256&amp;q=75 256w, /_next/image?url=%2F
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### Aspect [4/3]

**Instances found:** 3

**CSS classes:** `.aspect-[4/3]` `.bg-muted` `.border` `.overflow-hidden` `.rounded-xl` `.w-full`

**HTML structure:**

```html
<div class="bg-muted aspect-[4/3] w-full overflow-hidden rounded-xl border"><img alt="How to Build a Website with Blocks" loading="lazy" width="800" height="600" decoding="async" data-nimg="1" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" style="color:transparent" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" srcset="/_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=256&amp;q=75 256w, /_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=384&amp;q=75 384w, /_nex
```

**Base styles (from design tokens):**

```css
.aspect-[4/3] {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.flex-1` `.flex-col` `.gap-2`

**HTML structure:**

```html
<div class="flex flex-1 flex-col gap-2"><div class="text-muted-foreground flex items-center gap-2 text-xs uppercase"><time>Sep 24, 2026</time><span class="text-muted-foreground/30">/</span><span>Page Builder</span></div><h2 class="font-heading text-foreground text-xl font-semibold text-balance sm:text-2xl">How to Build a Website with Bl…</h2><p class="text-muted-foreground text-sm leading-relaxed">A step by step guide to building multi-p…</p><span class="text-foreground mt-2 inline-flex items-center gap-1 text-sm font-medium group-hover:underline">Read more<svg xmlns="http
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 3

**CSS classes:** `.font-heading` `.font-semibold` `.text-balance` `.text-foreground` `.text-xl`

**HTML structure:**

```html
<h2 class="font-heading text-foreground text-xl font-semibold text-balance sm:text-2xl">How to Build a Website with Blocks</h2>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

### Leading Relaxed

**Instances found:** 3

**CSS classes:** `.leading-relaxed` `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<p class="text-muted-foreground text-sm leading-relaxed">A step by step guide to building multi-page Next.js sites from blocks with the Page Builder, then exporting clean code as a Next.js project or with the CLI.</p>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

## Interactions & States (INTERACTIONS.md)

# Interaction Reference

> Micro-interactions. Recreate these exactly for authentic feel.

## Coverage

| Component Type | Count | States Captured |
|----------------|-------|----------------|
| Button | 3 | default, hover, focus |
| Link | 3 | default, hover, focus |

## Transition System

These transition declarations are used on interactive elements:

```css
transition: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: all;
transition: color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1);
```

Apply these to all interactive elements. Never invent new durations or easings.

## Button Interactions

### Button 1 — `Components & Blocks`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: oklab(0.969998 -0.00000959635 0.0000227094 / 0.0329007);
```

**On focus:**

```css
/* box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.707999 -0.00000712276 0.0000166297 / 0.3) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `0.15s cubic-bezier(0.4, 0, 0.2, 1)`

### Button 2 — `Tools`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: oklab(0.969998 -0.00000959635 0.0000227094 / 0.836742);
```

**On focus:**

```css
/* box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.707999 -0.00000712276 0.0000166297 / 0.3) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `0.15s cubic-bezier(0.4, 0, 0.2, 1)`

### Button 3 — `Resources`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: oklab(0.969998 -0.00000959635 0.0000227094 / 0.837065);
```

**On focus:**

```css
/* box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.707999 -0.00000712276 0.0000166297 / 0.3) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `0.15s cubic-bezier(0.4, 0, 0.2, 1)`

## Link Interactions

### Link 1 — `a`

**On focus:**

```css
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) auto 1px;
```

**Transition:** `all`

### Link 2 — `Admin Dashboards`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(96.52 -0.0000298023 0.0000119209);
/* color: lab(48.496 0 0) → */ color: lab(2.75381 0 0);
```

**On focus:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(96.52 -0.0000298023 0.0000119209);
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.707999 -0.00000712276 0.0000166297 / 0.3) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

### Link 3 — `Templates`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(96.52 -0.0000298023 0.0000119209);
/* color: lab(48.496 0 0) → */ color: lab(2.75381 0 0);
```

**On focus:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(96.52 -0.0000298023 0.0000119209);
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.707999 -0.00000712276 0.0000166297 / 0.3) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

## Interaction Rules

- Accent color `#ff667f` is used for focus rings, active states, and hover highlights
- Hover effects include **color transitions** — use these exact values, not approximations
- Focus states use **outline** (not box-shadow) — always match this focus ring
- Transition durations in use: `0.15s`
- Always respect `prefers-reduced-motion` — set all transitions to `0s` when enabled

## Design Tokens — JSON Files

### tokens/colors.json
```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "core": {
    "text-primary": {
      "value": "#ffffff",
      "role": "text-primary",
      "name": "tw-ring-offset-color"
    },
    "background": {
      "value": "#000000",
      "role": "background",
      "name": "color-black"
    },
    "surface": {
      "value": "#18181b",
      "role": "surface",
      "name": "color-zinc-900"
    },
    "border": {
      "value": "#27272a",
      "role": "border",
      "name": "color-zinc-800"
    },
    "accent": {
      "value": "#ff667f",
      "role": "accent",
      "name": "color-rose-400"
    },
    "text-muted": {
      "value": "#3f3f46",
      "role": "text-muted",
      "name": "color-zinc-700"
    }
  },
  "status": {
    "danger": {
      "value": "#fef2f2",
      "role": "danger",
      "name": "color-red-50"
    },
    "success": {
      "value": "#f0fdf4",
      "role": "success",
      "name": "color-green-50"
    }
  },
  "extended": {
    "color-slate-200": {
      "value": "#e2e8f0",
      "role": "info",
      "name": "color-slate-200"
    },
    "color-gray-300": {
      "value": "#d1d5dc",
      "role": "unknown",
      "name": "color-gray-300"
    },
    "color-zinc-950": {
      "value": "#09090b",
      "role": "unknown",
      "name": "color-zinc-950"
    },
    "color-red-950": {
      "value": "#460809",
      "role": "unknown",
      "name": "color-red-950"
    },
    "color-green-600": {
      "value": "#00a544",
      "role": "unknown",
      "name": "color-green-600"
    },
    "color-sky-400": {
      "value": "#00bcfe",
      "role": "unknown",
      "name": "color-sky-400"
    },
    "color-sky-600": {
      "value": "#0084cc",
      "role": "unknown",
      "name": "color-sky-600"
    },
    "color-zinc-500": {
      "value": "#71717b",
      "role": "unknown",
      "name": "color-zinc-500"
    },
    "color-rose-600": {
      "value": "#e70044",
      "role": "unknown",
      "name": "color-rose-600"
    },
    "color-gray-900": {
      "value": "#101828",
      "role": "unknown",
      "name": "color-gray-900"
    },
    "color-zinc-400": {
      "value": "#9f9fa9",
      "role": "unknown",
      "name": "color-zinc-400"
    },
    "color-orange-900": {
      "value": "#7e2a0c",
      "role": "unknown",
      "name": "color-orange-900"
    }
  },
  "meta": {
    "theme": "dark",
    "updated": "2026-10-05"
  }
}
```

### tokens/spacing.json
```json
{
  "base": {
    "value": "4px",
    "description": "Grid unit — all spacing must be multiples of this"
  },
  "unit": "px",
  "scale": {
    "xs": {
      "value": "2px",
      "px": 2
    },
    "sm": {
      "value": "4px",
      "px": 4
    },
    "md": {
      "value": "6px",
      "px": 6
    },
    "lg": {
      "value": "8px",
      "px": 8
    },
    "xl": {
      "value": "10px",
      "px": 10
    },
    "2xl": {
      "value": "12px",
      "px": 12
    },
    "3xl": {
      "value": "14px",
      "px": 14
    },
    "4xl": {
      "value": "16px",
      "px": 16
    },
    "5xl": {
      "value": "20px",
      "px": 20
    },
    "6xl": {
      "value": "24px",
      "px": 24
    }
  },
  "multipliers": {
    "1x": {
      "value": "4px",
      "raw": 4
    },
    "2x": {
      "value": "8px",
      "raw": 8
    },
    "3x": {
      "value": "12px",
      "raw": 12
    },
    "4x": {
      "value": "16px",
      "raw": 16
    },
    "5x": {
      "value": "20px",
      "raw": 20
    },
    "6x": {
      "value": "24px",
      "raw": 24
    },
    "7x": {
      "value": "28px",
      "raw": 28
    },
    "8x": {
      "value": "32px",
      "raw": 32
    },
    "9x": {
      "value": "36px",
      "raw": 36
    },
    "10x": {
      "value": "40px",
      "raw": 40
    },
    "11x": {
      "value": "44px",
      "raw": 44
    },
    "12x": {
      "value": "48px",
      "raw": 48
    },
    "13x": {
      "value": "52px",
      "raw": 52
    },
    "14x": {
      "value": "56px",
      "raw": 56
    },
    "15x": {
      "value": "60px",
      "raw": 60
    },
    "16x": {
      "value": "64px",
      "raw": 64
    }
  },
  "meta": {
    "totalValues": 15,
    "min": 2,
    "max": 56
  }
}
```

### tokens/typography.json
```json
{
  "families": [
    "calSansHeading",
    "Inter",
    "SFMono-Regular"
  ],
  "scale": {
    "heading-1": {
      "fontFamily": "calSansHeading",
      "fontSize": "clamp(3rem,15vw,15rem)",
      "fontWeight": "700",
      "lineHeight": null,
      "source": "css"
    },
    "heading-2": {
      "fontFamily": "calSansHeading",
      "fontSize": "2.75rem",
      "fontWeight": "700",
      "lineHeight": null,
      "source": "css"
    },
    "body": {
      "fontFamily": "Inter",
      "fontSize": "13px",
      "fontWeight": "400",
      "lineHeight": null,
      "source": "css"
    },
    "caption": {
      "fontFamily": "Inter",
      "fontSize": "15px",
      "fontWeight": "400",
      "lineHeight": null,
      "source": "css"
    },
    "code": {
      "fontFamily": "SFMono-Regular",
      "fontSize": "14px",
      "fontWeight": "400",
      "lineHeight": null,
      "source": "css"
    }
  },
  "fontFaces": [
    {
      "family": "Inter",
      "src": "/_next/static/media/2c55a0e60120577a-s.0bjc5tiuqdqro.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/media/9c72aa0f40e4eef8-s.0m6w47a4e5dy9.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/media/ad66f9afd8947f86-s.11u06r12fd6v_.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/media/5476f68d60460930-s.0wxq9webf.ew4.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/media/2bbe8d2671613f1f-s.067x_6k0k23tk.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/media/1bffadaabf893a1e-s.16ipb6fqu393i.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/media/83afe278b6a6bb3c-s.p.0q-301v4kxxnr.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "calSansHeading",
      "src": "/_next/static/media/CalSans_SemiBold-s.p.0_1kxnktzihme.woff2",
      "format": "woff2",
      "weight": "600"
    },
    {
      "family": "Mynerve",
      "src": "/_next/static/media/5e538eebf9acc4c2-s.0y2..~~2d1_g0.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Mynerve",
      "src": "/_next/static/media/64f2913d21bf1e57-s.0iaoindtgqbux.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Mynerve",
      "src": "/_next/static/media/0fea445e7d7518dc-s.08jxavmc75le5.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Mynerve",
      "src": "/_next/static/media/50b0ede820165bbf-s.p.0a5m6rcj.nkdi.woff2",
      "format": "woff2",
      "weight": "400"
    }
  ],
  "rules": {
    "maxSizesPerScreen": 4,
    "headingWeightRange": "600-700",
    "bodyWeight": 400,
    "lineHeightBody": 1.5,
    "lineHeightHeading": 1.2
  }
}
```
