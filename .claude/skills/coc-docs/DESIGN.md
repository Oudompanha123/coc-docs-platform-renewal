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
  src: url("/_next/static/media/2c55a0e60120577a-s.0bjc5tiuqdqro.woff2") format("woff2");
  font-weight: 100;
}
@font-face {
  font-family: "calSansHeading";
  src: url("/_next/static/media/CalSans_SemiBold-s.p.0_1kxnktzihme.woff2") format("woff2");
  font-weight: 600;
}
@font-face {
  font-family: "Mynerve";
  src: url("/_next/static/media/5e538eebf9acc4c2-s.0y2..~~2d1_g0.woff2") format("woff2");
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
