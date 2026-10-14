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
| ***:[Img:First Child]:Rounded T Lg** | card | 6× | `.*:[img:first-child]:rounded-t-lg`, `.*:[img:last-child]:rounded-b-lg`, `.@container/card` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-2` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-0` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 4× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Group Has Data [Slot=Card Title]/Card Header:@Max Md/Card:Order Last** | card | 3× | `.group-has-data-[slot=card-title]/card-header:@max-md/card:order-last`, `.group-has-data-[slot=card-title]/card-header:@max-md/card:w-full`, `.text-muted-foreground` |
| ****:Data [Slot=Tabs List]:Bg Foreground/10** | card | 3× | `.**:data-[slot=tabs-list]:bg-foreground/10`, `.@container/card-header`, `.@max-md/card:[&:has(>[data-slot=card-title],>[data-slot=card-description])>*:not([data-slot=card-title]):not([data-slot=card-description]):not([data-slot=card-action])]:w-full` |
| **Flex** | card | 3× | `.flex`, `.gap-4`, `.items-center` |
| **Flex** | card | 3× | `.flex`, `.flex-1`, `.gap-4` |
| **Flex 1** | unknown | 3× | `.flex-1`, `.min-w-0`, `.overflow-hidden` |
| **Text Muted Foreground** | unknown | 3× | `.text-muted-foreground`, `.text-sm`, `.truncate` |
| **Recharts Responsive Container** | unknown | 3× | `.recharts-responsive-container` |
| **Recharts Wrapper** | unknown | 3× | `.recharts-wrapper` |

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

**Instances found:** 6

**CSS classes:** `.*:[img:first-child]:rounded-t-lg` `.*:[img:last-child]:rounded-b-lg` `.@container/card` `.[--card-spacing:--spacing(4)]` `.bg-muted/40` `.data-[size=sm]:[--card-spacing:--spacing(3)]`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card @container/card flex flex-col gap-1 overflow-hidden rounded-xl bg-muted/40 text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(3)] *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg"><div data-slot="card-header" class="group/card-header @container/card-header grid min-h-13 auto-rows-min content-center items-center gap-1 px-(--card-spacing) py-2.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-lg {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Group Has Data [Slot=Card Title]/Card Header:@Max Md/Card:Order Last

**Instances found:** 3

**CSS classes:** `.group-has-data-[slot=card-title]/card-header:@max-md/card:order-last` `.group-has-data-[slot=card-title]/card-header:@max-md/card:w-full` `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<div data-slot="card-description" class="text-sm text-muted-foreground group-has-data-[slot=card-title]/card-header:@max-md/card:order-last group-has-data-[slot=card-title]/card-header:@max-md/card:w-full">You are viewing the live demo. Every dashboard you see here is included.</div>
```

**Base styles (from design tokens):**

```css
.group-has-data-[slot=card-title]/card-header:@max-md/card:order-last {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### **:Data [Slot=Tabs List]:Bg Foreground/10

**Instances found:** 3

**CSS classes:** `.**:data-[slot=tabs-list]:bg-foreground/10` `.@container/card-header` `.@max-md/card:[&:has(>[data-slot=card-title],>[data-slot=card-description])>*:not([data-slot=card-title]):not([data-slot=card-description]):not([data-slot=card-action])]:w-full` `.@max-md/card:flex` `.@max-md/card:flex-wrap` `.auto-rows-min`

**HTML structure:**

```html
<div data-slot="card-header" class="group/card-header @container/card-header grid min-h-13 auto-rows-min content-center items-center gap-1 px-(--card-spacing) py-2.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] **:data-[slot=tabs-list]:bg-foreground/10 @max-md/card:flex @max-md/card:flex-wrap @max-md/card:[&amp;:has(&gt;[data-slot=card-title],&gt;[data-slot=card-description])&gt;*:not([data-slot=card-title]):not([data-slot=card-description]):not([data-slot=card-action])]:w-full"><div data-slot="card-title" class="font-heading text-sm l
```

**Base styles (from design tokens):**

```css
.**:data-[slot=tabs-list]:bg-foreground/10 {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.gap-4` `.items-center` `.justify-between` `.min-w-0`

**HTML structure:**

```html
<div class="flex min-w-0 items-center justify-between gap-4"><div class="flex min-w-0 flex-1 items-center gap-4"><span data-slot="avatar" data-size="default" class="group/avatar relative flex size-8 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten shrink-0"><img data-slot="avatar-image" class="aspect-square size-full rounded-full object-cover" src="https://i.pravatar.cc/150?img=1"></span><div class="min-w-0 flex-1 overflow-hidden"><p class="t
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.flex-1` `.gap-4` `.items-center` `.min-w-0`

**HTML structure:**

```html
<div class="flex min-w-0 flex-1 items-center gap-4"><span data-slot="avatar" data-size="default" class="group/avatar relative flex size-8 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten shrink-0"><img data-slot="avatar-image" class="aspect-square size-full rounded-full object-cover" src="https://i.pravatar.cc/150?img=1"></span><div class="min-w-0 flex-1 overflow-hidden"><p class="truncate text-sm leading-none font-medium">Toby Belhome</p><p 
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

**Instances found:** 4

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<button data-slot="popover-trigger" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center rounded-lg border bg-clip-padding text-sm whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-events-none [&amp;_
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
<a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="true" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:op
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
<div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm flex flex-col gap-2"><ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-0"><li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="true" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-dat
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
<ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-0"><li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="true" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### Flex 1

**Instances found:** 3

**CSS classes:** `.flex-1` `.min-w-0` `.overflow-hidden`

**HTML structure:**

```html
<div class="min-w-0 flex-1 overflow-hidden"><p class="truncate text-sm leading-none font-medium">Toby Belhome</p><p class="text-muted-foreground truncate text-sm">hello@example.com</p></div>
```

**Base styles (from design tokens):**

```css
.flex-1 {
  background: #fef2f2;
  padding: 4px;
}```

### Text Muted Foreground

**Instances found:** 3

**CSS classes:** `.text-muted-foreground` `.text-sm` `.truncate`

**HTML structure:**

```html
<p class="text-muted-foreground truncate text-sm">hello@example.com</p>
```

**Base styles (from design tokens):**

```css
.text-muted-foreground {
  background: #fef2f2;
  padding: 4px;
}```

### Recharts Responsive Container

**Instances found:** 3

**CSS classes:** `.recharts-responsive-container`

**HTML structure:**

```html
<div class="recharts-responsive-container" style="width:100%;height:100%;min-width:0"><div style="width:0;height:0;overflow:visible"><div width="328" height="85" class="recharts-wrapper" style="position: relative; cursor: default; width: 328px; height: 85px;"><div xmlns="http://www.w3.org/1999/xhtml" tabindex="-1" class="recharts-tooltip-wrapper" style="visibility: hidden; pointer-events: none; position: absolute; top: 0px; left: 0px;"></div><svg role="application" tabindex="0" class="recharts-surface" width="328" height="85" viewBox="0 0 328 85" style="width: 100%; height: 100%; display: bloc
```

**Base styles (from design tokens):**

```css
.recharts-responsive-container {
  background: #fef2f2;
  padding: 4px;
}```

### Recharts Wrapper

**Instances found:** 3

**CSS classes:** `.recharts-wrapper`

**HTML structure:**

```html
<div width="328" height="85" class="recharts-wrapper" style="position: relative; cursor: default; width: 328px; height: 85px;"><div xmlns="http://www.w3.org/1999/xhtml" tabindex="-1" class="recharts-tooltip-wrapper" style="visibility: hidden; pointer-events: none; position: absolute; top: 0px; left: 0px;"></div><svg role="application" tabindex="0" class="recharts-surface" width="328" height="85" viewBox="0 0 328 85" style="width: 100%; height: 100%; display: block;"><title></title><desc></desc><g tabindex="-1" class="recharts-zIndex-layer_-100"></g><g tabindex="-1" class="recharts-zIndex-layer
```

**Base styles (from design tokens):**

```css
.recharts-wrapper {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#262626` for all dividers within components
- Use `#ff6568` for all interactive/active states

