# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Group/Menu Sub Item** | card | 37× | `.group/menu-sub-item`, `.relative` |
| **Translate X Px** | unknown | 37× | `.-translate-x-px`, `.[&>span:last-child]:truncate`, `.[&>svg]:shrink-0` |
| **Flex** | card | 8× | `.flex`, `.font-heading`, `.font-semibold` |
| **Border** | unknown | 8× | `.border`, `.rounded-lg` |
| **Flex** | card | 8× | `.flex`, `.items-center`, `.justify-between` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 8× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Flex** | card | 8× | `.flex`, `.gap-2`, `.items-center` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 8× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Data Horizontal:Flex Col** | nav-item | 8× | `.data-horizontal:flex-col`, `.flex`, `.gap-2` |
| **Bg Background** | nav-item | 8× | `.bg-background`, `.border`, `.data-[variant=line]:rounded-none` |
| **Border T** | unknown | 8× | `.border-t`, `.duration-200`, `.mx-auto` |
| **Border E 0** | unknown | 8× | `.border-e-0`, `.data-[panel-group-direction=vertical]:flex-col`, `.flex` |
| **Me 0.5** | unknown | 8× | `.-me-0.5`, `.border-e` |
| **Mb 10** | unknown | 7× | `.mb-10`, `.space-y-4` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Flex** | unknown | 3× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 3× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Text Sm** | unknown | 3× | `.text-sm`, `.w-full` |
| **Border L 0** | unknown | 3× | `.border-l-0`, `.border-sidebar-border`, `.flex` |

## Cards

### Group/Menu Sub Item

**Instances found:** 37

**CSS classes:** `.group/menu-sub-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-acti
```

**Base styles (from design tokens):**

```css
.group/menu-sub-item {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 8

**CSS classes:** `.flex` `.font-heading` `.font-semibold` `.gap-3` `.items-center` `.text-xl`

**HTML structure:**

```html
<h2 class="font-heading flex items-center gap-3 text-xl font-semibold">Newsletter Section 1<!-- --> <span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-eve
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 8

**CSS classes:** `.flex` `.items-center` `.justify-between` `.p-3`

**HTML structure:**

```html
<div class="flex items-center justify-between p-3"><div class="flex items-center gap-2"><div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-i
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 8

**CSS classes:** `.flex` `.gap-2` `.items-center`

**HTML structure:**

```html
<div class="flex items-center gap-2"><button data-slot="tooltip-trigger" data-variant="outline" data-size="icon" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-inval
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

## List Items

### Relative

**Instances found:** 3

**CSS classes:** `.relative`

**HTML structure:**

```html
<li data-slot="navigation-menu-item" class="relative"><button id="radix-_R_16aiv5b_-trigger-radix-_R_176aiv5b_" data-state="closed" aria-expanded="false" data-slot="navigation-menu-trigger" class="group/navigation-menu-trigger inline-flex w-max items-center justify-center rounded-3xl transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted group h-auto bg-transparent px-2.5 
```

**Base styles (from design tokens):**

```css
.relative {
  padding: 4px 0;
  border-bottom: 1px solid #27272a;
}```

## Navigation Items

### Data Horizontal:Flex Col

**Instances found:** 8

**CSS classes:** `.data-horizontal:flex-col` `.flex` `.gap-2` `.group/tabs`

**HTML structure:**

```html
<div dir="ltr" data-orientation="horizontal" data-slot="tabs" class="group/tabs flex gap-2 data-horizontal:flex-col"><div role="tablist" aria-orientation="horizontal" data-slot="tabs-list" data-variant="default" class="group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:rounded-2xl data-[variant=line]:rounded-none bg-background h-auto gap-0.5 rounded-md border p-0.5" tabindex="0" data-orientation="horizontal" style="outline:none"><button type=
```

**Base styles (from design tokens):**

```css
.data-horizontal:flex-col {
  padding: 4px 8px;
  cursor: pointer;
  /* active: color: #ff667f; */
}```

### Bg Background

**Instances found:** 8

**CSS classes:** `.bg-background` `.border` `.data-[variant=line]:rounded-none` `.gap-0.5` `.group-data-horizontal/tabs:h-9` `.group-data-vertical/tabs:flex-col`

**HTML structure:**

```html
<div role="tablist" aria-orientation="horizontal" data-slot="tabs-list" data-variant="default" class="group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:rounded-2xl data-[variant=line]:rounded-none bg-background h-auto gap-0.5 rounded-md border p-0.5" tabindex="0" data-orientation="horizontal" style="outline:none"><button type="button" role="tab" aria-selected="false" aria-controls="radix-_R_1pokoluiv5tiiv5b_-content-mobile" data-state="inact
```

**Base styles (from design tokens):**

```css
.bg-background {
  padding: 4px 8px;
  cursor: pointer;
  /* active: color: #ff667f; */
}```

## Buttons

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 8

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<button data-slot="button" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #ff667f;
  color: #ffffff;
  border-radius: 15.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

### Bg Transparent

**Instances found:** 3

**CSS classes:** `.bg-transparent` `.data-[state=open]:bg-transparent` `.data-open:bg-muted/50` `.data-open:focus:bg-muted` `.data-open:hover:bg-muted` `.data-popup-open:bg-muted/50`

**HTML structure:**

```html
<button id="radix-_R_16aiv5b_-trigger-radix-_R_176aiv5b_" data-state="closed" aria-expanded="false" data-slot="navigation-menu-trigger" class="group/navigation-menu-trigger inline-flex w-max items-center justify-center rounded-3xl transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted group h-auto bg-transparent px-2.5 py-2 text-sm shadow-none hover:bg-transparent focus:bg
```

**Base styles (from design tokens):**

```css
.bg-transparent {
  background: #ff667f;
  color: #ffffff;
  border-radius: 15.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Translate X Px

**Instances found:** 37

**CSS classes:** `.-translate-x-px` `.[&>span:last-child]:truncate` `.[&>svg]:shrink-0` `.[&>svg]:size-4` `.[&>svg]:text-sidebar-accent-foreground` `.active:bg-sidebar-accent`

**HTML structure:**

```html
<a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&amp;&gt;span:last-child]:truncate [&am
```

**Base styles (from design tokens):**

```css
.-translate-x-px {
  background: #18181b;
  padding: 4px;
}```

### Border

**Instances found:** 8

**CSS classes:** `.border` `.rounded-lg`

**HTML structure:**

```html
<div class="rounded-lg border"><div class="flex items-center justify-between p-3"><div class="flex items-center gap-2"><div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destruc
```

**Base styles (from design tokens):**

```css
.border {
  background: #18181b;
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 8

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<a target="_blank" data-slot="button" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_sv
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #18181b;
  padding: 4px;
}```

### Border T

**Instances found:** 8

**CSS classes:** `.border-t` `.duration-200` `.mx-auto` `.transition-[max-width]` `.w-full`

**HTML structure:**

```html
<div class="mx-auto w-full border-t transition-[max-width] duration-200"><div data-slot="resizable-panel-group" class="flex h-full data-[panel-group-direction=vertical]:flex-col w-full overflow-visible! rounded-lg border-e-0" style="display:flex;flex-direction:row;height:100%;overflow:hidden;width:100%" data-panel-group="" data-panel-group-direction="horizontal" data-panel-group-id="_R_2okoluiv5tiiv5b_"><div data-slot="resizable-panel" class="-me-0.5 border-e" id="_R_eokoluiv5tiiv5b_" style="flex-basis:0;flex-grow:100;flex-shrink:1;overflow:hidden" data-panel-group-id="_R_2okoluiv5tiiv5b_" dat
```

**Base styles (from design tokens):**

```css
.border-t {
  background: #18181b;
  padding: 4px;
}```

### Border E 0

**Instances found:** 8

**CSS classes:** `.border-e-0` `.data-[panel-group-direction=vertical]:flex-col` `.flex` `.h-full` `.overflow-visible!` `.rounded-lg`

**HTML structure:**

```html
<div data-slot="resizable-panel-group" class="flex h-full data-[panel-group-direction=vertical]:flex-col w-full overflow-visible! rounded-lg border-e-0" style="display:flex;flex-direction:row;height:100%;overflow:hidden;width:100%" data-panel-group="" data-panel-group-direction="horizontal" data-panel-group-id="_R_2okoluiv5tiiv5b_"><div data-slot="resizable-panel" class="-me-0.5 border-e" id="_R_eokoluiv5tiiv5b_" style="flex-basis:0;flex-grow:100;flex-shrink:1;overflow:hidden" data-panel-group-id="_R_2okoluiv5tiiv5b_" data-panel="" data-panel-id="_R_eokoluiv5tiiv5b_" data-panel-size="100.0"><d
```

**Base styles (from design tokens):**

```css
.border-e-0 {
  background: #18181b;
  padding: 4px;
}```

### Me 0.5

**Instances found:** 8

**CSS classes:** `.-me-0.5` `.border-e`

**HTML structure:**

```html
<div data-slot="resizable-panel" class="-me-0.5 border-e" id="_R_eokoluiv5tiiv5b_" style="flex-basis:0;flex-grow:100;flex-shrink:1;overflow:hidden" data-panel-group-id="_R_2okoluiv5tiiv5b_" data-panel="" data-panel-id="_R_eokoluiv5tiiv5b_" data-panel-size="100.0"><div class="relative w-full overflow-hidden rounded-bl-lg rounded-br-lg" style="height: 563px;"><iframe src="/demo?path=%2Fblocks%2Fmarketing%2Fnewsletter-sections%2F1" class="w-full" style="height: 563px;"></iframe></div></div>
```

**Base styles (from design tokens):**

```css
.-me-0.5 {
  background: #18181b;
  padding: 4px;
}```

### Mb 10

**Instances found:** 7

**CSS classes:** `.mb-10` `.space-y-4`

**HTML structure:**

```html
<div class="space-y-4 lg:space-y-6 mb-10 lg:mb-16"><h2 class="font-heading flex items-center gap-3 text-xl font-semibold">Newsletter Section 1<!-- --> <span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-inv
```

**Base styles (from design tokens):**

```css
.mb-10 {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.flex-col` `.min-w-0` `.p-2` `.px-4` `.relative`

**HTML structure:**

```html
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2 px-4 lg:px-0"><div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-xl px-3 font-medium ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0 text-foreground text-sm">Marketing</div><div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### [&>Svg]:Shrink 0

**Instances found:** 3

**CSS classes:** `.[&>svg]:shrink-0` `.[&>svg]:size-4` `.duration-200` `.ease-linear` `.flex` `.focus-visible:ring-2`

**HTML structure:**

```html
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-xl px-3 font-medium ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0 text-foreground text-sm">Marketing</div>
```

**Base styles (from design tokens):**

```css
.[&>svg]:shrink-0 {
  background: #18181b;
  padding: 4px;
}```

### Text Sm

**Instances found:** 3

**CSS classes:** `.text-sm` `.w-full`

**HTML structure:**

```html
<div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm"><ul data-slot="sidebar-menu-sub" data-sidebar="menu-sub" class="mx-3.5 flex min-w-0 translate-x-px flex-col border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden ms-0 gap-0 border-l-0 ps-0"><li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg
```

**Base styles (from design tokens):**

```css
.text-sm {
  background: #18181b;
  padding: 4px;
}```

### Border L 0

**Instances found:** 3

**CSS classes:** `.border-l-0` `.border-sidebar-border` `.flex` `.flex-col` `.gap-0` `.group-data-[collapsible=icon]:hidden`

**HTML structure:**

```html
<ul data-slot="sidebar-menu-sub" data-sidebar="menu-sub" class="mx-3.5 flex min-w-0 translate-x-px flex-col border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden ms-0 gap-0 border-l-0 ps-0"><li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar
```

**Base styles (from design tokens):**

```css
.border-l-0 {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

