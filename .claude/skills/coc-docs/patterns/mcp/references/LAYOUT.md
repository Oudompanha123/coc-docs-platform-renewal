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
| `section.flex.flex-col` | column | center | center | — | 1 |
| `div.relative.container` | row | space-between | center | 8px | 3 |
| `a.z-10.flex` | row | center | center | 6px 12px | 3 |
| `div.flex.items-center` | row | — | center | 20px | 1 |
| `div.flex.items-center` | row | — | center | 12px | 1 |
| `div.container.flex` | row | space-between | center | — | 2 |
| `div.flex.items-center` | row | — | center | 48px | 2 |
| `div.flex.items-center` | row | — | center | 8px | 3 |
| `div.mx-auto.flex` | column | — | center | — | 3 |
| `a.flex.items-center` | row | — | center | 10px | 1 |
| `div.text-muted-foreground.hidden` | row | — | center | 0px | 1 |
| `div.hidden.gap-1` | row | — | — | 4px | 4 |
| `div.ms-2.flex` | row | — | center | 8px | 2 |
| `div.flex.items-center` | row | center | center | 12px | 2 |
| `div.flex.w-full` | column | — | — | — | 6 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `div.container.grid` | `339.5px 339.5px 339.5px 339.5px` | — | 4 |
| `div.grid.gap-4` | `252.391px 252.391px 252.391px 252.406px 252.391px` | 24px | 4 |
| `ol.mx-auto.mt-12` | `384px 384px 384px` | 0px | 3 |
| `ul.mx-auto.mt-10` | `373.328px 373.328px 373.344px` | 16px | 15 |

## Structural Containers

### `<nav>` (`nav.bg-background/40.sticky`)

```
display:          block
children:         2
```

### `<main>` (`main.divide-y`)

```
display:          block
children:         8
```

### `<footer>` 

```
display:          block
children:         3
```

### `<section>` (`section.flex.flex-col`)

```
display:          flex
flex-direction:   column
justify-content:  center
align-items:      center
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

### `<section>` (`section#setup.scroll-mt-24`)

```
display:          block
children:         1
```

### `<section>` (`section.scroll-mt-24`)

```
display:          block
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

### `<section>` 

```
display:          block
children:         1
```

## Layout Rules

- **Container max-width:** `1024px` — always center with `margin: auto`
- Primary layout system: **Flexbox**
- Secondary layout system: **CSS Grid** (used for card grids and multi-column layouts)
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

