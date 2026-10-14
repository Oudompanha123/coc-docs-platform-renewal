---
name: coc-docs
description: Design system skill for coc-docs. Activate when building UI components, pages, or any visual elements. Provides exact color tokens, typography scale, spacing grid, component patterns, and craft rules. Read references/DESIGN.md before writing any CSS or JSX. For motion and layout details, read references/ANIMATIONS.md, references/LAYOUT.md, references/COMPONENTS.md, and references/INTERACTIONS.md for full motion and layout details.
---

# coc-docs Design System

You are building UI for **coc-docs**. Neutral palette in light and dark mode, Inter for body text with calSansHeading (Cal Sans) for headings, compact density on a 4px grid, expressive motion.

## Reference Files

This package includes extended documentation. **Read these files before implementing:**

| File | Contents |
|------|----------|
| `references/DESIGN.md` | Full design system tokens, colors, typography, spacing |
| `references/ANIMATIONS.md` | CSS keyframes, scroll triggers, motion library stack, video specs |
| `references/LAYOUT.md` | Flex/grid containers, page structure, spacing relationships |
| `references/COMPONENTS.md` | DOM component patterns, HTML structure, class fingerprints |
| `references/INTERACTIONS.md` | Hover/focus states with before/after style diffs |
| `tokens/` | Colors, typography and spacing as JSON |
| `patterns/<slug>/` | 214 references for specific kinds of pages and blocks, each with its own SKILL.md, DESIGN.md, tokens and references. Listed by group in `patterns/INDEX.md` |

When building something that matches a pattern (a dashboard, a chat app, a pricing page), also read `patterns/<slug>/SKILL.md`: dashboard patterns use their own fonts and tokens.

### Animation Stack Detected

- **Web Animations API (96 active)** — animation

## Design Philosophy

- **Layered depth** — use shadow tokens to create a sense of physical layering. Each elevation level has a specific shadow.
- **Gradient accents** — gradients are used thoughtfully for emphasis, not decoration.
- **Type pairing** — Inter for body/UI text, calSansHeading (Cal Sans) for headings/display. Never introduce a third typeface.
- **compact density** — 4px base grid. Every dimension is a multiple of 4.
- **Neutral palette** — pure greys with no tint; contrast, not hue, carries hierarchy.
- **No brand hue** — primary actions use the strongest neutral (`--primary`). Color is reserved for status: red destructive, green success, blue info.
- **Expressive motion** — animations are an integral part of the experience. Use spring physics and layout animations.

## Color System

A neutral palette: pure greys with no tint, in light and dark mode. Light is the default; add the `dark` class to `<html>` for dark mode. Contrast carries hierarchy, not hue. The primary color is the strongest neutral (near-black in light mode, near-white in dark), and color is reserved for status.

### Core Palette

| Role | Token | Light | Dark | Use |
|------|-------|-------|------|-----|
| Background | `--background` | `#ffffff` | `#0a0a0a` | Page/app background |
| Foreground | `--foreground` | `#0a0a0a` | `#fafafa` | Headings, body text |
| Card | `--card` | `#ffffff` | `#171717` | Cards, panels, popovers |
| Primary | `--primary` | `#171717` | `#e5e5e5` | Primary buttons, active states |
| Primary foreground | `--primary-foreground` | `#fafafa` | `#171717` | Text on primary |
| Muted / Accent | `--muted` | `#f5f5f5` | `#262626` | Subtle fills, hover backgrounds, secondary buttons |
| Muted foreground | `--muted-foreground` | `#737373` | `#a1a1a1` | Captions, placeholders, secondary text |
| Border / Input | `--border` | `#e5e5e5` | `rgb(255 255 255 / 10%)` | Dividers, card borders, input borders |
| Ring | `--ring` | `#a1a1a1` | `#737373` | Focus rings |
| Destructive | `--destructive` | `#e7000b` | `#ff6467` | Errors, destructive actions |

### Status Colors

| Status | Hex | Use |
|--------|-----|-----|
| Destructive | `#e7000b` (dark `#ff6467`) | Errors, destructive actions |
| Success | `#00a544` | Confirmations, positive trends |
| Info | `#0084cc` | Informational highlights, links in prose |

### Theme Variables

Always style with these variables, never with raw hex, so both modes work.

```css
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --card-foreground: #0a0a0a;
  --popover: #ffffff;
  --popover-foreground: #0a0a0a;
  --primary: #171717;
  --primary-foreground: #fafafa;
  --secondary: #f5f5f5;
  --secondary-foreground: #171717;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --accent: #f5f5f5;
  --accent-foreground: #171717;
  --destructive: #e7000b;
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #a1a1a1;
  --radius: 0.625rem;
}
.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --card: #171717;
  --card-foreground: #fafafa;
  --popover: #171717;
  --popover-foreground: #fafafa;
  --primary: #e5e5e5;
  --primary-foreground: #171717;
  --secondary: #262626;
  --secondary-foreground: #fafafa;
  --muted: #262626;
  --muted-foreground: #a1a1a1;
  --accent: #262626;
  --accent-foreground: #fafafa;
  --destructive: #ff6467;
  --border: rgb(255 255 255 / 10%);
  --input: rgb(255 255 255 / 15%);
  --ring: #737373;
}
```

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

- Body/UI: **Inter**, Headings: **calSansHeading** — these are the only fonts (plus SFMono-Regular for code)
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

Scale: `.25rem, .3125rem, .375rem, 2px, 3px, 4px, 5px, 6px, 7.2px, 19.2px, 22%, 23.2px, 24%, 24px, 26%, 60px, inherit`
Default: `7.2px`

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
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 7.2px;
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
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 7.2px;
  padding: 8px 16px;
  font-weight: 500;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.9; }

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--foreground);
  border-radius: 7.2px;
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
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 7.2px;
  padding: 8px 12px;
  color: var(--foreground);
  font-size: 14px;
}
.input:focus { border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent); outline: none; }
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
  background: var(--card);
  color: var(--muted-foreground);
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
  background: var(--card);
  border: 1px solid var(--border);
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
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
}
.table td {
  padding: 12px;
  border-bottom: 1px solid var(--border);
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
  border-bottom: 1px solid var(--border);
}
.nav-link {
  color: var(--muted-foreground);
  padding: 8px 12px;
  border-radius: 7.2px;
  transition: color 150ms;
}
.nav-link:hover { color: var(--foreground); }
.nav-link.active { color: var(--foreground); }
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
- **Cards** — Grid of 36 card elements (36 items)

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

- Raised (cards, buttons): `0 0 0 1px var(--tw-prose-kbd-shadows),0 3px 0 var(--tw-prose-kbd-shadows)`
- Floating (dropdowns, popovers): `0 0 10px var(--color-blue-500),0 0 5px var(--color-blue-500)`

### Z-Index Scale

`0, 1, 10, 20, 30, 40, 50, 999, 1600, 9999999`

Use these exact values — never invent z-index values.

## Anti-Patterns (Never Do)

- **No zebra striping** — tables and lists use borders for separation
- **No invented colors** — every hex value must come from the palette above
- **No arbitrary spacing** — every dimension is a multiple of 4px
- **No extra fonts** — only calSansHeading and Inter and SFMono-Regular are allowed
- **No arbitrary border-radius** — use the scale: .25rem, .3125rem, .375rem, 2px, 3px, 4px, 5px, 6px, 7.2px, 19.2px
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
- **Brand color:** none; neutral `--primary` (`#171717` light, `#e5e5e5` dark)
- **Brand typeface:** calSansHeading

## Quick Reference

```
Background:     #ffffff / dark #0a0a0a
Card:           #ffffff / dark #171717
Text:           #0a0a0a, muted #737373 / dark #fafafa, #a1a1a1
Primary:        #171717 / dark #e5e5e5
Border:         #e5e5e5 / dark white 10%
Ring:           #a1a1a1 / dark #737373
Font:           Inter (body), calSansHeading (headings)
Spacing:        4px grid
Radius:         7.2px
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

## 1. Visual Theme & Atmosphere

This is a **neutral** interface in light and dark mode, with no brand hue: pure greys carry the hierarchy, and color is reserved for status (red destructive, green success, blue info). Light mode is the default. Depth is expressed through layered shadows and subtle surface color variation. Typography pairs **calSansHeading** for display/headings with **Inter** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **4px base grid** (compact density), with scale: 2, 4, 6, 8, 10, 12, 14, 16px. Motion is expressive — spring physics, layout animations, and staggered reveals are part of the visual language.

---

## 2. Color Palette & Roles

| Role | Token | Light | Dark | Use |
|------|-------|-------|------|-----|
| Background | `--background` | `#ffffff` | `#0a0a0a` | Page/app background |
| Foreground | `--foreground` | `#0a0a0a` | `#fafafa` | Headings, body text |
| Card | `--card` | `#ffffff` | `#171717` | Cards, panels, popovers |
| Primary | `--primary` | `#171717` | `#e5e5e5` | Primary buttons, active states |
| Primary foreground | `--primary-foreground` | `#fafafa` | `#171717` | Text on primary |
| Muted / Accent | `--muted` | `#f5f5f5` | `#262626` | Subtle fills, hover backgrounds, secondary buttons |
| Muted foreground | `--muted-foreground` | `#737373` | `#a1a1a1` | Captions, placeholders, secondary text |
| Border / Input | `--border` | `#e5e5e5` | `rgb(255 255 255 / 10%)` | Dividers, card borders, input borders |
| Ring | `--ring` | `#a1a1a1` | `#737373` | Focus rings |
| Destructive | `--destructive` | `#e7000b` | `#ff6467` | Errors, destructive actions |

Status: success `#00a544`, info `#0084cc`. Theme variables for both modes are in the Color System section of `SKILL.md`.

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
- Use **Inter** for body/UI text, **calSansHeading** for display/headings
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
- **Border radius:** .25rem, .3125rem, .375rem, 2px, 3px, 4px, 5px, 6px, 7.2px, 19.2px, 22%, 23.2px, 24%, 24px, 26%, 60px, inherit
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

### Raised — cards, buttons, interactive elements

- `0 0 0 1px var(--tw-prose-kbd-shadows),0 3px 0 var(--tw-prose-kbd-shadows)`

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

- Use `--primary` for primary buttons and active states, and `--ring` for focus rings
- Use `--background` for the page and `--card` for raised surfaces; test both modes
- Pair **Inter** (body) with **calSansHeading** (display) — these are the only allowed fonts
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
Background: var(--card)
Border: 1px solid var(--border)
Radius: 7.2px
Padding: 16px
Font: Inter (body), calSansHeading (headings)
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg var(--primary), text var(--primary-foreground)
Ghost: bg transparent, border var(--border), hover bg var(--accent)
Padding: 8px 16px
Radius: 7.2px
Hover: opacity 0.9 or lighter shade
Focus: 3px ring in var(--ring) at 50% opacity
```

### Build a Page Layout

```
Background: var(--background)
Max-width: 1350px, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: var(--card), border var(--border)
Label: var(--muted-foreground) (12px)
Value: var(--foreground) (24-32px, semibold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: transparent
Input border: 1px solid var(--input)
Focus: border-color var(--ring) plus 3px ring at 50%
Label: var(--foreground) 14px medium
Spacing: 16px between fields
Radius: 7.2px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: Inter for body, calSansHeading for headings, type scale from Section 3
4. Spacing: 4px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```

# Animation Reference

> Follow these specs exactly to recreate the experience.

## Motion Technology Stack

| Library | Type | Notes |
|---------|------|-------|
| **Web Animations API (96 active)** | animation |  |

## Scroll Animation Patterns

| Pattern | Library | Element Count | Duration | Delay | Easing |
|---------|---------|---------------|----------|-------|--------|
| parallax / sticky scroll | CSS | 7 | — | — | — |

### CSS Implementation

## CSS Keyframes (27)

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

### `@keyframes flow-animation`

Duration: `auto` · Easing: `linear` · Delay: `0s` · Iteration: `infinite` · Fill: `none`

Used by: `.animated-flow-line`

```css
@keyframes flow-animation {
  0% {
    stroke-dashoffset: 25;
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: -400;
    opacity: 0;
  }
}
```

> Opacity fade · SVG stroke animation

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

### `@keyframes rough-notation-dash`

```css
@keyframes rough-notation-dash {
  100% {
    stroke-dashoffset: 0;
  }
}
```

> SVG stroke animation

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
| `section.flex.flex-col` | column | center | center | — | 1 |
| `div.relative.container` | row | space-between | center | 8px | 3 |
| `a.z-10.flex` | row | center | center | 6px 12px | 3 |
| `header.flex.py-10` | row | — | — | — | 1 |
| `div.flex.items-center` | row | — | center | 20px | 1 |
| `div.flex.items-center` | row | — | center | 12px | 1 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `div.container.mx-auto` | `452.656px 452.672px 452.672px` | 16px | 2 |
| `div.container.grid` | `339.5px 339.5px 339.5px 339.5px` | — | 4 |
| `div.mx-auto.grid` | `496px 496px` | — | 2 |

## Structural Containers

### `<nav>` (`nav.bg-background/40.sticky`)

```
display:          block
children:         2
```

### `<main>` (`main.divide-y`)

```
display:          block
children:         18
```

### `<footer>` 

```
display:          block
children:         3
```

### `<section>` (`section.flex.flex-col`)

```
display:          flex
flex-direction:   column
justify-content:  center
align-items:      center
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

### `<section>` (`section#components-section`)

```
display:          block
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

### `<section>` (`section#reviews.relative.scroll-mt-28`)

```
display:          block
children:         1
```

## Layout Rules

- **Container max-width:** `1024px` — always center with `margin: auto`
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
| **Aspect Video** | unknown | 41× | `.aspect-video`, `.border`, `.dark:hidden` |
| **Shrink 0** | unknown | 40× | `.shrink-0` |
| **Basis 2/3** | unknown | 16× | `.basis-2/3`, `.grow-0`, `.min-w-0` |
| **Block** | unknown | 16× | `.block`, `.border`, `.group` |
| **Flex** | card | 16× | `.flex`, `.items-center`, `.justify-between` |
| **Text Sm** | unknown | 16× | `.text-sm` |
| **Group Hover:Opacity 100** | unknown | 16× | `.group-hover:opacity-100`, `.opacity-0`, `.text-sm` |
| **Border T** | unknown | 16× | `.border-t`, `.rounded-xl` |
| **Aspect 3/2** | unknown | 16× | `.aspect-3/2`, `.block`, `.dark:hidden` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 8× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Bg Background** | unknown | 6× | `.bg-background`, `.border`, `.dark:bg-transparent` |
| **Space Y 2** | unknown | 4× | `.space-y-2` |
| **Font Heading** | unknown | 4× | `.font-heading`, `.font-semibold`, `.text-xl` |
| **Leading Relaxed** | unknown | 4× | `.leading-relaxed`, `.text-balance`, `.text-muted-foreground` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 4× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 3× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Aspect 4/3** | form-field | 3× | `.aspect-4/3`, `.border`, `.object-cover` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 3× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |

## Cards

### Flex

**Instances found:** 16

**CSS classes:** `.flex` `.items-center` `.justify-between` `.px-3` `.py-2`

**HTML structure:**

```html
<div class="flex items-center justify-between px-3 py-2"><span class="text-sm">Classic Dashboard</span><span class="text-sm opacity-0 group-hover:opacity-100">View Demo</span></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 7.2px;
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
  border-bottom: 1px solid var(--border);
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
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 7.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 3

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<button type="button" role="tab" aria-selected="true" aria-controls="radix-_R_4eltiiv5b_-content-blocks" data-state="active" id="radix-_R_4eltiiv5b_-trigger-blocks" data-slot="tabs-trigger" class="relative h-[calc(100%-1px)] flex-1 items-center justify-center border-transparent! text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 7.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Form Fields

### Aspect 4/3

**Instances found:** 3

**CSS classes:** `.aspect-4/3` `.border` `.object-cover` `.rounded-md` `.transition-transform`

**HTML structure:**

```html
<img alt="Neofolio Template" loading="lazy" width="400" height="300" decoding="async" data-nimg="1" class="aspect-4/3 rounded-md border object-cover transition-transform hover:rotate-5" style="color:transparent;opacity:0;transform:translateY(16px)" sizes="(min-width: 768px) 220px, 30vw" srcset="/_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=256&amp;q=75 256w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=384&amp;q=75 384w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F
```

**Base styles (from design tokens):**

```css
.aspect-4/3 {
  background: var(--card);
  padding: 4px;
}```

## Other Components

### Aspect Video

**Instances found:** 41

**CSS classes:** `.aspect-video` `.border` `.dark:hidden` `.object-cover` `.object-top` `.rounded-xl`

**HTML structure:**

```html
<img alt="Admin dashboard templates" loading="lazy" width="1000" height="1000" decoding="async" data-nimg="1" class="aspect-video rounded-xl border object-cover object-top dark:hidden" sizes="(min-width: 768px) 50vw, 100vw" srcset="/_next/image?url=%2Fimages%2Fdashboard%2Facademy.png&amp;w=384&amp;q=75 384w, /_next/image?url=%2Fimages%2Fdashboard%2Facademy.png&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fimages%2Fdashboard%2Facademy.png&amp;w=750&amp;q=75 750w, /_next/image?url=%2Fimages%2Fdashboard%2Facademy.png&amp;w=828&amp;q=75 828w, /_next/image?url=%2Fimages%2Fdashboard%2Facade
```

**Base styles (from design tokens):**

```css
.aspect-video {
  background: var(--card);
  padding: 4px;
}```

### Shrink 0

**Instances found:** 40

**CSS classes:** `.shrink-0`

**HTML structure:**

```html
<div class="shrink-0"><img alt="Hero sections block" loading="lazy" width="300" height="169" decoding="async" data-nimg="1" class="aspect-video rounded-lg border object-cover dark:hidden" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fhero-sections.png&amp;w=384&amp;q=75 1x, /_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fhero-sections.png&amp;w=640&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fhero-sections.png&amp;w=640&amp;q=75"><img alt="Hero sections block dark" loading="lazy" width="300" height
```

**Base styles (from design tokens):**

```css
.shrink-0 {
  background: var(--card);
  padding: 4px;
}```

### Basis 2/3

**Instances found:** 16

**CSS classes:** `.basis-2/3` `.grow-0` `.min-w-0` `.pl-4` `.shrink-0`

**HTML structure:**

```html
<div role="group" aria-roledescription="slide" data-slot="carousel-item" class="min-w-0 shrink-0 grow-0 pl-4 basis-2/3 md:basis-1/3" style="transform: translate3d(0px, 0px, 0px);"><a target="_blank" class="group hover:border-primary/40 block overflow-hidden rounded-lg border hover:opacity-85" href="/dashboard/default"><div class="flex items-center justify-between px-3 py-2"><span class="text-sm">Classic Dashboard</span><span class="text-sm opacity-0 group-hover:opacity-100">View Demo</span></div><figure class="rounded-xl border-t"><img alt="Classic dashboard admin dashboard template"
```

**Base styles (from design tokens):**

```css
.basis-2/3 {
  background: var(--card);
  padding: 4px;
}```

### Block

**Instances found:** 16

**CSS classes:** `.block` `.border` `.group` `.overflow-hidden` `.rounded-lg`

**HTML structure:**

```html
<a target="_blank" class="group hover:border-primary/40 block overflow-hidden rounded-lg border hover:opacity-85" href="/dashboard/default"><div class="flex items-center justify-between px-3 py-2"><span class="text-sm">Classic Dashboard</span><span class="text-sm opacity-0 group-hover:opacity-100">View Demo</span></div><figure class="rounded-xl border-t"><img alt="Classic dashboard admin dashboard template" loading="lazy" width="300" height="300" decoding="async" data-nimg="1" class="hidden aspect-3/2 w-full rounded-tl-md rounded-tr-lg shadow-2xl dark:block" style="color:transparent"
```

**Base styles (from design tokens):**

```css
.block {
  background: var(--card);
  padding: 4px;
}```

### Text Sm

**Instances found:** 16

**CSS classes:** `.text-sm`

**HTML structure:**

```html
<span class="text-sm">Classic Dashboard</span>
```

**Base styles (from design tokens):**

```css
.text-sm {
  background: var(--card);
  padding: 4px;
}```

### Group Hover:Opacity 100

**Instances found:** 16

**CSS classes:** `.group-hover:opacity-100` `.opacity-0` `.text-sm`

**HTML structure:**

```html
<span class="text-sm opacity-0 group-hover:opacity-100">View Demo</span>
```

**Base styles (from design tokens):**

```css
.group-hover:opacity-100 {
  background: var(--card);
  padding: 4px;
}```

### Border T

**Instances found:** 16

**CSS classes:** `.border-t` `.rounded-xl`

**HTML structure:**

```html
<figure class="rounded-xl border-t"><img alt="Classic dashboard admin dashboard template" loading="lazy" width="300" height="300" decoding="async" data-nimg="1" class="hidden aspect-3/2 w-full rounded-tl-md rounded-tr-lg shadow-2xl dark:block" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fdashboard%2Fclassic-dark.png&amp;w=384&amp;q=75 1x, /_next/image?url=%2Fimages%2Fdashboard%2Fclassic-dark.png&amp;w=640&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fdashboard%2Fclassic-dark.png&amp;w=640&amp;q=75"><img alt="Classic dashboard admin dashboard template dark
```

**Base styles (from design tokens):**

```css
.border-t {
  background: var(--card);
  padding: 4px;
}```

### Aspect 3/2

**Instances found:** 16

**CSS classes:** `.aspect-3/2` `.block` `.dark:hidden` `.rounded-tl-md` `.rounded-tr-lg` `.shadow-2xl`

**HTML structure:**

```html
<img alt="Classic dashboard admin dashboard template dark" loading="lazy" width="300" height="300" decoding="async" data-nimg="1" class="block aspect-3/2 w-full rounded-tl-md rounded-tr-lg shadow-2xl dark:hidden" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fdashboard%2Fclassic.png&amp;w=384&amp;q=75 1x, /_next/image?url=%2Fimages%2Fdashboard%2Fclassic.png&amp;w=640&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fdashboard%2Fclassic.png&amp;w=640&amp;q=75">
```

**Base styles (from design tokens):**

```css
.aspect-3/2 {
  background: var(--card);
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 8

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-invalid:border-destructive` `.aria-invalid:ring-3`

**HTML structure:**

```html
<a data-slot="button" data-variant="default" data-size="lg" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: var(--card);
  padding: 4px;
}```

### Bg Background

**Instances found:** 6

**CSS classes:** `.bg-background` `.border` `.dark:bg-transparent` `.flex` `.relative` `.rounded-xl`

**HTML structure:**

```html
<div class="bg-background relative flex size-12 rounded-xl border dark:bg-transparent"><div class="relative z-20 m-auto size-fit *:size-6"><img alt="reactjs logo" loading="lazy" width="26" height="26" decoding="async" data-nimg="1" style="color:transparent" src="/reactjs-logo.svg"></div><div class="to-muted-foreground/25 absolute z-10 h-px bg-linear-to-r top-1/2 left-full w-[130px] origin-left rotate-25"></div></div>
```

**Base styles (from design tokens):**

```css
.bg-background {
  background: var(--card);
  padding: 4px;
}```

### Space Y 2

**Instances found:** 4

**CSS classes:** `.space-y-2`

**HTML structure:**

```html
<div class="space-y-2"><h2 class="font-heading font-semibold text-xl">Admin Dashboards, Pages &amp; Components</h2><p class="text-muted-foreground leading-relaxed text-balance">Includes 16 production-ready admin dashb…</p></div>
```

**Base styles (from design tokens):**

```css
.space-y-2 {
  background: var(--card);
  padding: 4px;
}```

### Font Heading

**Instances found:** 4

**CSS classes:** `.font-heading` `.font-semibold` `.text-xl`

**HTML structure:**

```html
<h2 class="font-heading font-semibold text-xl">Admin Dashboards, Pages &amp; Components</h2>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: var(--card);
  padding: 4px;
}```

### Leading Relaxed

**Instances found:** 4

**CSS classes:** `.leading-relaxed` `.text-balance` `.text-muted-foreground`

**HTML structure:**

```html
<p class="text-muted-foreground leading-relaxed text-balance">Includes <!-- -->16<!-- --> production-ready admin dashboards,<!-- --> <!-- -->17<!-- --> web application templates, <!-- -->40<!-- -->+ additional pages, and 100+ reusable components. It saves you dozens of hours in development time and significantly reduces overall project costs.</p>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
  background: var(--card);
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 4

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<a data-slot="button" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-event
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: var(--card);
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 3

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<a data-slot="button" data-variant="outline" data-size="default" class="group/button shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-events-none [&amp
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: var(--card);
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `var(--border)` for all dividers within components
- Use `var(--primary)` for active states and `var(--ring)` for focus

## Interactions & States (INTERACTIONS.md)

# Interaction Reference

> Micro-interactions. Recreate these exactly for authentic feel.

## Coverage

| Component Type | Count | States Captured |
|----------------|-------|----------------|
| Button | 3 | default, hover, focus |
| Role Button | 1 | default, hover, focus |
| Link | 3 | default, hover, focus |
| Input | 1 | default, hover, focus |

## Transition System

These transition declarations are used on interactive elements:

```css
transition: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: all;
transition: color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: color 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
```

Apply these to all interactive elements. Never invent new durations or easings.

## Button Interactions

### Button 1 — `Components & Blocks`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: oklab(0.969998 -0.00000959635 0.0000227094 / 0.837155);
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
/* background-color: rgba(0, 0, 0, 0) → */ background-color: oklab(0.969998 -0.00000959635 0.0000227094 / 0.837065);
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
/* background-color: rgba(0, 0, 0, 0) → */ background-color: oklab(0.969998 -0.00000959635 0.0000227094 / 0.837168);
```

**On focus:**

```css
/* box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.707999 -0.00000712276 0.0000166297 / 0.3) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `0.15s cubic-bezier(0.4, 0, 0.2, 1)`

## Role Button Interactions

### Role Button 1 — `Open chat`

**On focus:**

```css
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: rgb(0, 74, 181) solid 4px;
/* outline-color: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) → */ outline-color: rgb(0, 74, 181);
```

**Transition:** `all`

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

## Input Interactions

### Input 1 — `Enter your email`

**On focus:**

```css
/* border-color: rgba(0, 0, 0, 0) → */ border-color: lab(66.128 -0.0000298023 0.0000119209);
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.707999 -0.00000712276 0.0000166297 / 0.3) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `color 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

## Interaction Rules

- Focus rings use `var(--ring)`; hover highlights use `var(--accent)`; active states use `var(--primary)`
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
    "background": {
      "value": "#ffffff",
      "dark": "#0a0a0a",
      "role": "background"
    },
    "foreground": {
      "value": "#0a0a0a",
      "dark": "#fafafa",
      "role": "foreground"
    },
    "card": {
      "value": "#ffffff",
      "dark": "#171717",
      "role": "card"
    },
    "card-foreground": {
      "value": "#0a0a0a",
      "dark": "#fafafa",
      "role": "card-foreground"
    },
    "popover": {
      "value": "#ffffff",
      "dark": "#171717",
      "role": "popover"
    },
    "popover-foreground": {
      "value": "#0a0a0a",
      "dark": "#fafafa",
      "role": "popover-foreground"
    },
    "primary": {
      "value": "#171717",
      "dark": "#e5e5e5",
      "role": "primary"
    },
    "primary-foreground": {
      "value": "#fafafa",
      "dark": "#171717",
      "role": "primary-foreground"
    },
    "secondary": {
      "value": "#f5f5f5",
      "dark": "#262626",
      "role": "secondary"
    },
    "secondary-foreground": {
      "value": "#171717",
      "dark": "#fafafa",
      "role": "secondary-foreground"
    },
    "muted": {
      "value": "#f5f5f5",
      "dark": "#262626",
      "role": "muted"
    },
    "muted-foreground": {
      "value": "#737373",
      "dark": "#a1a1a1",
      "role": "muted-foreground"
    },
    "accent": {
      "value": "#f5f5f5",
      "dark": "#262626",
      "role": "accent"
    },
    "accent-foreground": {
      "value": "#171717",
      "dark": "#fafafa",
      "role": "accent-foreground"
    },
    "destructive": {
      "value": "#e7000b",
      "dark": "#ff6467",
      "role": "destructive"
    },
    "border": {
      "value": "#e5e5e5",
      "dark": "rgb(255 255 255 / 10%)",
      "role": "border"
    },
    "input": {
      "value": "#e5e5e5",
      "dark": "rgb(255 255 255 / 15%)",
      "role": "input"
    },
    "ring": {
      "value": "#a1a1a1",
      "dark": "#737373",
      "role": "ring"
    }
  },
  "status": {
    "destructive": {
      "value": "#e7000b",
      "dark": "#ff6467",
      "role": "danger"
    },
    "success": {
      "value": "#00a544",
      "role": "success"
    },
    "info": {
      "value": "#0084cc",
      "role": "info"
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

## Bundled Fonts (fonts/)

The following font files are bundled in the `fonts/` directory:

- `fonts/Inter-Black.ttf`
- `fonts/Inter-Bold.ttf`
- `fonts/Inter-ExtraBold.ttf`
- `fonts/Inter-ExtraLight.ttf`
- `fonts/Inter-Light.ttf`
- `fonts/Inter-Medium.ttf`
- `fonts/Inter-Regular.ttf`
- `fonts/Inter-SemiBold.ttf`
- `fonts/Inter-Thin.ttf`
- `fonts/Mynerve-Regular.ttf`
- `fonts/calSansHeading-600.woff2`

Use these local font files in `@font-face` declarations instead of fetching from Google Fonts.
