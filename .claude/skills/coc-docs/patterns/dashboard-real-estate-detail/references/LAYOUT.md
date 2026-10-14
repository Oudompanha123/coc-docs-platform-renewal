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
| `div.mt-3.flex` | row | — | center | 12px | 2 |
| `div.group/card.@container/card` | column | — | — | 4px | 1 |
| `ul.flex.w-full` | column | — | — | 0px | 1 |
| `div.relative.flex` | column | — | — | — | 1 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `section.grid.gap-3` | `333.328px 333.328px 333.344px` | 12px | 2 |
| `section.grid.gap-4` | `680px 320px` | 24px | 2 |
| `section.grid.gap-4` | `280px 720px` | 24px | 2 |
| `div.grid.gap-3` | `160.672px 160.672px` | 12px | 4 |
| `div.group/card-header.@container/card-header` | `688px` | 4px | 1 |
| `div.grid.gap-4` | `325.328px 325.328px 325.344px` | 24px | 3 |

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

### `<section>` (`section.grid.gap-3`)

```
display:          grid
grid-template-columns: 333.328px 333.328px 333.344px
gap:              12px
children:         2
```

### `<section>` (`section.grid.gap-4`)

```
display:          grid
grid-template-columns: 680px 320px
gap:              24px
children:         2
```

### `<section>` (`section.grid.gap-4`)

```
display:          grid
grid-template-columns: 280px 720px
gap:              24px
children:         2
```

### `<section>` (`section.space-y-4`)

```
display:          block
children:         2
```

## Layout Rules

- Primary layout system: **Flexbox**
- Secondary layout system: **CSS Grid** (used for card grids and multi-column layouts)
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

