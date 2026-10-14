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
| `header.flex.py-10` | row | — | — | — | 1 |
| `div.flex.items-center` | row | — | center | 20px | 1 |
| `div.flex.items-center` | row | — | center | 12px | 1 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `div.container.mx-auto` | `452.656px 452.672px 452.672px` | 16px | 2 |
| `div.container.grid` | `339.5px 339.5px 339.5px 339.5px` | — | 4 |
| `div.mx-auto.grid` | `496px 496px` | — | 2 |

## Structural Containers

### `<nav>` (`nav.bg-background/40.sticky`)

```
display:          block
children:         2
```

### `<main>` (`main.divide-y`)

```
display:          block
children:         18
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

### `<section>` 

```
display:          block
children:         1
```

### `<section>` (`section#components-section`)

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

### `<section>` 

```
display:          block
children:         1
```

### `<section>` (`section#reviews.relative.scroll-mt-28`)

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

