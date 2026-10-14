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
| `div.relative.container` | row | space-between | center | 8px | 3 |
| `a.z-10.flex` | row | center | center | 6px 12px | 3 |
| `div.flex.items-center` | row | — | center | 20px | 1 |
| `div.flex.items-center` | row | — | center | 12px | 1 |
| `div.container.flex` | row | space-between | center | — | 2 |
| `div.flex.items-center` | row | — | center | 48px | 2 |
| `div.flex.items-center` | row | — | center | 8px | 3 |
| `a.flex.items-center` | row | — | center | 10px | 1 |
| `div.text-muted-foreground.hidden` | row | — | center | 0px | 1 |
| `div.hidden.gap-1` | row | — | — | 4px | 4 |
| `div.ms-2.flex` | row | — | center | 8px | 2 |
| `ul.[&_a]:text-muted-foreground.[&_a]:hover:text-foreground` | column | — | — | 16px | 30 |
| `ul.[&_a]:text-muted-foreground.[&_a]:hover:text-foreground` | column | — | — | 16px | 40 |
| `ul.[&_a]:text-muted-foreground.[&_a]:hover:text-foreground` | column | — | — | 16px | 24 |
| `ul.[&_a]:text-muted-foreground.[&_a]:hover:text-foreground` | column | — | — | 16px | 16 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `div.container.grid` | `339.5px 339.5px 339.5px 339.5px` | — | 4 |
| `div.grid.gap-4` | `252.391px 252.391px 252.391px 252.406px 252.391px` | 24px | 4 |

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

### `<footer>` 

```
display:          block
children:         3
```

### `<section>` (`section.py-8.lg:py-16`)

```
display:          block
padding:          64px 0px
children:         1
```

### `<article>` 

```
display:          block
children:         6
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

- **Container max-width:** `384px` — always center with `margin: auto`
- Primary layout system: **Flexbox**
- Secondary layout system: **CSS Grid** (used for card grids and multi-column layouts)
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

