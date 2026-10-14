# coc-docs DESIGN.md

> Auto-generated design system.
> Frameworks: None detected
> Colors: 20 · Fonts: 3 · Components: 10
> Icon library: not detected · State: not detected
> Primary theme: light · Dark mode toggle: yes · Motion: expressive

---

## 1. Visual Theme & Atmosphere

This is a **light-themed** interface with a cool, approachable feel. The light background emphasizes content clarity. Typography pairs **Inter** for display/headings with **calSansHeading** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **4px base grid** (compact density), with scale: 2, 4, 6, 8, 10, 12, 14, 16px. The accent color **#00a544** anchors interactive elements (buttons, links, focus rings). Motion is expressive — spring physics, layout animations, and staggered reveals are part of the visual language.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| tw-ring-offset-color | `#ffffff` | background | Page background, darkest surface |
| color-red-50 | `#fef2f2` | surface | Card and panel backgrounds |
| color-black | `#000000` | text-primary | Headings and body text |
| color-zinc-700 | `#3f3f46` | text-muted | Captions, placeholders, secondary info |
| color-zinc-800 | `#27272a` | border | Dividers, card borders, outlines |
| color-green-600 | `#00a544` | accent | CTAs, links, focus rings, active states |
| color-rose-400 | `#ff667f` | danger | Error states, destructive actions |
| color-green-50 | `#f0fdf4` | success | Success states, positive indicators |
| color-slate-200 | `#e2e8f0` | info | Informational highlights |
| color-zinc-900 | `#18181b` | unknown | Palette color |
| color-gray-300 | `#d1d5dc` | unknown | Palette color |
| color-zinc-950 | `#09090b` | unknown | Palette color |
| color-red-950 | `#460809` | unknown | Palette color |
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
--tw-border-spacing-x: 0;
--tw-border-spacing-y: 0;
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
--tw-border-spacing-x: 0px;
--tw-border-spacing-y: 0px;
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
| Caption | Inter | 10px | 400 |
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
- Variants: `spacing)`, `foreground`, `header`

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
- **Spacing scale:** 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 28
- **Border radius:** .25rem, .3125rem, .375rem, 2px, 3px, 3.2px 15.2px 15.2px, 4px, 5px, 5.2px, 6px, 7.2px, 11.2px, 12px, 15.2px 15.2px 3.2px, 19.2px, 22%, 23.2px, 23.2px 23.2px 0px 0px, 24%, 24px, 26%, 60px, inherit, 100%
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

- `0 0 0 2px #0000001a`
- `0 0 0 2px buttontext`
- `0 0 2px 2px #0096ff`

### Raised — cards, buttons, interactive elements

- `0 0 0 1px var(--tw-prose-kbd-shadows),0 3px 0 var(--tw-prose-kbd-shadows)`
- `0 0 3px #00000059`
- `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklab(0.145 -0.00000143796 0.00000340492 / 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px`

### Floating — dropdowns, popovers, modals

- `0 0 10px var(--color-blue-500),0 0 5px var(--color-blue-500)`

### Z-Index Scale

`0, 1, 2, 3, 10, 20, 30, 40, 50, 999, 1600, 99999, 9999999`

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

- Use `#00a544` for interactive elements (buttons, links, focus rings)
- Use `#ffffff` as the primary page background
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
Background: #fef2f2
Border: 1px solid #27272a
Radius: 12px
Padding: 16px
Font: calSansHeading
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #00a544, text white
Ghost: bg transparent, border #27272a
Padding: 8px 16px
Radius: 12px
Hover: opacity 0.9 or lighter shade
Focus: ring with #00a544
```

### Build a Page Layout

```
Background: #ffffff
Max-width: 1350px, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #fef2f2
Label: #3f3f46 (muted, 12px, uppercase)
Value: #000000 (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #ffffff
Input border: 1px solid #27272a
Focus: border-color #00a544
Label: #3f3f46 12px
Spacing: 16px between fields
Radius: 12px
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
