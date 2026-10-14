# Layout Reference

> Use this to understand how the site is structured spatially.

## Spacing System

**Base grid:** 4px

**Scale:** `2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 30, 32, 40, 48` px

| Spacing | Semantic Use |
|---------|-------------|
| 4px | Tight — within a component |
| 8px | Medium — between sibling items |
| 16px | Wide — between sections |
| 32px | Vast — major section breaks |

## Flex Layouts

| Element | Direction | Justify | Align | Gap | Children |
|---------|-----------|---------|-------|-----|----------|
| `div.relative.container` | row | space-between | center | 8px | 2 |
| `a.z-10.flex` | row | center | center | 6px 12px | 3 |
| `div.group/sidebar-wrapper.flex` | row | — | start | — | 1 |
| `div.flex.items-center` | row | — | center | 20px | 1 |
| `div.flex.items-center` | row | — | center | 12px | 1 |
| `div.container.flex` | row | space-between | center | — | 2 |
| `div.flex.items-center` | row | — | center | 48px | 2 |
| `div.flex.items-center` | row | — | center | 8px | 3 |
| `div.flex.w-full` | row | — | start | 32px | 2 |
| `a.flex.items-center` | row | — | center | 10px | 1 |
| `div.text-muted-foreground.hidden` | row | — | center | 0px | 1 |
| `div.hidden.gap-1` | row | — | — | 4px | 4 |
| `div.ms-2.flex` | row | — | center | 8px | 2 |
| `ul.[&_a]:text-muted-foreground.[&_a]:hover:text-foreground` | column | — | — | 16px | 30 |
| `ul.[&_a]:text-muted-foreground.[&_a]:hover:text-foreground` | column | — | — | 16px | 40 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `div.container.grid` | `340px 340px 340px 340px` | — | 4 |
| `div.grid.gap-4` | `252.797px 252.797px 252.797px 252.797px 252.812px` | 24px | 4 |
| `div.group/card-header.@container/card-header` | `936.672px 126.328px` | 6px | 3 |

## Structural Containers

### `<nav>` (`nav.bg-background/40.sticky`)

```
display:          block
children:         2
```

### `<main>` (`main.divide-y`)

```
display:          block
children:         2
```

### `<main>` (`main.relative.container`)

```
display:          block
padding:          0px 16px
max-width:        100%
children:         1
```

### `<footer>` 

```
display:          block
children:         3
```

### `<nav>` (`nav.group/navigation-menu.relative`)

```
display:          flex
flex-direction:   row
justify-content:  center
align-items:      center
max-width:        max-content
children:         1
```

## Layout Rules

- **Container max-width:** `100%` — always center with `margin: auto`
- Primary layout system: **Flexbox**
- Secondary layout system: **CSS Grid** (used for card grids and multi-column layouts)
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

