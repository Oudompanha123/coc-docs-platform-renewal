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
| `div.flex.h-svh` | column | — | — | — | 5 |
| `header.flex.h-14` | row | — | center | 12px | 7 |
| `div.flex.flex-1` | row | — | — | — | 2 |
| `main.flex.flex-1` | column | — | — | — | 1 |
| `button#radix-_R_iltiv5b_.group/button.shrink-0` | row | center | center | 6px | 2 |
| `div.ms-auto.flex` | row | — | center | 12px | 4 |
| `aside.flex.w-72` | column | — | — | — | 1 |
| `div.hidden.items-center` | row | — | center | 12px | 3 |
| `div.group/tabs.data-horizontal:flex-col` | column | — | — | 0px | 3 |
| `div.bg-muted.flex` | row | center | — | — | 1 |
| `div.group/toggle-group.flex` | row | — | center | 8px | 3 |
| `div.flex.h-12` | row | — | center | — | 1 |
| `div.bg-background.flex` | column | — | — | — | 2 |
| `div.group/tabs-list.inline-flex` | row | center | center | — | 2 |
| `div.flex.h-full` | column | — | — | — | 2 |

## Structural Containers

### `<header>` (`header.flex.h-14`)

```
display:          flex
flex-direction:   row
justify-content:  —
align-items:      center
gap:              12px
padding:          0px 16px
children:         7
```

### `<main>` (`main.flex.flex-1`)

```
display:          flex
flex-direction:   column
justify-content:  —
align-items:      —
children:         1
```

## Layout Rules

- Primary layout system: **Flexbox**
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

