---
name: coc-docs-dashboard-pages-error-404
description: Design system skill for coc-docs. Activate when building UI components, pages, or any visual elements. Provides exact color tokens, typography scale, spacing grid, component patterns, and craft rules. Read references/DESIGN.md before writing any CSS or JSX. For motion and layout details, read references/ANIMATIONS.md, references/LAYOUT.md, references/COMPONENTS.md, and references/INTERACTIONS.md for full motion and layout details.
---

# coc-docs Design System

You are building UI for **coc-docs**. Dark-themed, warm palette, sans-serif typography (Geist), compact density on a 4px grid, expressive motion.

## Reference Files

This package includes extended documentation. **Read these files before implementing:**

| File | Contents |
|------|----------|
| `references/DESIGN.md` | Full design system tokens, colors, typography, spacing |
| `references/ANIMATIONS.md` | CSS keyframes, scroll triggers, motion library stack, video specs |
| `references/LAYOUT.md` | Flex/grid containers, page structure, spacing relationships |
| `references/COMPONENTS.md` | DOM component patterns, HTML structure, class fingerprints |
| `references/INTERACTIONS.md` | Hover/focus states with before/after style diffs |

## Design Philosophy

- **Layered depth** — use shadow tokens to create a sense of physical layering. Each elevation level has a specific shadow.
- **Gradient accents** — gradients are used thoughtfully for emphasis, not decoration.
- **Type pairing** — Geist for body/UI text, Inter for headings/display. Never introduce a third typeface.
- **compact density** — 4px base grid. Every dimension is a multiple of 4.
- **warm palette** — the color temperature runs warm, matching the sans-serif typography.
- **Restrained accent** — `#ff667f` is the only pop of color. Used exclusively for CTAs, links, focus rings, and active states.
- **Expressive motion** — animations are an integral part of the experience. Use spring physics and layout animations.

## Color System

### Core Palette

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Background | `--background` | `#0a1510` | Page/app background |
| Surface | `--surface` | `#000000` | Cards, panels, modals |
| Text Primary | `--text-primary` | `#ffffff` | Headings, body text |
| Text Muted | `--text-muted` | `#404040` | Captions, placeholders |
| Accent | `--accent` | `#ff667f` | CTAs, links, focus rings |
| Border | `--border` | `#262626` | Dividers, card borders |

### Status Colors

| Status | Hex | Use |
|--------|-----|-----|
| Success | `#f0fdf4` | Confirmations, positive trends |
| Danger | `#fef2f2` | Errors, destructive actions |

### Extended Palette

- **color-slate-200:** `#e2e8f0` — Light surface or highlight color
- **color-red-950:** `#460809`
- **color-sky-400:** `#00bcfe`
- **ring:** `#a1a1a1`
- **color-green-600:** `#00a544`
- **color-sky-600:** `#0084cc`
- **color-green-500:** `#00c758`
- **color-green-950:** `#032e15` — Deep background layer or shadow color

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

- **Geist** — Heading 1, Heading 2
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
| Heading 1 | Geist | clamp(3rem,15vw,15rem) | 700 |
| Heading 2 | Geist | 2.75rem | 700 |
| Body | Inter | 13px | 400 |
| Caption | Inter | 15px | 400 |
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

`2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 32` px

### Spacing as Meaning

| Spacing | Use |
|---------|-----|
| 4-8px | Tight: related items (icon + label, avatar + name) |
| 12-16px | Medium: between groups within a section |
| 24-32px | Wide: between distinct sections |
| 48px+ | Vast: major page section breaks |

### Border Radius

Scale: `.25rem, 2px, 4px, 5px, inherit, .3125rem, .375rem, 3px, 6px, 7.2px, 10px, 19.2px, 22%, 23.2px, 24%, 24px, 26%, 60px`
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
| xs | 479px |
| xs | 480px |
| 2xl | 1500px |

Mobile-first: design for small screens, layer on responsive overrides.

## Component Patterns

### Card

```css
.card {
  background: #000000;
  border: 1px solid #262626;
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
  background: #ff667f;
  color: #ffffff;
  border-radius: 7.2px;
  padding: 8px 16px;
  font-weight: 500;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.9; }

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid #262626;
  color: #ffffff;
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
  background: #0a1510;
  border: 1px solid #262626;
  border-radius: 7.2px;
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
  background: #000000;
  color: #404040;
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
  background: #000000;
  border: 1px solid #262626;
  border-radius: 60px;
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
  color: #404040;
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
  color: #404040;
  padding: 8px 12px;
  border-radius: 7.2px;
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
- **Cards** — Grid of 36 card elements (36 items)

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

- **Duration scale:** `.1s`, `.15s`, `.2s`, `.3s`, `.4s`, `.5s`, `.7s`, `1s`, `75ms`
- **Easing functions:** `cubic-bezier(.22,1,.36,1)`, `linear`, `cubic-bezier(.7,0,.84,0)`, `cubic-bezier(.23,1,.32,1)`, `cubic-bezier(.16,1,.3,1)`, `cubic-bezier(.8,0,1,1)`, `cubic-bezier(0,0,.2,1)`

### Motion Guidelines

- **Duration:** Use values from the duration scale above. Short (.1s) for micro-interactions, long (75ms) for page transitions
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

- Raised (cards, buttons): `0 0 0 1px var(--tw-prose-kbd-shadows),0 3px 0 var(--tw-prose-kbd-shadows)`
- Floating (dropdowns, popovers): `0 0 10px var(--primary),0 0 5px var(--primary)`
- Floating (dropdowns, popovers): `0 0 10px var(--color-blue-500),0 0 5px var(--color-blue-500)`

### Z-Index Scale

`0, 1, 10, 20, 30, 40, 50, 100, 999, 1600, 9999999`

Use these exact values — never invent z-index values.

## Anti-Patterns (Never Do)

- **No zebra striping** — tables and lists use borders for separation
- **No invented colors** — every hex value must come from the palette above
- **No arbitrary spacing** — every dimension is a multiple of 4px
- **No extra fonts** — only Geist and Inter and Overpass Mono are allowed
- **No arbitrary border-radius** — use the scale: .25rem, 2px, 4px, 5px, .3125rem, .375rem, 3px, 6px, 7.2px, 10px
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
- **Brand color:** `#ff667f`
- **Brand typeface:** Geist

## Quick Reference

```
Background:     #0a1510
Surface:        #000000
Text:           #ffffff / #404040
Accent:         #ff667f
Border:         #262626
Font:           Geist
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

This is a **dark-themed** interface with a warm tone. Depth is expressed through layered shadows and subtle surface color variation. Typography pairs **Inter** for display/headings with **Geist** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **4px base grid** (compact density), with scale: 2, 4, 6, 8, 10, 12, 14, 16px. The accent color **#ff667f** anchors interactive elements (buttons, links, focus rings). Motion is expressive — spring physics, layout animations, and staggered reveals are part of the visual language.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| primary-1000 | `#0a1510` | background | Page background, darkest surface |
| color-black | `#000000` | surface | Card and panel backgrounds |
| tw-ring-offset-color | `#ffffff` | text-primary | Headings and body text |
| color-neutral-700 | `#404040` | text-muted | Captions, placeholders, secondary info |
| muted-foreground | `#737373` | text-muted | Captions, placeholders, secondary info |
| chart-5 | `#262626` | border | Dividers, card borders, outlines |
| color-rose-400 | `#ff667f` | accent | CTAs, links, focus rings, active states |
| color-red-50 | `#fef2f2` | danger | Error states, destructive actions |
| color-green-50 | `#f0fdf4` | success | Success states, positive indicators |
| color-slate-200 | `#e2e8f0` | info | Informational highlights |
| color-red-950 | `#460809` | unknown | Palette color |
| color-sky-400 | `#00bcfe` | unknown | Palette color |
| ring | `#a1a1a1` | unknown | Palette color |
| color-green-600 | `#00a544` | unknown | Palette color |
| color-sky-600 | `#0084cc` | unknown | Palette color |
| color-green-500 | `#00c758` | unknown | Palette color |
| color-green-950 | `#032e15` | unknown | Palette color |
| color-rose-600 | `#e70044` | unknown | Palette color |
| color-red-600 | `#e40014` | unknown | Palette color |
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
- **Geist** — Heading 1, Heading 2
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
| Heading 1 | Geist | clamp(3rem,15vw,15rem) | 700 |
| Heading 2 | Geist | 2.75rem | 700 |
| Body | Inter | 13px | 400 |
| Caption | Inter | 15px | 400 |
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
- **Border radius:** .25rem, 2px, 4px, 5px, inherit, .3125rem, .375rem, 3px, 6px, 7.2px, 10px, 19.2px, 22%, 23.2px, 24%, 24px, 26%, 60px
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

- `0 0 10px var(--primary),0 0 5px var(--primary)`
- `0 0 10px var(--color-blue-500),0 0 5px var(--color-blue-500)`

### Z-Index Scale

`0, 1, 10, 20, 30, 40, 50, 100, 999, 1600, 9999999`

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

- Use `#ff667f` for interactive elements (buttons, links, focus rings)
- Use `#0a1510` as the primary page background
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
| xs | 479px | css |
| xs | 480px | css |
| 2xl | 1500px | css |

**Approach:** Use `@media (min-width: ...)` queries matching the breakpoints above.

---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #000000
Border: 1px solid #262626
Radius: 7.2px
Padding: 16px
Font: Geist
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #ff667f, text white
Ghost: bg transparent, border #262626
Padding: 8px 16px
Radius: 7.2px
Hover: opacity 0.9 or lighter shade
Focus: ring with #ff667f
```

### Build a Page Layout

```
Background: #0a1510
Max-width: 1350px, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #000000
Label: #404040 (muted, 12px, uppercase)
Value: #ffffff (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #0a1510
Input border: 1px solid #262626
Focus: border-color #ff667f
Label: #404040 12px
Spacing: 16px between fields
Radius: 7.2px
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

Pure CSS animations — no external animation libraries detected.

## CSS Keyframes (9)

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
transition: transform 0.4s;
transition: transform 0.4s, opacity 0.4s, height 0.4s, box-shadow 0.2s;
transition: opacity 0.4s, box-shadow 0.2s;
transition: opacity 0.1s, background 0.2s, border-color 0.2s;
transition: opacity 0.4s;
transition: transform 0.5s, opacity 0.2s;
transition: opacity 0.2s, transform 0.2s;
```

## How to Recreate This Motion Design

### Step 1 — Scroll-Reveal Pattern

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

### Step 2 — Key Motion Principles

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
| `div.from-background.to-secondary/10` | column | center | center | — | 1 |
| `div.bg-primary/5.border-primary/10` | row | center | center | — | 3 |
| `div.flex.justify-center` | row | center | — | — | 1 |
| `a.group/button.inline-flex` | row | center | center | 6px | 1 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `div.absolute.inset-0` | `76.5938px 76.5938px 76.6094px 76.5938px 76.5938px ` | — | 100 |

## Layout Rules

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
| **Border 1** | unknown | 100× | `.border-1`, `.border-primary/30` |

## Other Components

### Border 1

**Instances found:** 100

**CSS classes:** `.border-1` `.border-primary/30`

**HTML structure:**

```html
<div class="border-primary/30 border-1" style="opacity:0.5780813477641739"></div>
```

**Base styles (from design tokens):**

```css
.border-1 {
  background: #000000;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#262626` for all dividers within components
- Use `#ff667f` for all interactive/active states

## Interactions & States (INTERACTIONS.md)

# Interaction Reference

> Micro-interactions. Recreate these exactly for authentic feel.

## Coverage

| Component Type | Count | States Captured |
|----------------|-------|----------------|
| Link | 1 | default, hover, focus |

## Transition System

These transition declarations are used on interactive elements:

```css
transition: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
```

Apply these to all interactive elements. Never invent new durations or easings.

## Link Interactions

### Link 1 — `Back to Home`

**On hover:**

```css
/* background-color: lab(100 0 0) → */ background-color: lab(96.52 -0.0000298023 0.0000119209);
```

**On focus:**

```css
/* border-color: lab(90.952 0 -0.0000119209) → */ border-color: lab(66.128 -0.0000298023 0.0000119209);
/* box-shadow: none → */ box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) 0px 0px 0px 3px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
/* outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 3px → */ outline: oklab(0.707999 -0.00000712276 0.0000166297 / 0.5) none 1px;
```

**Transition:** `0.15s cubic-bezier(0.4, 0, 0.2, 1)`

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
      "value": "#0a1510",
      "role": "background",
      "name": "primary-1000"
    },
    "surface": {
      "value": "#000000",
      "role": "surface",
      "name": "color-black"
    },
    "border": {
      "value": "#262626",
      "role": "border",
      "name": "chart-5"
    },
    "accent": {
      "value": "#ff667f",
      "role": "accent",
      "name": "color-rose-400"
    },
    "text-muted": {
      "value": "#737373",
      "role": "text-muted",
      "name": "muted-foreground"
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
    "color-red-950": {
      "value": "#460809",
      "role": "unknown",
      "name": "color-red-950"
    },
    "color-sky-400": {
      "value": "#00bcfe",
      "role": "unknown",
      "name": "color-sky-400"
    },
    "ring": {
      "value": "#a1a1a1",
      "role": "unknown",
      "name": "ring"
    },
    "color-green-600": {
      "value": "#00a544",
      "role": "unknown",
      "name": "color-green-600"
    },
    "color-sky-600": {
      "value": "#0084cc",
      "role": "unknown",
      "name": "color-sky-600"
    },
    "color-green-500": {
      "value": "#00c758",
      "role": "unknown",
      "name": "color-green-500"
    },
    "color-green-950": {
      "value": "#032e15",
      "role": "unknown",
      "name": "color-green-950"
    },
    "color-rose-600": {
      "value": "#e70044",
      "role": "unknown",
      "name": "color-rose-600"
    },
    "color-red-600": {
      "value": "#e40014",
      "role": "unknown",
      "name": "color-red-600"
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
    "Geist",
    "Inter",
    "Overpass Mono"
  ],
  "scale": {
    "heading-1": {
      "fontFamily": "Geist",
      "fontSize": "clamp(3rem,15vw,15rem)",
      "fontWeight": "700",
      "lineHeight": null,
      "source": "css"
    },
    "heading-2": {
      "fontFamily": "Geist",
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
    },
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

| Scroll | Y Position | File |
|--------|-----------|------|

## Pages

| Page | URL | File |
|------|-----|------|

## Sections

| Page | Section | File |
|------|---------|------|

