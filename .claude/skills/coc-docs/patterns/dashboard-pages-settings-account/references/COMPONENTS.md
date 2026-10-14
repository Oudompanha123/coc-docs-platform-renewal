# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **[&>Span:Last Child]:Truncate** | unknown | 39× | `.[&>span:last-child]:truncate`, `.[&_svg]:shrink-0`, `.[&_svg]:size-4` |
| **Group/Menu Item** | card | 32× | `.group/menu-item`, `.relative` |
| **Group/Menu Item** | card | 13× | `.group/menu-item`, `.relative` |
| **Block** | unknown | 13× | `.block`, `.group-data-[collapsible=icon]:hidden`, `.group/collapsible` |
| **[&>Span:Last Child]:Truncate** | button | 13× | `.[&>span:last-child]:truncate`, `.[&_svg]:shrink-0`, `.[&_svg]:size-4` |
| **Group/Menu Item** | card | 8× | `.group/menu-item`, `.relative` |
| **Group/Menu Sub Item** | card | 6× | `.group/menu-sub-item`, `.relative` |
| **Translate X Px** | unknown | 6× | `.-translate-x-px`, `.[&>span:last-child]:truncate`, `.[&>svg]:shrink-0` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-2` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-0` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 5× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| ***:[Img:First Child]:Rounded T Lg** | card | 3× | `.*:[img:first-child]:rounded-t-lg`, `.*:[img:last-child]:rounded-b-lg`, `.@container/card` |
| **Text Muted Foreground** | unknown | 3× | `.text-muted-foreground`, `.text-sm` |

## Cards

### Group/Menu Item

**Instances found:** 32

**CSS classes:** `.group/menu-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer
```

**Base styles (from design tokens):**

```css
.group/menu-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Group/Menu Item

**Instances found:** 13

**CSS classes:** `.group/menu-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><div class="hidden group-data-[collapsible=icon]:block"><button data-slot="dropdown-menu-trigger" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sideba
```

**Base styles (from design tokens):**

```css
.group/menu-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Group/Menu Item

**Instances found:** 8

**CSS classes:** `.group/menu-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabl
```

**Base styles (from design tokens):**

```css
.group/menu-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Group/Menu Sub Item

**Instances found:** 6

**CSS classes:** `.group/menu-sub-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a target="" data-slot="sidebar-menu-sub-button" data-sidebar="menu-sub-button" data-size="md" data-active="false" class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 ar
```

**Base styles (from design tokens):**

```css
.group/menu-sub-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### *:[Img:First Child]:Rounded T Lg

**Instances found:** 3

**CSS classes:** `.*:[img:first-child]:rounded-t-lg` `.*:[img:last-child]:rounded-b-lg` `.@container/card` `.[--card-spacing:--spacing(4)]` `.bg-muted/40` `.data-[size=sm]:[--card-spacing:--spacing(3)]`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card @container/card flex flex-col gap-1 rounded-xl bg-muted/40 text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(3)] *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg overflow-hidden group-data-[collapsible=icon]:hidden"><div data-slot="card-content" class="flex-1 overflow-hidden rounded-lg bg-card ring-1 ring-foreground/5 shadow-2xs space-y-3 p-3"><div class="space-y-1"><div data-slot="card-title" class="font-heading text-sm leading-snug font-semib
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-lg {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

## Buttons

### [&>Span:Last Child]:Truncate

**Instances found:** 13

**CSS classes:** `.[&>span:last-child]:truncate` `.[&_svg]:shrink-0` `.[&_svg]:size-4` `.active:bg-sidebar-accent` `.active:text-sidebar-accent-foreground` `.aria-disabled:opacity-50`

**HTML structure:**

```html
<button data-slot="collapsible-trigger" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacit
```

**Base styles (from design tokens):**

```css
.[&>span:last-child]:truncate {
  background: #ff6568;
  color: #0a1510;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### [&>Span:Last Child]:Truncate

**Instances found:** 39

**CSS classes:** `.[&>span:last-child]:truncate` `.[&_svg]:shrink-0` `.[&_svg]:size-4` `.active:bg-sidebar-accent` `.active:text-sidebar-accent-foreground` `.aria-disabled:opacity-50`

**HTML structure:**

```html
<a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:o
```

**Base styles (from design tokens):**

```css
.[&>span:last-child]:truncate {
  background: #fef2f2;
  padding: 4px;
}```

### Block

**Instances found:** 13

**CSS classes:** `.block` `.group-data-[collapsible=icon]:hidden` `.group/collapsible`

**HTML structure:**

```html
<div data-state="closed" data-slot="collapsible" class="group/collapsible block group-data-[collapsible=icon]:hidden"><button data-slot="collapsible-trigger" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-acc
```

**Base styles (from design tokens):**

```css
.block {
  background: #fef2f2;
  padding: 4px;
}```

### Translate X Px

**Instances found:** 6

**CSS classes:** `.-translate-x-px` `.[&>span:last-child]:truncate` `.[&>svg]:shrink-0` `.[&>svg]:size-4` `.[&>svg]:text-sidebar-accent-foreground` `.active:bg-sidebar-accent`

**HTML structure:**

```html
<a target="" data-slot="sidebar-menu-sub-button" data-sidebar="menu-sub-button" data-size="md" data-active="false" class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs d
```

**Base styles (from design tokens):**

```css
.-translate-x-px {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.min-w-0` `.p-2` `.relative` `.w-full`

**HTML structure:**

```html
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2"><div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0">Dashboards</div><div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### [&>Svg]:Shrink 0

**Instances found:** 5

**CSS classes:** `.[&>svg]:shrink-0` `.[&>svg]:size-4` `.duration-200` `.ease-linear` `.flex` `.focus-visible:ring-2`

**HTML structure:**

```html
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0">Dashboards</div>
```

**Base styles (from design tokens):**

```css
.[&>svg]:shrink-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.gap-2` `.text-sm` `.w-full`

**HTML structure:**

```html
<div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm flex flex-col gap-2"><ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-0"><li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-da
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.gap-0` `.min-w-0` `.w-full`

**HTML structure:**

```html
<ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-0"><li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 5

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<a data-slot="button" data-variant="ghost" data-size="default" class="group/button inline-flex shrink-0 items-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-even
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #fef2f2;
  padding: 4px;
}```

### Text Muted Foreground

**Instances found:** 3

**CSS classes:** `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<p data-slot="form-description" id="_R_1av5uknpfl5ubplb_-form-item-description" class="text-sm text-muted-foreground">This is the name that will be displayed on your profile and in emails.</p>
```

**Base styles (from design tokens):**

```css
.text-muted-foreground {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#262626` for all dividers within components
- Use `#ff6568` for all interactive/active states

