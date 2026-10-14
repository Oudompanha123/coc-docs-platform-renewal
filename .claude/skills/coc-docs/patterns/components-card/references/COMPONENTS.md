# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Group/Menu Sub Item** | card | 49× | `.group/menu-sub-item`, `.relative` |
| **Translate X Px** | unknown | 49× | `.-translate-x-px`, `.[&>span:last-child]:truncate`, `.[&>svg]:shrink-0` |
| **Flex** | card | 9× | `.flex`, `.flex-col`, `.group` |
| **Absolute** | card | 9× | `.absolute`, `.flex`, `.inset-x-0` |
| **Group Hover:Opacity 100** | unknown | 9× | `.group-hover:opacity-100`, `.opacity-0`, `.transition-opacity` |
| **Flex** | card | 9× | `.flex`, `.gap-2`, `.items-center` |
| **Flex** | card | 9× | `.flex`, `.items-center`, `.justify-center` |
| **Text Muted Foreground** | unknown | 7× | `.text-muted-foreground`, `.text-sm` |
| **@Container/Card Header** | card | 6× | `.@container/card-header`, `.[.border-b]:pb-(--card-spacing)`, `.auto-rows-min` |
| **Font Heading** | unknown | 6× | `.font-heading`, `.font-medium`, `.text-base` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 6× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Text Sm** | unknown | 5× | `.text-sm`, `.w-full` |
| **Border L 0** | unknown | 5× | `.border-l-0`, `.border-sidebar-border`, `.flex` |
| ***:[Img:First Child]:Rounded T 4xl** | card | 5× | `.*:[img:first-child]:rounded-t-4xl`, `.*:[img:last-child]:rounded-b-4xl`, `.[--card-spacing:--spacing(6)]` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Aria Invalid:Border Destructive** | form-field | 3× | `.aria-invalid:border-destructive`, `.aria-invalid:ring-3`, `.aria-invalid:ring-destructive/20` |
| ***:[Img:First Child]:Rounded T 4xl** | card | 3× | `.*:[img:first-child]:rounded-t-4xl`, `.*:[img:last-child]:rounded-b-4xl`, `.[--card-spacing:--spacing(6)]` |

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
  border-radius: 12px;
  padding: 8px;
}```

### Flex

**Instances found:** 9

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
  border-radius: 12px;
  padding: 8px;
}```

### Absolute

**Instances found:** 9

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
  border-radius: 12px;
  padding: 8px;
}```

### Flex

**Instances found:** 9

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
  border-radius: 12px;
  padding: 8px;
}```

### Flex

**Instances found:** 9

**CSS classes:** `.flex` `.items-center` `.justify-center` `.py-8` `.w-full`

**HTML structure:**

```html
<div class="flex w-full items-center justify-center py-8"><div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl w-full max-w-xs shadow-none"><div data-slot="card-header" class="group/card-header @container/card-header grid auto-rows-min items-start gap
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### @Container/Card Header

**Instances found:** 6

**CSS classes:** `.@container/card-header` `.[.border-b]:pb-(--card-spacing)` `.auto-rows-min` `.gap-1.5` `.grid` `.group/card-header`

**HTML structure:**

```html
<div data-slot="card-header" class="group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-4xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)"><div data-slot="card-title" class="font-heading text-base font-medium">Upgrade to Pro</div><div data-slot="card-description" class="text-sm text-muted-foreground">Unlock advanced automation, analytics, a…</div></div>
```

**Base styles (from design tokens):**

```css
.@container/card-header {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### *:[Img:First Child]:Rounded T 4xl

**Instances found:** 5

**CSS classes:** `.*:[img:first-child]:rounded-t-4xl` `.*:[img:last-child]:rounded-b-4xl` `.[--card-spacing:--spacing(6)]` `.bg-card` `.dark:ring-foreground/10` `.data-[size=sm]:[--card-spacing:--spacing(4)]`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl w-full max-w-xs shadow-none"><div data-slot="card-header" class="group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-4xl px-(--card-spacing) has-data-[slot=card
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-4xl {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### *:[Img:First Child]:Rounded T 4xl

**Instances found:** 3

**CSS classes:** `.*:[img:first-child]:rounded-t-4xl` `.*:[img:last-child]:rounded-b-4xl` `.[--card-spacing:--spacing(6)]` `.bg-card` `.dark:ring-foreground/10` `.data-[size=sm]:[--card-spacing:--spacing(4)]`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl w-full max-w-sm shadow-none"><div data-slot="card-header" class="group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-4xl px-(--card-spacing) has-data-[slot=card
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-4xl {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
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

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 6

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-invalid:border-destructive` `.aria-invalid:ring-3`

**HTML structure:**

```html
<button data-slot="button" data-variant="default" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #00a544;
  color: #000000;
  border-radius: 12px;
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
  background: #00a544;
  color: #000000;
  border-radius: 12px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Form Fields

### Aria Invalid:Border Destructive

**Instances found:** 3

**CSS classes:** `.aria-invalid:border-destructive` `.aria-invalid:ring-3` `.aria-invalid:ring-destructive/20` `.bg-input/50` `.border` `.border-transparent`

**HTML structure:**

```html
<input data-slot="sidebar-input" class="min-w-0 rounded-3xl border border-transparent px-3 py-1 text-base transition-[color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 da
```

**Base styles (from design tokens):**

```css
.aria-invalid:border-destructive {
  background: #fef2f2;
  padding: 4px;
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

### Group Hover:Opacity 100

**Instances found:** 9

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

### Text Muted Foreground

**Instances found:** 7

**CSS classes:** `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<div data-slot="card-description" class="text-sm text-muted-foreground">Unlock advanced automation, analytics, and priority support designed for SaaS teams to scale faster, optimize operations, and deliver a world-class experience to your users.</div>
```

**Base styles (from design tokens):**

```css
.text-muted-foreground {
  background: #fef2f2;
  padding: 4px;
}```

### Font Heading

**Instances found:** 6

**CSS classes:** `.font-heading` `.font-medium` `.text-base`

**HTML structure:**

```html
<div data-slot="card-title" class="font-heading text-base font-medium">Upgrade to Pro</div>
```

**Base styles (from design tokens):**

```css
.font-heading {
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

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#00a544` for all interactive/active states

