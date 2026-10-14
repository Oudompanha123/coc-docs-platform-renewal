# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Group/Menu Sub Item** | card | 49× | `.group/menu-sub-item`, `.relative` |
| **Translate X Px** | unknown | 49× | `.-translate-x-px`, `.[&>span:last-child]:truncate`, `.[&>svg]:shrink-0` |
| **Flex 1** | unknown | 17× | `.flex-1`, `.group-data-[orientation=vertical]/attachment:px-1`, `.leading-tight` |
| **Bg Card** | card | 12× | `.bg-card`, `.border`, `.data-[state=error]:border-destructive/30` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 12× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.aspect-square` |
| **Group** | unknown | 8× | `.group` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Text Sm** | unknown | 5× | `.text-sm`, `.w-full` |
| **Border L 0** | unknown | 5× | `.border-l-0`, `.border-sidebar-border`, `.flex` |
| **Flex** | card | 5× | `.flex`, `.flex-col`, `.group` |
| **Absolute** | card | 5× | `.absolute`, `.flex`, `.inset-x-0` |
| **Group Hover:Opacity 100** | unknown | 5× | `.group-hover:opacity-100`, `.opacity-0`, `.transition-opacity` |
| **Flex** | card | 5× | `.flex`, `.gap-2`, `.items-center` |
| **Flex** | card | 5× | `.flex`, `.items-center`, `.justify-center` |
| ***:[Img]:Aspect Square** | unknown | 4× | `.*:[img]:aspect-square`, `.*:[img]:object-cover`, `.*:[img]:w-full` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Bg Card** | card | 3× | `.bg-card`, `.border`, `.data-[state=error]:border-destructive/30` |
| **Bg Card** | card | 3× | `.bg-card`, `.border`, `.data-[state=error]:border-destructive/30` |

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

### Bg Card

**Instances found:** 12

**CSS classes:** `.bg-card` `.border` `.data-[state=error]:border-destructive/30` `.data-[state=idle]:border-dashed` `.flex` `.flex-wrap`

**HTML structure:**

```html
<div data-slot="attachment" data-state="uploading" data-size="default" data-orientation="horizontal" class="group/attachment relative flex max-w-full shrink-0 flex-wrap rounded-3xl border bg-card text-card-foreground transition-colors focus-within:ring-1 focus-within:ring-ring/30 has-[&gt;a,&gt;button]:hover:bg-muted/50 data-[state=error]:border-destructive/30 data-[state=idle]:border-dashed gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2 min-w-40 items-center w-full"><div data-slot="attachment-media" data-var
```

**Base styles (from design tokens):**

```css
.bg-card {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 5

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

**Instances found:** 5

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

**Instances found:** 5

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

**Instances found:** 5

**CSS classes:** `.flex` `.items-center` `.justify-center` `.py-8` `.w-full`

**HTML structure:**

```html
<div class="flex w-full items-center justify-center py-8"><div class="mx-auto flex w-full max-w-sm flex-col gap-3 py-12"><div data-slot="attachment-group" class="flex min-w-0 scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start"><div data-slot="attachment" data-state="done" data-size="default" data-orientation="vertical" class="group/attachment relative flex max-w-full min-w-0 shrink-0 flex-wrap rounded-3xl border bg-card text-card-foreground transition-colors focus-
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Bg Card

**Instances found:** 3

**CSS classes:** `.bg-card` `.border` `.data-[state=error]:border-destructive/30` `.data-[state=idle]:border-dashed` `.flex` `.flex-col`

**HTML structure:**

```html
<div data-slot="attachment" data-state="done" data-size="default" data-orientation="vertical" class="group/attachment relative flex max-w-full min-w-0 shrink-0 flex-wrap rounded-3xl border bg-card text-card-foreground transition-colors focus-within:ring-1 focus-within:ring-ring/30 has-[&gt;a,&gt;button]:hover:bg-muted/50 data-[state=error]:border-destructive/30 data-[state=idle]:border-dashed gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2 w-24 flex-col has-data-[slot=attachment-content]:w-30"><div data-slot="
```

**Base styles (from design tokens):**

```css
.bg-card {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Bg Card

**Instances found:** 3

**CSS classes:** `.bg-card` `.border` `.data-[state=error]:border-destructive/30` `.data-[state=idle]:border-dashed` `.flex` `.flex-wrap`

**HTML structure:**

```html
<div data-slot="attachment" data-state="done" data-size="default" data-orientation="horizontal" class="group/attachment relative flex max-w-full shrink-0 flex-wrap rounded-3xl border bg-card text-card-foreground transition-colors focus-within:ring-1 focus-within:ring-ring/30 has-[&gt;a,&gt;button]:hover:bg-muted/50 data-[state=error]:border-destructive/30 data-[state=idle]:border-dashed gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2 min-w-40 items-center w-full"><div data-slot="attachment-media" data-variant=
```

**Base styles (from design tokens):**

```css
.bg-card {
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

### Flex 1

**Instances found:** 17

**CSS classes:** `.flex-1` `.group-data-[orientation=vertical]/attachment:px-1` `.leading-tight` `.max-w-full` `.min-w-0`

**HTML structure:**

```html
<div data-slot="attachment-content" class="max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1"><span data-slot="attachment-title" class="block max-w-full min-w-0 truncate font-medium group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer">workspace.png</span><span data-slot="attachment-description" class="mt-0.5 block min-w-0 truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-destructive/80 max-w-full">PNG · 820 KB</span></div>
```

**Base styles (from design tokens):**

```css
.flex-1 {
  background: #fef2f2;
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 12

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.aspect-square` `.bg-muted` `.flex` `.group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6!`

**HTML structure:**

```html
<div data-slot="attachment-media" data-variant="icon" class="relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-xl group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:s
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #fef2f2;
  padding: 4px;
}```

### Group

**Instances found:** 8

**CSS classes:** `.group`

**HTML structure:**

```html
<a class="group" href="/blocks/marketing/testimonials"><div data-slot="card" data-size="default" class="group/card flex flex-col rounded-4xl bg-card text-sm text-card-foreground ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl gap-0 overflow-hidden py-0 border ring-0 shadow-none group-hover:border-primary/20 transition-colors"><figure class="bg-muted w-full rounded-2xl p-2.5"><img alt="Testimonials sections" loading="lazy" 
```

**Base styles (from design tokens):**

```css
.group {
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

### Group Hover:Opacity 100

**Instances found:** 5

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

### *:[Img]:Aspect Square

**Instances found:** 4

**CSS classes:** `.*:[img]:aspect-square` `.*:[img]:object-cover` `.*:[img]:w-full` `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.aspect-square`

**HTML structure:**

```html
<div data-slot="attachment-media" data-variant="image" class="relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-xl group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:
```

**Base styles (from design tokens):**

```css
.*:[img]:aspect-square {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#00a544` for all interactive/active states

