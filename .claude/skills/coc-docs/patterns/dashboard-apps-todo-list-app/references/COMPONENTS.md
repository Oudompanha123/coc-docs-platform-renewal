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
| ***:[Img:First Child]:Rounded T Lg** | card | 8× | `.*:[img:first-child]:rounded-t-lg`, `.*:[img:last-child]:rounded-b-lg`, `.@container/card` |
| **Bg Card** | card | 8× | `.bg-card`, `.flex`, `.flex-1` |
| **Flex** | unknown | 8× | `.flex`, `.flex-col`, `.grow` |
| **Flex** | card | 8× | `.flex`, `.flex-col`, `.items-start` |
| **Capitalize** | card | 8× | `.capitalize`, `.flex`, `.gap-2` |
| **Flex** | card | 7× | `.flex`, `.flex-wrap`, `.gap-4` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-2` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-0` |
| **[&>Svg]:Pointer Events None** | unknown | 4× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-primary/80` |
| **[&>Svg]:Pointer Events None** | unknown | 4× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-primary/80` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 3× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Flex** | unknown | 3× | `.flex`, `.flex-wrap`, `.gap-1` |

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

### *:[Img:First Child]:Rounded T Lg

**Instances found:** 8

**CSS classes:** `.*:[img:first-child]:rounded-t-lg` `.*:[img:last-child]:rounded-b-lg` `.@container/card` `.[--card-spacing:--spacing(4)]` `.bg-muted/40` `.cursor-pointer`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card @container/card flex flex-col gap-1 overflow-hidden rounded-xl bg-muted/40 text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(3)] *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg cursor-pointer transition-shadow hover:shadow-md"><div data-slot="card-content" class="flex-1 overflow-hidden rounded-lg bg-card p-(--card-spacing) ring-1 ring-foreground/5 shadow-2xs flex items-start gap-3"><button type="button" role="checkbox" aria-checked="false" dat
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-lg {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Bg Card

**Instances found:** 8

**CSS classes:** `.bg-card` `.flex` `.flex-1` `.gap-3` `.items-start` `.overflow-hidden`

**HTML structure:**

```html
<div data-slot="card-content" class="flex-1 overflow-hidden rounded-lg bg-card p-(--card-spacing) ring-1 ring-foreground/5 shadow-2xs flex items-start gap-3"><button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabl
```

**Base styles (from design tokens):**

```css
.bg-card {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Flex

**Instances found:** 8

**CSS classes:** `.flex` `.flex-col` `.items-start` `.justify-between` `.space-y-1`

**HTML structure:**

```html
<div class="flex flex-col items-start justify-between space-y-1 lg:flex-row lg:space-y-0"><div class="flex items-center space-x-2"><h3 class="text-md leading-none font-medium">Design homepage layout</h3><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star size-4 cursor-pointer fill-yellow-400 text-yellow-400" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Capitalize

**Instances found:** 8

**CSS classes:** `.capitalize` `.flex` `.gap-2` `.items-center`

**HTML structure:**

```html
<div class="flex items-center gap-2 capitalize"><span data-slot="badge" data-variant="default" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:s
```

**Base styles (from design tokens):**

```css
.capitalize {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Flex

**Instances found:** 7

**CSS classes:** `.flex` `.flex-wrap` `.gap-4` `.items-center`

**HTML structure:**

```html
<div class="flex flex-wrap items-center gap-4"><div class="flex flex-wrap gap-1"><span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border px-2 py-0.5 text-xs whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]
```

**Base styles (from design tokens):**

```css
.flex {
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

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 3

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<button type="button" role="tab" aria-selected="false" aria-controls="radix-_R_59bsnpfl5ubplb_-content-pending" data-state="inactive" id="radix-_R_59bsnpfl5ubplb_-trigger-pending" data-slot="tabs-trigger" class="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visib
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
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

### Flex

**Instances found:** 8

**CSS classes:** `.flex` `.flex-col` `.grow` `.space-y-2`

**HTML structure:**

```html
<div class="flex grow flex-col space-y-2"><div class="flex flex-col items-start justify-between space-y-1 lg:flex-row lg:space-y-0"><div class="flex items-center space-x-2"><h3 class="text-md leading-none font-medium">Design homepage layout</h3><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star size-4 cursor-pointer fill-yellow-400 text-yellow-400" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.5
```

**Base styles (from design tokens):**

```css
.flex {
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

### [&>Svg]:Pointer Events None

**Instances found:** 4

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-primary/80` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20` `.bg-purple-100`

**HTML structure:**

```html
<span data-slot="badge" data-variant="default" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! [a]:hover:bg-primary/80 bg-purple-100 tex
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
  background: #fef2f2;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 4

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-primary/80` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20` `.bg-red-100`

**HTML structure:**

```html
<span data-slot="badge" data-variant="default" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! [a]:hover:bg-primary/80 bg-red-100 text-r
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.flex-wrap` `.gap-1`

**HTML structure:**

```html
<div class="flex flex-wrap gap-1"><span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border px-2 py-0.5 text-xs whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! border-border text-foreground [a]:hove
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#262626` for all dividers within components
- Use `#ff6568` for all interactive/active states

