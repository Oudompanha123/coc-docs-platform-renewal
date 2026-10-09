---
name: coc-docs-dashboard-apps-file-manager
description: Design system skill for coc-docs. Activate when building UI components, pages, or any visual elements. Provides exact color tokens, typography scale, spacing grid, component patterns, and craft rules. Read references/DESIGN.md before writing any CSS or JSX. For motion and layout details, read references/ANIMATIONS.md, references/LAYOUT.md, references/COMPONENTS.md, and references/INTERACTIONS.md for full motion and layout details.
---

# coc-docs Design System

You are building UI for **coc-docs**. Light-themed, warm palette, sans-serif typography (Geist), compact density on a 4px grid, expressive motion.

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

- **Web Animations API (3 active)** — animation

## Design Philosophy

- **Layered depth** — use shadow tokens to create a sense of physical layering. Each elevation level has a specific shadow.
- **Gradient accents** — gradients are used thoughtfully for emphasis, not decoration.
- **Type pairing** — Geist for body/UI text, Inter for headings/display. Never introduce a third typeface.
- **compact density** — 4px base grid. Every dimension is a multiple of 4.
- **warm palette** — the color temperature runs warm, matching the sans-serif typography.
- **Restrained accent** — `#ff6568` is the only pop of color. Used exclusively for CTAs, links, focus rings, and active states.
- **Expressive motion** — animations are an integral part of the experience. Use spring physics and layout animations.

## Color System

### Core Palette

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Background | `--background` | `#ffffff` | Page/app background |
| Surface | `--surface` | `#fef2f2` | Cards, panels, modals |
| Text Primary | `--text-primary` | `#0a1510` | Headings, body text |
| Accent | `--accent` | `#ff6568` | CTAs, links, focus rings |
| Border | `--border` | `#262626` | Dividers, card borders |

### Status Colors

| Status | Hex | Use |
|--------|-----|-----|
| Success | `#00c758` | Confirmations, positive trends |
| Warning | `#fcbb00` | Caution states, pending items |
| Danger | `#e40014` | Errors, destructive actions |

### Extended Palette

- **color-slate-200:** `#e2e8f0` — Light surface or highlight color
- **color-blue-500:** `#3080ff`
- **color-black:** `#000000` — Deep background layer or shadow color
- **color-green-50:** `#f0fdf4` — Light surface or highlight color
- **color-slate-900:** `#0f172b` — Deep background layer or shadow color
- **color-red-200:** `#ffcaca` — Light surface or highlight color
- **color-green-950:** `#032e15` — Deep background layer or shadow color
- **color-violet-400:** `#a685ff`

### CSS Variable Tokens

```css
--color-border: var(--border);
--card-spacing: calc(var(--spacing)*4);
--card-spacing: calc(var(--spacing)*3);
--primary-50: #f3faf6;
--primary-100: #e4f6eb;
--primary-200: #ccedd9;
--primary-300: #a9e0c0;
--primary-400: #82cb9e;
--primary-500: #6db587;
--primary-600: #58946d;
--primary-700: #49785b;
--primary-800: #385c47;
--primary-900: #2f4c3c;
--primary-950: #182a20;
--primary-1000: #0a1510;
--secondary-50: #f9f6f8;
--secondary-100: #f3ecf2;
--secondary-200: #e7dae6;
--secondary-300: #d8bed3;
--secondary-400: #c498bb;
```

## Typography

### Font Stack

- **Geist** — Heading 1, Heading 2, Heading 3
- **Inter** — Body, Caption
- **Overpass Mono** — Code

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
  font-family: "Geist";
  src: url("fonts/Geist-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Geist";
  src: url("fonts/Geist-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Roboto";
  src: url("fonts/Roboto-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Roboto";
  src: url("fonts/Roboto-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("fonts/PlusJakartaSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("fonts/PlusJakartaSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Montserrat";
  src: url("fonts/Montserrat-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Montserrat";
  src: url("fonts/Montserrat-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Poppins";
  src: url("fonts/Poppins-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Poppins";
  src: url("fonts/Poppins-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Overpass Mono";
  src: url("fonts/OverpassMono-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Overpass Mono";
  src: url("fonts/OverpassMono-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "PT Sans";
  src: url("fonts/PTSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "PT Sans";
  src: url("fonts/PTSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Hedvig Letters Serif";
  src: url("fonts/HedvigLettersSerif-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Kumbh Sans";
  src: url("fonts/KumbhSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Kumbh Sans";
  src: url("fonts/KumbhSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Outfit";
  src: url("fonts/Outfit-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Outfit";
  src: url("fonts/Outfit-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "DM Sans";
  src: url("fonts/DMSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "DM Sans";
  src: url("fonts/DMSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
```

### Type Scale

| Role | Family | Size | Weight |
|------|--------|------|--------|
| Heading 1 | Geist | 15px | 700 |
| Heading 2 | Geist | 13px | 700 |
| Heading 3 | Geist | .8rem | 700 |
| Body | Inter | .7rem | 400 |
| Caption | Inter | 11px | 400 |
| Code | Overpass Mono | 14px | 400 |

### Typography Rules

- Body/UI: **Geist**, Headings: **Inter** — these are the only display fonts
- Max 3-4 font sizes per screen
- Headings: weight 600-700, body: weight 400
- Use color and opacity for text hierarchy, not additional font sizes
- Line height: 1.5 for body, 1.2 for headings

## Spacing & Layout

### Base Grid: 4px

Every dimension (margin, padding, gap, width, height) must be a multiple of **4px**.

### Spacing Scale

`2, 4, 6, 8, 10, 12, 16, 24, 26, 32, 50, 52` px

### Spacing as Meaning

| Spacing | Use |
|---------|-----|
| 4-8px | Tight: related items (icon + label, avatar + name) |
| 12-16px | Medium: between groups within a section |
| 24-32px | Wide: between distinct sections |
| 48px+ | Vast: major page section breaks |

### Border Radius

Scale: `.25rem, 2px, 4px, 5px, inherit, 6px, 8px, 10px, 14px 14px 0px 0px, 14px, 26px`
Default: `6px`

### Container

Max-width: `96rem`, centered with auto margins.

### Breakpoints

| Name | Value |
|------|-------|
| sm | 40rem |
| md | 48rem |
| lg | 64rem |
| xl | 80rem |
| 2xl | 96rem |
| xs | 479px |
| xs | 480px |

Mobile-first: design for small screens, layer on responsive overrides.

## Component Patterns

### Card

```css
.card {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 16px;
  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px;
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
  background: #ff6568;
  color: #0a1510;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.9; }

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid #262626;
  color: #0a1510;
  border-radius: 6px;
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
  background: #ffffff;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px 12px;
  color: #0a1510;
  font-size: 14px;
}
.input:focus { border-color: #ff6568; outline: none; }
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
  background: #fef2f2;
  color: #060c09;
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
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 26px;
  padding: 24px;
  max-width: 480px;
  width: 90vw;
  box-shadow: 0 0 10px var(--primary),0 0 5px var(--primary);
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
  color: #060c09;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #262626;
}
.table td {
  padding: 12px;
  border-bottom: 1px solid #262626;
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
  border-bottom: 1px solid #262626;
}
.nav-link {
  color: #060c09;
  padding: 8px 12px;
  border-radius: 6px;
  transition: color 150ms;
}
.nav-link:hover { color: #0a1510; }
.nav-link.active { color: #ff6568; }
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
- Variants: `foreground`, `:order-last`, `:w-full`, `spacing)`, `header`

**Navigation** (`html`)

## Page Structure

The following page sections were detected:

- **Hero** — Hero section (detected from heading structure)
- **Cards** — Grid of 10 card elements (10 items)

When building pages, follow this section order and structure.

## Animation & Motion

This project uses **expressive motion**. Animations are part of the design language.

### CSS Animations

- `spin`
- `ping`
- `pulse`
- `enter`
- `exit`

### Motion Tokens

- **Duration scale:** `.1s`, `.15s`, `.2s`, `.3s`, `.4s`, `.5s`, `1s`
- **Easing functions:** `cubic-bezier(.22,1,.36,1)`, `linear`, `cubic-bezier(.7,0,.84,0)`, `cubic-bezier(.23,1,.32,1)`

### Motion Guidelines

- **Duration:** Use values from the duration scale above. Short (.1s) for micro-interactions, long (1s) for page transitions
- **Easing:** Use `cubic-bezier(.22,1,.36,1)` as the default easing curve
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
- Subtle: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.145 -0.00000143796 0.00000340492 / 0.1) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
- Subtle: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.145 -0.00000143796 0.00000340492 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 1px 0px 0px`
- Subtle: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.145 -0.00000143796 0.00000340492 / 0.1) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 1px 0px 0px`
- Raised (cards, buttons): `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px`
- Floating (dropdowns, popovers): `0 0 10px var(--primary),0 0 5px var(--primary)`

### Z-Index Scale

`0, 1, 10, 20, 30, 40, 50, 100, 1600`

Use these exact values — never invent z-index values.

## Anti-Patterns (Never Do)

- **No blur effects** — no backdrop-blur, no filter: blur()
- **No zebra striping** — tables and lists use borders for separation
- **No invented colors** — every hex value must come from the palette above
- **No arbitrary spacing** — every dimension is a multiple of 4px
- **No extra fonts** — only Geist and Inter and Overpass Mono are allowed
- **No arbitrary border-radius** — use the scale: .25rem, 2px, 4px, 5px, 6px, 8px, 10px, 14px, 26px
- **No opacity for disabled states** — use muted colors instead

## Workflow

1. **Read** `references/DESIGN.md` before writing any UI code
2. **Pick colors** from the Color System section — never invent new ones
3. **Set typography** — Geist, Inter, Overpass Mono only, using the type scale
4. **Build layout** on the 4px grid — check every margin, padding, gap
5. **Match components** to patterns above before creating new ones
6. **Apply elevation** — use shadow tokens
7. **Validate** — every value traces back to a design token. No magic numbers.

## Brand Spec

- **Favicon:** `/favicon.ico`
- **Brand color:** `#ff6568`
- **Brand typeface:** Geist

## Quick Reference

```
Background:     #ffffff
Surface:        #fef2f2
Text:           #0a1510 / (not set)
Accent:         #ff6568
Border:         #262626
Font:           Geist
Spacing:        4px grid
Radius:         6px
Components:     8 detected
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
> Colors: 20 · Fonts: 3 · Components: 8
> Icon library: not detected · State: not detected
> Primary theme: light · Dark mode toggle: yes · Motion: expressive

---

## 1. Visual Theme & Atmosphere

This is a **light-themed** interface with a warm, approachable feel. The light background emphasizes content clarity. Typography pairs **Inter** for display/headings with **Geist** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **4px base grid** (compact density), with scale: 2, 4, 6, 8, 10, 12, 16, 24px. The accent color **#ff6568** anchors interactive elements (buttons, links, focus rings). Motion is expressive — spring physics, layout animations, and staggered reveals are part of the visual language.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| tw-ring-offset-color | `#ffffff` | background | Page background, darkest surface |
| color-red-50 | `#fef2f2` | surface | Card and panel backgrounds |
| primary-1000 | `#0a1510` | text-primary | Headings and body text |
| chart-5 | `#262626` | border | Dividers, card borders, outlines |
| color-red-400 | `#ff6568` | accent | CTAs, links, focus rings, active states |
| color-red-600 | `#e40014` | danger | Error states, destructive actions |
| color-green-500 | `#00c758` | success | Success states, positive indicators |
| color-amber-400 | `#fcbb00` | warning | Warning states, caution indicators |
| color-slate-200 | `#e2e8f0` | info | Informational highlights |
| color-blue-500 | `#3080ff` | unknown | Palette color |
| color-black | `#000000` | unknown | Palette color |
| color-green-50 | `#f0fdf4` | unknown | Palette color |
| color-slate-900 | `#0f172b` | unknown | Palette color |
| color-red-200 | `#ffcaca` | unknown | Palette color |
| color-green-950 | `#032e15` | unknown | Palette color |
| color-violet-400 | `#a685ff` | unknown | Palette color |
| color-red-950 | `#460809` | unknown | Palette color |
| color-orange-500 | `#fe6e00` | unknown | Palette color |
| color-sky-200 | `#b8e6fe` | unknown | Palette color |
| color-sky-400 | `#00bcfe` | unknown | Palette color |

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
| `--sidebar` | `lab(96.9618% .344366 .0810146)` | `lab(7.78201% -.0000149012 0)` |
| `--sidebar-foreground` | `lab(42.3743% .000625849 -.0228286)` | `lab(71.8359% .000983477 -.0342488)` |
| `--sidebar-primary` | `lab(14.1981% .000327826 -.0114143)` | `lab(36.9089% 35.0961 -85.6872)` |
| `--sidebar-accent` | `lab(89.5304% .00107288 -.0380397)` | `lab(18.0029% .000312924 -.0114143)` |

### CSS Variable Tokens

```css
--tw-border-style: solid;
--color-border: var(--border);
--tw-border-style: dashed;
--tw-border-style: none;
--card-spacing: calc(var(--spacing)*4);
--card-spacing: calc(var(--spacing)*3);
--tw-border-style: dashed;
--primary-50: #f3faf6;
--primary-100: #e4f6eb;
--primary-200: #ccedd9;
--primary-300: #a9e0c0;
--primary-400: #82cb9e;
--primary-500: #6db587;
--primary-600: #58946d;
--primary-700: #49785b;
--primary-800: #385c47;
--primary-900: #2f4c3c;
--primary-950: #182a20;
--primary-1000: #0a1510;
--secondary-50: #f9f6f8;
```

---

## 3. Typography Rules

**Font Stack:**
- **Geist** — Heading 1, Heading 2, Heading 3
- **Inter** — Body, Caption
- **Overpass Mono** — Code

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
  font-family: "Geist";
  src: url("fonts/Geist-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Geist";
  src: url("fonts/Geist-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Roboto";
  src: url("fonts/Roboto-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Roboto";
  src: url("fonts/Roboto-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("fonts/PlusJakartaSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("fonts/PlusJakartaSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Montserrat";
  src: url("fonts/Montserrat-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Montserrat";
  src: url("fonts/Montserrat-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Poppins";
  src: url("fonts/Poppins-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Poppins";
  src: url("fonts/Poppins-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Overpass Mono";
  src: url("fonts/OverpassMono-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Overpass Mono";
  src: url("fonts/OverpassMono-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "PT Sans";
  src: url("fonts/PTSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "PT Sans";
  src: url("fonts/PTSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Hedvig Letters Serif";
  src: url("fonts/HedvigLettersSerif-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Kumbh Sans";
  src: url("fonts/KumbhSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Kumbh Sans";
  src: url("fonts/KumbhSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Outfit";
  src: url("fonts/Outfit-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "Outfit";
  src: url("fonts/Outfit-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "DM Sans";
  src: url("fonts/DMSans-Bold.ttf") format("truetype");
  font-weight: 700;
}
@font-face {
  font-family: "DM Sans";
  src: url("fonts/DMSans-Regular.ttf") format("truetype");
  font-weight: 400;
}
```

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | Geist | 15px | 700 |
| Heading 2 | Geist | 13px | 700 |
| Heading 3 | Geist | .8rem | 700 |
| Body | Inter | .7rem | 400 |
| Caption | Inter | 11px | 400 |
| Code | Overpass Mono | 14px | 400 |

**Typographic Rules:**
- Limit to 3 font families max per screen
- Use **Geist** for body/UI text, **Inter** for display/headings
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes

---

## 4. Component Stylings

### Navigation (1)

**Navigation** — `html`

### Data Display (3)

**Card** — `html`
- Variants: `foreground`, `:order-last`, `:w-full`, `spacing)`, `header`

**Badge** — `html`

**List** — `html`

### Data Input (2)

**Button** — `html`
- Animation: 

**Input** — `html`
- State: :focus, :placeholder

### Media (2)

**Image** — `html`

**Icon** — `html`

---

## 5. Layout Principles

- **Base spacing unit:** 4px
- **Spacing scale:** 2, 4, 6, 8, 10, 12, 16, 24, 26, 32, 50, 52
- **Border radius:** .25rem, 2px, 4px, 5px, inherit, 6px, 8px, 10px, 14px 14px 0px 0px, 14px, 26px
- **Max content width:** 96rem

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
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.145 -0.00000143796 0.00000340492 / 0.1) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px`
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.145 -0.00000143796 0.00000340492 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 1px 0px 0px`

### Raised — cards, buttons, interactive elements

- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px`

### Floating — dropdowns, popovers, modals

- `0 0 10px var(--primary),0 0 5px var(--primary)`

### Z-Index Scale

`0, 1, 10, 20, 30, 40, 50, 100, 1600`

---

## 7. Animation & Motion

This project uses **expressive motion**. Animations are an integral part of the experience.

### CSS Animations

- `@keyframes spin`
- `@keyframes ping`
- `@keyframes pulse`
- `@keyframes enter`
- `@keyframes exit`
- `@keyframes accordion-down`
- `@keyframes accordion-up`
- `@keyframes caret-blink`

### Animated Components

- **Button**: 

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`

---

## 8. Do's and Don'ts

### Do's

- Use `#ff6568` for interactive elements (buttons, links, focus rings)
- Use `#ffffff` as the primary page background
- Pair **Geist** (body) with **Inter** (display) — these are the only allowed fonts
- Follow the **4px** spacing grid for all margins, padding, and gaps
- Use the defined shadow tokens for elevation — see Section 6
- Use border-radius from the scale: .25rem, 2px, 4px, 5px, inherit
- Reuse existing components from Section 4 before creating new ones
- Always use CSS variables for colors — never hardcode hex
- Test both light and dark modes for contrast

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't introduce additional font families beyond Geist and Inter and Overpass Mono
- Don't use arbitrary spacing values — stick to multiples of 4px
- Don't create custom box-shadow values outside the system tokens
- Don't use arbitrary border-radius values — pick from the defined scale
- Don't duplicate component patterns — check Section 4 first
- Don't use backdrop-blur or blur effects

### Anti-Patterns (detected from codebase)

- No blur or backdrop-blur effects
- No zebra striping on tables/lists

---

## 9. Responsive Behavior

| Name | Value | Source |
|---|---|---|
| sm | 40rem | css |
| md | 48rem | css |
| lg | 64rem | css |
| xl | 80rem | css |
| 2xl | 96rem | css |
| xs | 479px | css |
| xs | 480px | css |

**Approach:** Use `@media (min-width: ...)` queries matching the breakpoints above.

---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #fef2f2
Border: 1px solid #262626
Radius: 6px
Padding: 16px
Font: Geist
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #ff6568, text white
Ghost: bg transparent, border #262626
Padding: 8px 16px
Radius: 6px
Hover: opacity 0.9 or lighter shade
Focus: ring with #ff6568
```

### Build a Page Layout

```
Background: #ffffff
Max-width: 96rem, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #fef2f2
Label: var(--text-muted) (muted, 12px, uppercase)
Value: #0a1510 (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #ffffff
Input border: 1px solid #262626
Focus: border-color #ff6568
Label: var(--text-muted) 12px
Spacing: 16px between fields
Radius: 6px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: Geist, type scale from Section 3
4. Spacing: 4px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```

# Animation Reference

> Follow these specs exactly to recreate the experience.

## Motion Technology Stack

| Library | Type | Notes |
|---------|------|-------|
| **Web Animations API (3 active)** | animation |  |

## Scroll Animation Patterns

| Pattern | Library | Element Count | Duration | Delay | Easing |
|---------|---------|---------------|----------|-------|--------|
| parallax / sticky scroll | CSS | 2 | — | — | — |

### CSS Implementation

## CSS Keyframes (19)

### `@keyframes fadeIn`

Used by: `[data-vaul-overlay][data-vaul-snap-points="false"][data-state="open"]`

```css
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
```

> Opacity fade

### `@keyframes fadeOut`

Used by: `[data-vaul-overlay][data-state="closed"]`

```css
@keyframes fadeOut {
  100% {
    opacity: 0;
  }
}
```

> Opacity fade

### `@keyframes slideFromBottom`

Used by: `[data-vaul-drawer][data-vaul-snap-points="false"][data-vaul-drawer-direction="bo`

```css
@keyframes slideFromBottom {
  0% {
    transform: translate3d(0,var(--initial-transform,100%),0);
  }
  100% {
    transform: translate3d(0px, 0px, 0px);
  }
}
```

> Transform/motion animation

### `@keyframes slideToBottom`

Used by: `[data-vaul-drawer][data-vaul-snap-points="false"][data-vaul-drawer-direction="bo`

```css
@keyframes slideToBottom {
  100% {
    transform: translate3d(0,var(--initial-transform,100%),0);
  }
}
```

> Transform/motion animation

### `@keyframes slideFromTop`

Used by: `[data-vaul-drawer][data-vaul-snap-points="false"][data-vaul-drawer-direction="to`

```css
@keyframes slideFromTop {
  0% {
    transform: translate3d(0,calc(var(--initial-transform,100%) * -1),0);
  }
  100% {
    transform: translate3d(0px, 0px, 0px);
  }
}
```

> Transform/motion animation

### `@keyframes slideToTop`

Used by: `[data-vaul-drawer][data-vaul-snap-points="false"][data-vaul-drawer-direction="to`

```css
@keyframes slideToTop {
  100% {
    transform: translate3d(0,calc(var(--initial-transform,100%) * -1),0);
  }
}
```

> Transform/motion animation

### `@keyframes slideFromLeft`

Used by: `[data-vaul-drawer][data-vaul-snap-points="false"][data-vaul-drawer-direction="le`

```css
@keyframes slideFromLeft {
  0% {
    transform: translate3d(calc(var(--initial-transform,100%) * -1),0,0);
  }
  100% {
    transform: translate3d(0px, 0px, 0px);
  }
}
```

> Transform/motion animation

### `@keyframes slideToLeft`

Used by: `[data-vaul-drawer][data-vaul-snap-points="false"][data-vaul-drawer-direction="le`

```css
@keyframes slideToLeft {
  100% {
    transform: translate3d(calc(var(--initial-transform,100%) * -1),0,0);
  }
}
```

> Transform/motion animation

### `@keyframes slideFromRight`

Used by: `[data-vaul-drawer][data-vaul-snap-points="false"][data-vaul-drawer-direction="ri`

```css
@keyframes slideFromRight {
  0% {
    transform: translate3d(var(--initial-transform,100%),0,0);
  }
  100% {
    transform: translate3d(0px, 0px, 0px);
  }
}
```

> Transform/motion animation

### `@keyframes slideToRight`

Used by: `[data-vaul-drawer][data-vaul-snap-points="false"][data-vaul-drawer-direction="ri`

```css
@keyframes slideToRight {
  100% {
    transform: translate3d(var(--initial-transform,100%),0,0);
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

## Global Transition Declarations

These `transition` values are used across the system:

```css
transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
transition: opacity 0.5s cubic-bezier(0.32, 0.72, 0, 1);
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

- **Duration scale:** `.15s` · `0.5s` · `0.4s` — use these values, never invent new durations
- **Always add** `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

## Layout & Grid (LAYOUT.md)

# Layout Reference

> Use this to understand how the site is structured spatially.

## Spacing System

**Base grid:** 4px

**Scale:** `2, 4, 6, 8, 10, 12, 16, 24, 26, 32, 50, 52, 64, 74, 102` px

| Spacing | Semantic Use |
|---------|-------------|
| 4px | Tight — within a component |
| 8px | Medium — between sibling items |
| 16px | Wide — between sections |
| 32px | Vast — major section breaks |

## Flex Layouts

| Element | Direction | Justify | Align | Gap | Children |
|---------|-----------|---------|-------|-----|----------|
| `div.group/sidebar-wrapper.flex` | row | — | — | — | 3 |
| `main.relative.flex` | column | — | — | — | 2 |
| `header.bg-background/40.sticky` | row | — | center | 8px | 1 |
| `div.fixed.inset-y-0` | row | — | — | — | 1 |
| `div.flex.flex-1` | column | — | — | — | 1 |
| `div.flex.size-full` | column | — | — | — | 3 |
| `div.flex.w-full` | row | — | center | 8px | 3 |
| `div.flex.flex-col` | column | — | — | 8px | 4 |
| `div.no-scrollbar.flex` | column | — | — | 0px | 1 |
| `div.flex.flex-col` | column | — | — | 8px | 1 |
| `div.ml-auto.flex` | row | — | center | 8px | 6 |
| `div.flex` | row | — | — | — | 1 |
| `div.mt-3.flex` | row | — | center | 12px | 2 |
| `div.group/card.@container/card` | column | — | — | 4px | 1 |
| `ul.flex.w-full` | column | — | — | 0px | 1 |

## Structural Containers

### `<main>` (`main.relative.flex`)

```
display:          flex
flex-direction:   column
justify-content:  —
align-items:      —
children:         2
```

### `<header>` (`header.bg-background/40.sticky`)

```
display:          flex
flex-direction:   row
justify-content:  —
align-items:      center
gap:              8px
children:         1
```

## Layout Rules

- Primary layout system: **Flexbox**
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

## Component Patterns (COMPONENTS.md)

# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 45× | `.[&:has([role=checkbox])]:pr-0`, `.align-middle`, `.px-2` |
| **[&>Span:Last Child]:Truncate** | unknown | 39× | `.[&>span:last-child]:truncate`, `.[&_svg]:shrink-0`, `.[&_svg]:size-4` |
| **Group/Menu Item** | card | 32× | `.group/menu-item`, `.relative` |
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 30× | `.[&:has([role=checkbox])]:pr-0`, `.align-middle`, `.px-2` |
| **Border B** | unknown | 15× | `.border-b`, `.cursor-pointer`, `.data-[state=selected]:bg-muted` |
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 15× | `.[&:has([role=checkbox])]:pr-0`, `.align-middle`, `.px-2` |
| **Flex** | card | 15× | `.flex`, `.gap-3`, `.items-center` |
| **Text End** | unknown | 15× | `.text-end` |
| **Font Medium** | unknown | 14× | `.font-medium`, `.min-w-0`, `.truncate` |
| **Group/Menu Item** | card | 13× | `.group/menu-item`, `.relative` |
| **Block** | unknown | 13× | `.block`, `.group-data-[collapsible=icon]:hidden`, `.group/collapsible` |
| **[&>Span:Last Child]:Truncate** | button | 13× | `.[&>span:last-child]:truncate`, `.[&_svg]:shrink-0`, `.[&_svg]:size-4` |
| **Group/Menu Item** | card | 8× | `.group/menu-item`, `.relative` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-2` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-0` |
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 4× | `.[&:has([role=checkbox])]:pr-0`, `.align-middle`, `.font-medium` |
| **Ms 2.5** | button | 3× | `.-ms-2.5`, `.[&_svg:not([class*='size-'])]:size-3.5`, `.[&_svg]:pointer-events-none` |

## Cards

### Group/Menu Item

**Instances found:** 32

**CSS classes:** `.group/menu-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer
```

**Base styles (from design tokens):**

```css
.group/menu-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Flex

**Instances found:** 15

**CSS classes:** `.flex` `.gap-3` `.items-center` `.min-w-0`

**HTML structure:**

```html
<div class="flex min-w-0 items-center gap-3"><div class="shrink-0"><div class="flex h-5 w-5 items-center justify-center rounded bg-yellow-500 text-xs font-bold text-white">S</div></div><span class="min-w-0 truncate font-medium">Arion – Admin Dashboard &amp; UI Kit</span></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Group/Menu Item

**Instances found:** 13

**CSS classes:** `.group/menu-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><div class="hidden group-data-[collapsible=icon]:block"><button data-slot="dropdown-menu-trigger" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sideba
```

**Base styles (from design tokens):**

```css
.group/menu-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Group/Menu Item

**Instances found:** 8

**CSS classes:** `.group/menu-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabl
```

**Base styles (from design tokens):**

```css
.group/menu-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

## Buttons

### [&>Span:Last Child]:Truncate

**Instances found:** 13

**CSS classes:** `.[&>span:last-child]:truncate` `.[&_svg]:shrink-0` `.[&_svg]:size-4` `.active:bg-sidebar-accent` `.active:text-sidebar-accent-foreground` `.aria-disabled:opacity-50`

**HTML structure:**

```html
<button data-slot="collapsible-trigger" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacit
```

**Base styles (from design tokens):**

```css
.[&>span:last-child]:truncate {
  background: #ff6568;
  color: #0a1510;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}```

### Ms 2.5

**Instances found:** 3

**CSS classes:** `.-ms-2.5` `.[&_svg:not([class*='size-'])]:size-3.5` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted`

**HTML structure:**

```html
<button data-slot="button" data-variant="ghost" data-size="sm" class="group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-events-n
```

**Base styles (from design tokens):**

```css
.-ms-2.5 {
  background: #ff6568;
  color: #0a1510;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 45

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-middle` `.px-2` `.py-3` `.whitespace-nowrap`

**HTML structure:**

```html
<td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0"><span class="text-muted-foreground whitespace-nowrap">12 Sep 2020</span></td>
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
  background: #fef2f2;
  padding: 4px;
}```

### [&>Span:Last Child]:Truncate

**Instances found:** 39

**CSS classes:** `.[&>span:last-child]:truncate` `.[&_svg]:shrink-0` `.[&_svg]:size-4` `.active:bg-sidebar-accent` `.active:text-sidebar-accent-foreground` `.aria-disabled:opacity-50`

**HTML structure:**

```html
<a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:o
```

**Base styles (from design tokens):**

```css
.[&>span:last-child]:truncate {
  background: #fef2f2;
  padding: 4px;
}```

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 30

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-middle` `.px-2` `.py-3` `.whitespace-nowrap`

**HTML structure:**

```html
<td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0"><div class="flex min-w-0 items-center gap-3"><div class="shrink-0"><div class="flex h-5 w-5 items-center justify-center rounded bg-yellow-500 text-xs font-bold text-white">S</div></div><span class="min-w-0 truncate font-medium">Arion – Admin Dashboard &amp; UI Kit</span></div></td>
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Border B

**Instances found:** 15

**CSS classes:** `.border-b` `.cursor-pointer` `.data-[state=selected]:bg-muted` `.transition-colors`

**HTML structure:**

```html
<tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer" data-state="false"><td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0"><button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3
```

**Base styles (from design tokens):**

```css
.border-b {
  background: #fef2f2;
  padding: 4px;
}```

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 15

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-middle` `.px-2` `.py-3` `.whitespace-nowrap`

**HTML structure:**

```html
<td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0"><button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive ar
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Text End

**Instances found:** 15

**CSS classes:** `.text-end`

**HTML structure:**

```html
<div class="text-end"><button data-slot="dropdown-menu-trigger" data-variant="ghost" data-size="icon-sm" class="group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invali
```

**Base styles (from design tokens):**

```css
.text-end {
  background: #fef2f2;
  padding: 4px;
}```

### Font Medium

**Instances found:** 14

**CSS classes:** `.font-medium` `.min-w-0` `.truncate`

**HTML structure:**

```html
<span class="min-w-0 truncate font-medium">Arion – Admin Dashboard &amp; UI Kit</span>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #fef2f2;
  padding: 4px;
}```

### Block

**Instances found:** 13

**CSS classes:** `.block` `.group-data-[collapsible=icon]:hidden` `.group/collapsible`

**HTML structure:**

```html
<div data-state="closed" data-slot="collapsible" class="group/collapsible block group-data-[collapsible=icon]:hidden"><button data-slot="collapsible-trigger" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-acc
```

**Base styles (from design tokens):**

```css
.block {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.min-w-0` `.p-2` `.relative` `.w-full`

**HTML structure:**

```html
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2"><div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0">Dashboards</div><div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### [&>Svg]:Shrink 0

**Instances found:** 5

**CSS classes:** `.[&>svg]:shrink-0` `.[&>svg]:size-4` `.duration-200` `.ease-linear` `.flex` `.focus-visible:ring-2`

**HTML structure:**

```html
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0">Dashboards</div>
```

**Base styles (from design tokens):**

```css
.[&>svg]:shrink-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.gap-2` `.text-sm` `.w-full`

**HTML structure:**

```html
<div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm flex flex-col gap-2"><ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-0"><li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-da
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.gap-0` `.min-w-0` `.w-full`

**HTML structure:**

```html
<ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-0"><li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 4

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-middle` `.font-medium` `.h-10` `.px-2` `.text-foreground`

**HTML structure:**

```html
<th data-slot="table-head" class="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0"><button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#262626` for all dividers within components
- Use `#ff6568` for all interactive/active states

## Interactions & States (INTERACTIONS.md)

# Interaction Reference

> Micro-interactions. Recreate these exactly for authentic feel.

## Coverage

| Component Type | Count | States Captured |
|----------------|-------|----------------|
| Button | 3 | default, hover, focus |
| Link | 3 | default, hover, focus |
| Input | 1 | default, hover, focus |

## Transition System

These transition declarations are used on interactive elements:

```css
transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1), height 0.15s cubic-bezier(0.4, 0, 0.2, 1), padding 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1);
```

Apply these to all interactive elements. Never invent new durations or easings.

## Button Interactions

### Button 1 — `E-commerce`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(89.5304 0.00107288 -0.0380397);
/* color: lab(42.3743 0.000625849 -0.0228286) → */ color: lab(0 0 0);
```

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, lab(66.128 -0.0000298023 0.0000119209) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `width 0.15s cubic-bezier(0.4, 0, 0.2, 1), height 0.15s cubic-bezier(0.4, 0, 0.2, 1), padding 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

### Button 2 — `Payment Dashboard`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(89.5304 0.00107288 -0.0380397);
/* color: lab(42.3743 0.000625849 -0.0228286) → */ color: lab(0 0 0);
```

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, lab(66.128 -0.0000298023 0.0000119209) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `width 0.15s cubic-bezier(0.4, 0, 0.2, 1), height 0.15s cubic-bezier(0.4, 0, 0.2, 1), padding 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

### Button 3 — `Hotel Dashboard`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(89.5304 0.00107288 -0.0380397);
/* color: lab(42.3743 0.000625849 -0.0228286) → */ color: lab(0 0 0);
```

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, lab(66.128 -0.0000298023 0.0000119209) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `width 0.15s cubic-bezier(0.4, 0, 0.2, 1), height 0.15s cubic-bezier(0.4, 0, 0.2, 1), padding 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

## Link Interactions

### Link 1 — `coc-docs`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(89.5304 0.00107288 -0.0380397);
/* color: lab(42.3743 0.000625849 -0.0228286) → */ color: lab(2.75381 0 0);
```

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, lab(66.128 -0.0000298023 0.0000119209) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `width 0.15s cubic-bezier(0.4, 0, 0.2, 1), height 0.15s cubic-bezier(0.4, 0, 0.2, 1), padding 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

### Link 2 — `Classic Dashboard`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(89.5304 0.00107288 -0.0380397);
/* color: lab(42.3743 0.000625849 -0.0228286) → */ color: lab(0 0 0);
```

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, lab(66.128 -0.0000298023 0.0000119209) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `width 0.15s cubic-bezier(0.4, 0, 0.2, 1), height 0.15s cubic-bezier(0.4, 0, 0.2, 1), padding 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

### Link 3 — `Sales`

**On hover:**

```css
/* background-color: rgba(0, 0, 0, 0) → */ background-color: lab(89.5304 0.00107288 -0.0380397);
/* color: lab(42.3743 0.000625849 -0.0228286) → */ color: lab(0 0 0);
```

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, lab(66.128 -0.0000298023 0.0000119209) 0px 0px 0px 2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `width 0.15s cubic-bezier(0.4, 0, 0.2, 1), height 0.15s cubic-bezier(0.4, 0, 0.2, 1), padding 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

## Input Interactions

### Input 1 — `Search...`

**On focus:**

```css
/* border-color: lab(90.952 0 -0.0000119209) → */ border-color: lab(66.128 -0.0000298023 0.0000119209);
/* box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

## Interaction Rules

- Accent color `#ff6568` is used for focus rings, active states, and hover highlights
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
      "role": "background",
      "name": "tw-ring-offset-color"
    },
    "surface": {
      "value": "#fef2f2",
      "role": "surface",
      "name": "color-red-50"
    },
    "text-primary": {
      "value": "#0a1510",
      "role": "text-primary",
      "name": "primary-1000"
    },
    "accent": {
      "value": "#ff6568",
      "role": "accent",
      "name": "color-red-400"
    },
    "border": {
      "value": "#262626",
      "role": "border",
      "name": "chart-5"
    }
  },
  "status": {
    "danger": {
      "value": "#e40014",
      "role": "danger",
      "name": "color-red-600"
    },
    "success": {
      "value": "#00c758",
      "role": "success",
      "name": "color-green-500"
    },
    "warning": {
      "value": "#fcbb00",
      "role": "warning",
      "name": "color-amber-400"
    }
  },
  "extended": {
    "color-slate-200": {
      "value": "#e2e8f0",
      "role": "info",
      "name": "color-slate-200"
    },
    "color-blue-500": {
      "value": "#3080ff",
      "role": "unknown",
      "name": "color-blue-500"
    },
    "color-black": {
      "value": "#000000",
      "role": "unknown",
      "name": "color-black"
    },
    "color-green-50": {
      "value": "#f0fdf4",
      "role": "unknown",
      "name": "color-green-50"
    },
    "color-slate-900": {
      "value": "#0f172b",
      "role": "unknown",
      "name": "color-slate-900"
    },
    "color-red-200": {
      "value": "#ffcaca",
      "role": "unknown",
      "name": "color-red-200"
    },
    "color-green-950": {
      "value": "#032e15",
      "role": "unknown",
      "name": "color-green-950"
    },
    "color-violet-400": {
      "value": "#a685ff",
      "role": "unknown",
      "name": "color-violet-400"
    },
    "color-red-950": {
      "value": "#460809",
      "role": "unknown",
      "name": "color-red-950"
    },
    "color-orange-500": {
      "value": "#fe6e00",
      "role": "unknown",
      "name": "color-orange-500"
    },
    "color-sky-200": {
      "value": "#b8e6fe",
      "role": "unknown",
      "name": "color-sky-200"
    },
    "color-sky-400": {
      "value": "#00bcfe",
      "role": "unknown",
      "name": "color-sky-400"
    }
  },
  "meta": {
    "theme": "light",
    "updated": "2026-10-06"
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
      "value": "16px",
      "px": 16
    },
    "4xl": {
      "value": "24px",
      "px": 24
    },
    "5xl": {
      "value": "26px",
      "px": 26
    },
    "6xl": {
      "value": "32px",
      "px": 32
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
    "max": 102
  }
}
```

### tokens/typography.json
```json
{
  "families": [
    "Geist",
    "Inter",
    "Overpass Mono"
  ],
  "scale": {
    "heading-1": {
      "fontFamily": "Geist",
      "fontSize": "15px",
      "fontWeight": "700",
      "lineHeight": null,
      "source": "css"
    },
    "heading-2": {
      "fontFamily": "Geist",
      "fontSize": "13px",
      "fontWeight": "700",
      "lineHeight": null,
      "source": "css"
    },
    "heading-3": {
      "fontFamily": "Geist",
      "fontSize": ".8rem",
      "fontWeight": "700",
      "lineHeight": null,
      "source": "css"
    },
    "body": {
      "fontFamily": "Inter",
      "fontSize": ".7rem",
      "fontWeight": "400",
      "lineHeight": null,
      "source": "css"
    },
    "caption": {
      "fontFamily": "Inter",
      "fontSize": "11px",
      "fontWeight": "400",
      "lineHeight": null,
      "source": "css"
    },
    "code": {
      "fontFamily": "Overpass Mono",
      "fontSize": "14px",
      "fontWeight": "400",
      "lineHeight": null,
      "source": "css"
    }
  },
  "fontFaces": [
    {
      "family": "Inter",
      "src": "/_next/static/immutable/media/2c55a0e60120577a-s.03ez25a9g3i0n.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/immutable/media/9c72aa0f40e4eef8-s.3i9rha7jpxn0q.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/immutable/media/ad66f9afd8947f86-s.2o7ko1d-5m1xu.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/immutable/media/5476f68d60460930-s.1ee5w62fj497l.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/immutable/media/2bbe8d2671613f1f-s.1way2z9fj6cig.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/immutable/media/1bffadaabf893a1e-s.0szrwpqb9mkwe.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Inter",
      "src": "/_next/static/immutable/media/83afe278b6a6bb3c-s.p.45535valc9rzk.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Geist",
      "src": "/_next/static/immutable/media/fef07dbb0973bf53-s.00az9qtie3ho1.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Geist",
      "src": "/_next/static/immutable/media/8a480f0b521d4e75-s.3j-a226dh71aj.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Geist",
      "src": "/_next/static/immutable/media/53b9e256198e5412-s.2gwoz23eiro2t.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Geist",
      "src": "/_next/static/immutable/media/7178b3e590c64307-s.0i3h3th1vs4m7.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Geist",
      "src": "/_next/static/immutable/media/caa3a2e1cccd8315-s.p.0zr6hhvz-h9nw.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "Roboto",
      "src": "/_next/static/immutable/media/572c13468b8cff87-s.1mq5s36pj0pak.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Roboto",
      "src": "/_next/static/immutable/media/62d4b50592542c9f-s.1u6j2dgtvkhof.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Roboto",
      "src": "/_next/static/immutable/media/38772d1e0cde909c-s.3dbx4-_3lrmrn.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Roboto",
      "src": "/_next/static/immutable/media/a0ffaa6a9384d9d3-s.1u_-sc7tcpy__.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Roboto",
      "src": "/_next/static/immutable/media/fad568eea626db0e-s.2420v9bshvb4k.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Roboto",
      "src": "/_next/static/immutable/media/ccee61546c0358b7-s.3xl3ybfsmj-am.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Roboto",
      "src": "/_next/static/immutable/media/8fcf71678f67d0c5-s.01pm4i-1drugi.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Roboto",
      "src": "/_next/static/immutable/media/f7d6090e8b3debad-s.1rjy8ctfj1__1.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Roboto",
      "src": "/_next/static/immutable/media/ce62453a442c7f35-s.p.3l4zvto3p0stf.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Plus Jakarta Sans",
      "src": "/_next/static/immutable/media/0b1dc8ddaa74ba49-s.1w1m1wqmjasxa.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Plus Jakarta Sans",
      "src": "/_next/static/immutable/media/e629b5bc06499d58-s.1y3v-klcv8xov.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Plus Jakarta Sans",
      "src": "/_next/static/immutable/media/1a099d89ee94ee96-s.15dvesjzf7814.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Plus Jakarta Sans",
      "src": "/_next/static/immutable/media/fba5a26ea33df6a3-s.p.08ssgmy_tb90r.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Montserrat",
      "src": "/_next/static/immutable/media/8298327da6d5bcce-s.0vdai6er2bzon.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Montserrat",
      "src": "/_next/static/immutable/media/44fac91e6f2d2b1b-s.3xwp9-ll1pnw_.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Montserrat",
      "src": "/_next/static/immutable/media/2b402d8aebffd579-s.370ev4_4-yiay.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Montserrat",
      "src": "/_next/static/immutable/media/a88409fdd7dc121c-s.41r31qmhr7_rd.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Montserrat",
      "src": "/_next/static/immutable/media/e8f2fbee2754df70-s.p.1gavkj72q9u43.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Poppins",
      "src": "/_next/static/immutable/media/41e95f694c5c4549-s.3xzwb88tucl-q.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Poppins",
      "src": "/_next/static/immutable/media/6c55a692938ebbbc-s.20csvlgbb63y1.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Poppins",
      "src": "/_next/static/immutable/media/a218039a3287bcfd-s.p.17e3l4txdrufi.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Poppins",
      "src": "/_next/static/immutable/media/bdc7e24a509eb931-s.0ewdtdf6ai7o-.woff2",
      "format": "woff2",
      "weight": "500"
    },
    {
      "family": "Poppins",
      "src": "/_next/static/immutable/media/0da9c7f357bd9d4d-s.03ilua6xb7p2f.woff2",
      "format": "woff2",
      "weight": "500"
    },
    {
      "family": "Poppins",
      "src": "/_next/static/immutable/media/8e6fa89aa22d24ec-s.p.1bg6trwi21i5q.woff2",
      "format": "woff2",
      "weight": "500"
    },
    {
      "family": "Poppins",
      "src": "/_next/static/immutable/media/0a7740363b4d4863-s.2bakuypqc5dou.woff2",
      "format": "woff2",
      "weight": "600"
    },
    {
      "family": "Poppins",
      "src": "/_next/static/immutable/media/5f9d24ebef5d5292-s.0fg7ryy-bp2x_.woff2",
      "format": "woff2",
      "weight": "600"
    },
    {
      "family": "Poppins",
      "src": "/_next/static/immutable/media/e2334d715941921e-s.p.2g9xiodaln20i.woff2",
      "format": "woff2",
      "weight": "600"
    },
    {
      "family": "Overpass Mono",
      "src": "/_next/static/immutable/media/c9ac8022747e5bc6-s.1edcimvavlx1t.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Overpass Mono",
      "src": "/_next/static/immutable/media/e107f9632452e134-s.076gk9104-itc.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Overpass Mono",
      "src": "/_next/static/immutable/media/9eb1fa291a52974e-s.32ez4aq0wy5vb.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Overpass Mono",
      "src": "/_next/static/immutable/media/585ad3fb8bf41c01-s.2opfr29dwkml-.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Overpass Mono",
      "src": "/_next/static/immutable/media/b0fb7b4004470e87-s.p.0e-3rvg6xaqtn.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "PT Sans",
      "src": "/_next/static/immutable/media/17603af13aa8a542-s.2g4nisyghtt2-.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "PT Sans",
      "src": "/_next/static/immutable/media/207e57240b1809b2-s.2qfbq9_2wyj1k.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "PT Sans",
      "src": "/_next/static/immutable/media/00231884809ac59e-s.07ec9g5v78m7o.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "PT Sans",
      "src": "/_next/static/immutable/media/f05228a5f9ec0eae-s.p.0j0gw2kxf2_9b.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "PT Sans",
      "src": "/_next/static/immutable/media/9dc791b0865fd39f-s.3mw--x2ogezgd.woff2",
      "format": "woff2",
      "weight": "700"
    },
    {
      "family": "PT Sans",
      "src": "/_next/static/immutable/media/c29509b8a0bee3b9-s.1o0ojhe9yj_cm.woff2",
      "format": "woff2",
      "weight": "700"
    },
    {
      "family": "PT Sans",
      "src": "/_next/static/immutable/media/261abb472e2873a9-s.17bxyb1sa_tt2.woff2",
      "format": "woff2",
      "weight": "700"
    },
    {
      "family": "PT Sans",
      "src": "/_next/static/immutable/media/536b4d72a397ec90-s.p.13u6rkil_n81y.woff2",
      "format": "woff2",
      "weight": "700"
    },
    {
      "family": "Hedvig Letters Serif",
      "src": "/_next/static/immutable/media/9fe5b2839959846b-s.2usvc71oo-6og.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Hedvig Letters Serif",
      "src": "/_next/static/immutable/media/388fdbbaaecd531b-s.25y66l2qf_elj.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Hedvig Letters Serif",
      "src": "/_next/static/immutable/media/04bda4e1ea3bb7b5-s.1s7crk0ksuren.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Hedvig Letters Serif",
      "src": "/_next/static/immutable/media/387c923d20582ec7-s.p.2m62wczl7f17o.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Kumbh Sans",
      "src": "/_next/static/immutable/media/832470c8ee2865c1-s.2_zebmi8cwgmq.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Kumbh Sans",
      "src": "/_next/static/immutable/media/db7561691aaf2e45-s.2k1_-ibgbd24f.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Kumbh Sans",
      "src": "/_next/static/immutable/media/f068b75845fa2172-s.01fo1kfnnth14.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Kumbh Sans",
      "src": "/_next/static/immutable/media/5f58f544217b9ef1-s.p.2zgtmnb-_k4qv.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Outfit",
      "src": "/_next/static/immutable/media/850716c16cd0e201-s.1lt0x_ivq6ud2.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Outfit",
      "src": "/_next/static/immutable/media/064198ea55a83123-s.p.0qhqspf_sqmmr.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "DM Sans",
      "src": "/_next/static/immutable/media/c3cb240f9c892514-s.270md_-rr62el.woff2",
      "format": "woff2",
      "weight": "100"
    },
    {
      "family": "DM Sans",
      "src": "/_next/static/immutable/media/5c285b27cdda1fe8-s.p.0lsanbtneewqp.woff2",
      "format": "woff2",
      "weight": "100"
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

| Scroll | Y Position | File |
|--------|-----------|------|

## Pages

| Page | URL | File |
|------|-----|------|

## Sections

| Page | Section | File |
|------|---------|------|

