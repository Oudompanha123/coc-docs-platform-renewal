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
| `div.flex.flex-col` | row | space-between | center | 0px | 2 |
| `div.flex.h-[calc(100vh-4.5rem)]` | row | — | — | — | 2 |
| `div.flex.shrink-0` | row | — | center | 8px | 2 |
| `div.ml-auto.flex` | row | end | center | 8px | 4 |
| `div.relative.flex` | row | — | — | — | 2 |
| `div.flex.h-full` | column | — | — | — | 2 |
| `div.hidden.gap-2` | row | — | — | 8px | 2 |
| `button.group/button.inline-flex` | row | center | center | 6px | 1 |
| `div.bg-background/95.absolute` | row | — | center | 2px | 5 |
| `div.flex.min-h-0` | column | — | — | — | 1 |
| `button.group/button.inline-flex` | row | center | center | 6px | 1 |
| `div.group/toggle-group.flex` | row | — | center | 8px | 2 |
| `div.group/tabs.gap-2` | column | — | — | 8px | 5 |
| `button.group-data-[spacing=0]/toggle-group:rounded-none.grou` | row | center | center | 4px | 1 |
| `button.group-data-[spacing=0]/toggle-group:rounded-none.grou` | row | center | center | 4px | 1 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `div.group/tabs-list.items-center` | `61.75px 61.75px 61.75px 61.75px` | — | 4 |

## Layout Rules

- Primary layout system: **Flexbox**
- Secondary layout system: **CSS Grid** (used for card grids and multi-column layouts)
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

