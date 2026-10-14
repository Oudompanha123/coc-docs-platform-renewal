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

