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
| `div.flex.h-(--content-full-height)` | row | — | — | — | 2 |
| `div.mt-3.flex` | row | — | center | 12px | 2 |
| `div.group/card.@container/card` | column | — | — | 4px | 1 |
| `div.group/card.@container/card` | column | — | — | 4px | 1 |

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

- **Container max-width:** `384px` — always center with `margin: auto`
- Primary layout system: **Flexbox**
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

