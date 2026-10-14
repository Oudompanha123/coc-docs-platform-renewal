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
- Variants: `foreground`, `:order-last`, `:w-full`, `header`, `spacing)`

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
- **Border radius:** 0px 4px 4px 0px, .25rem, 2px, 4px, 5px, inherit, 4px 0px 0px 4px, 6px, 8px, 10px, 14px 14px 0px 0px, 14px, 26px
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
- Use border-radius from the scale: 0px 4px 4px 0px, .25rem, 2px, 4px, 5px
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
Radius: 4px 0px 0px 4px
Padding: 16px
Font: Geist
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #ff6568, text white
Ghost: bg transparent, border #262626
Padding: 8px 16px
Radius: 4px 0px 0px 4px
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
Radius: 4px 0px 0px 4px
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
