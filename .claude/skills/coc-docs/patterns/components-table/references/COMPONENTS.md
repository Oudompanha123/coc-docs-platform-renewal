# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 66× | `.[&:has([role=checkbox])]:pr-0`, `.align-middle`, `.font-medium` |
| **Group/Menu Sub Item** | card | 49× | `.group/menu-sub-item`, `.relative` |
| **Translate X Px** | unknown | 49× | `.-translate-x-px`, `.[&>span:last-child]:truncate`, `.[&>svg]:shrink-0` |
| **Overflow X Auto** | unknown | 13× | `.overflow-x-auto`, `.relative`, `.w-full` |
| **Caption Bottom** | unknown | 13× | `.caption-bottom`, `.text-sm`, `.w-full` |
| **[& Tr]:Border B** | unknown | 13× | `.[&_tr]:border-b` |
| **[& Tr:Last Child]:Border 0** | unknown | 13× | `.[&_tr:last-child]:border-0` |
| **Flex** | card | 12× | `.flex`, `.flex-col`, `.group` |
| **Absolute** | card | 12× | `.absolute`, `.flex`, `.inset-x-0` |
| **Group Hover:Opacity 100** | unknown | 12× | `.group-hover:opacity-100`, `.opacity-0`, `.transition-opacity` |
| **Flex** | card | 12× | `.flex`, `.gap-2`, `.items-center` |
| **Flex** | card | 12× | `.flex`, `.items-center`, `.justify-center` |
| **Border B** | unknown | 7× | `.border-b`, `.data-[state=selected]:bg-muted`, `.transition-colors` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Text Sm** | unknown | 5× | `.text-sm`, `.w-full` |
| **Border L 0** | unknown | 5× | `.border-l-0`, `.border-sidebar-border`, `.flex` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Max W 6xl** | unknown | 3× | `.max-w-6xl`, `.space-y-4`, `.w-full` |

## Cards

### Group/Menu Sub Item

**Instances found:** 49

**CSS classes:** `.group/menu-sub-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-acti
```

**Base styles (from design tokens):**

```css
.group/menu-sub-item {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 12

**CSS classes:** `.flex` `.flex-col` `.group` `.items-center` `.justify-center` `.p-4`

**HTML structure:**

```html
<div class="group relative flex flex-col items-center justify-center p-4 lg:min-h-56 lg:p-8"><div class="absolute inset-x-0 top-0 mb-4 flex items-start justify-between p-3 transition-opacity"><div class="opacity-0 transition-opacity group-hover:opacity-100"><div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="icon" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-vis
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Absolute

**Instances found:** 12

**CSS classes:** `.absolute` `.flex` `.inset-x-0` `.items-start` `.justify-between` `.mb-4`

**HTML structure:**

```html
<div class="absolute inset-x-0 top-0 mb-4 flex items-start justify-between p-3 transition-opacity"><div class="opacity-0 transition-opacity group-hover:opacity-100"><div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="icon" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disa
```

**Base styles (from design tokens):**

```css
.absolute {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 12

**CSS classes:** `.flex` `.gap-2` `.items-center`

**HTML structure:**

```html
<div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="icon" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-d
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 12

**CSS classes:** `.flex` `.items-center` `.justify-center` `.py-8` `.w-full`

**HTML structure:**

```html
<div class="flex w-full items-center justify-center py-8"><div class="w-full max-w-6xl space-y-4"><div data-slot="table-container" class="relative w-full overflow-x-auto"><table data-slot="table" class="w-full caption-bottom text-sm"><thead data-slot="table-header" class="[&amp;_tr]:border-b"><tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">ID</th><th data-sl
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
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

## Buttons

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
  background: #00a544;
  color: #000000;
  border-radius: 15.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 66

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-middle` `.font-medium` `.h-12` `.px-3` `.text-foreground`

**HTML structure:**

```html
<th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">ID</th>
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Translate X Px

**Instances found:** 49

**CSS classes:** `.-translate-x-px` `.[&>span:last-child]:truncate` `.[&>svg]:shrink-0` `.[&>svg]:size-4` `.[&>svg]:text-sidebar-accent-foreground` `.active:bg-sidebar-accent`

**HTML structure:**

```html
<a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&amp;&gt;span:last-child]:truncate [&am
```

**Base styles (from design tokens):**

```css
.-translate-x-px {
  background: #fef2f2;
  padding: 4px;
}```

### Overflow X Auto

**Instances found:** 13

**CSS classes:** `.overflow-x-auto` `.relative` `.w-full`

**HTML structure:**

```html
<div data-slot="table-container" class="relative w-full overflow-x-auto"><table data-slot="table" class="w-full caption-bottom text-sm"><thead data-slot="table-header" class="[&amp;_tr]:border-b"><tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">ID</th><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foregro
```

**Base styles (from design tokens):**

```css
.overflow-x-auto {
  background: #fef2f2;
  padding: 4px;
}```

### Caption Bottom

**Instances found:** 13

**CSS classes:** `.caption-bottom` `.text-sm` `.w-full`

**HTML structure:**

```html
<table data-slot="table" class="w-full caption-bottom text-sm"><thead data-slot="table-header" class="[&amp;_tr]:border-b"><tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">ID</th><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">Customer</th><th data-slot="table-
```

**Base styles (from design tokens):**

```css
.caption-bottom {
  background: #fef2f2;
  padding: 4px;
}```

### [& Tr]:Border B

**Instances found:** 13

**CSS classes:** `.[&_tr]:border-b`

**HTML structure:**

```html
<thead data-slot="table-header" class="[&amp;_tr]:border-b"><tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">ID</th><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">Customer</th><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium white
```

**Base styles (from design tokens):**

```css
.[&_tr]:border-b {
  background: #fef2f2;
  padding: 4px;
}```

### [& Tr:Last Child]:Border 0

**Instances found:** 13

**CSS classes:** `.[&_tr:last-child]:border-0`

**HTML structure:**

```html
<tbody data-slot="table-body" class="[&amp;_tr:last-child]:border-0"><tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><td data-slot="table-cell" class="p-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 font-mono text-sm">PAY-001</td><td data-slot="table-cell" class="p-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0"><div class="flex items-center gap-2"><span data-slot="avatar" data-size="default" class="group/avatar relative flex size-8 shrink-0 rounded-full select-n
```

**Base styles (from design tokens):**

```css
.[&_tr:last-child]:border-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Group Hover:Opacity 100

**Instances found:** 12

**CSS classes:** `.group-hover:opacity-100` `.opacity-0` `.transition-opacity`

**HTML structure:**

```html
<div class="opacity-0 transition-opacity group-hover:opacity-100"><div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="icon" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/2
```

**Base styles (from design tokens):**

```css
.group-hover:opacity-100 {
  background: #fef2f2;
  padding: 4px;
}```

### Border B

**Instances found:** 7

**CSS classes:** `.border-b` `.data-[state=selected]:bg-muted` `.transition-colors`

**HTML structure:**

```html
<tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">ID</th><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">Customer</th><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr
```

**Base styles (from design tokens):**

```css
.border-b {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.min-w-0` `.p-2` `.px-4` `.relative`

**HTML structure:**

```html
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2 px-4 lg:px-0"><div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-xl px-3 font-medium ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0 text-foreground text-sm">Base</div><div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm">
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
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-xl px-3 font-medium ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0 text-foreground text-sm">Base</div>
```

**Base styles (from design tokens):**

```css
.[&>svg]:shrink-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Text Sm

**Instances found:** 5

**CSS classes:** `.text-sm` `.w-full`

**HTML structure:**

```html
<div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm"><ul data-slot="sidebar-menu-sub" data-sidebar="menu-sub" class="mx-3.5 flex min-w-0 translate-x-px flex-col border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden ms-0 gap-0 border-l-0 ps-0"><li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg
```

**Base styles (from design tokens):**

```css
.text-sm {
  background: #fef2f2;
  padding: 4px;
}```

### Border L 0

**Instances found:** 5

**CSS classes:** `.border-l-0` `.border-sidebar-border` `.flex` `.flex-col` `.gap-0` `.group-data-[collapsible=icon]:hidden`

**HTML structure:**

```html
<ul data-slot="sidebar-menu-sub" data-sidebar="menu-sub" class="mx-3.5 flex min-w-0 translate-x-px flex-col border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden ms-0 gap-0 border-l-0 ps-0"><li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar
```

**Base styles (from design tokens):**

```css
.border-l-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Max W 6xl

**Instances found:** 3

**CSS classes:** `.max-w-6xl` `.space-y-4` `.w-full`

**HTML structure:**

```html
<div class="w-full max-w-6xl space-y-4"><div data-slot="table-container" class="relative w-full overflow-x-auto"><table data-slot="table" class="w-full caption-bottom text-sm"><thead data-slot="table-header" class="[&amp;_tr]:border-b"><tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0">ID</th><th data-slot="table-head" class="h-12 px-3 text-left align-middle fo
```

**Base styles (from design tokens):**

```css
.max-w-6xl {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#00a544` for all interactive/active states

