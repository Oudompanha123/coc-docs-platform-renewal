# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Group/Menu Sub Item** | card | 18× | `.group/menu-sub-item`, `.relative` |
| **Translate X Px** | unknown | 18× | `.-translate-x-px`, `.[&>span:last-child]:truncate`, `.[&>svg]:shrink-0` |
| **Flex** | unknown | 6× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 6× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Text Sm** | unknown | 6× | `.text-sm`, `.w-full` |
| **Flex** | unknown | 4× | `.flex`, `.flex-col`, `.gap-4` |
| **Flex** | card | 4× | `.flex`, `.font-heading`, `.font-semibold` |
| **Flex** | card | 4× | `.flex`, `.flex-wrap`, `.gap-2` |
| ***:Focus Visible:Relative** | unknown | 4× | `.*:focus-visible:relative`, `.*:focus-visible:z-10`, `.[&>*:not(:first-child)]:border-l-0` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 4× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Bg Muted/60** | unknown | 4× | `.bg-muted/60`, `.border`, `.overflow-hidden` |
| **Flex** | card | 4× | `.flex`, `.gap-1.5`, `.h-9` |
| **Mb Px** | unknown | 4× | `.-mb-px`, `.-mx-px`, `.border` |
| **Duration 200** | unknown | 4× | `.duration-200`, `.mx-auto`, `.transition-[max-width]` |
| **Data [Panel Group Direction=Vertical]:Flex Col** | unknown | 4× | `.data-[panel-group-direction=vertical]:flex-col`, `.flex`, `.h-full` |
| **Bg Background** | unknown | 4× | `.bg-background` |
| **Overflow Hidden** | unknown | 4× | `.overflow-hidden`, `.relative`, `.rounded-bl-lg` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Border L 0** | unknown | 3× | `.border-l-0`, `.border-sidebar-border`, `.flex` |

## Cards

### Group/Menu Sub Item

**Instances found:** 18

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
  border-radius: 11.2px 11.2px 0px 0px;
  padding: 8px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.font-heading` `.font-semibold` `.gap-3` `.items-center` `.text-xl`

**HTML structure:**

```html
<h2 class="font-heading flex items-center gap-3 text-xl font-semibold">Social Media Post 1<!-- --> <span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-even
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px 11.2px 0px 0px;
  padding: 8px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.flex-wrap` `.gap-2` `.items-center` `.shrink-0`

**HTML structure:**

```html
<div class="flex shrink-0 flex-wrap items-center gap-2"><div role="group" data-slot="button-group" class="group/button-group flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[&gt;[data-slot=button-group]]:gap-2 has-[&gt;[data-variant=outline]]:*:data-[slot=input-group]:border-border has-[&gt;[data-variant=outline]]:*:data-[slot=select-trigger]:border-border has-[&gt;[data-variant=outline]]:[&amp;&gt;[data-slot=input-group]:has(:focus-visible)]:border-ring has-[&gt;[data-variant=outline]]:[&amp;&gt;[data-slot=select-trigger]:focus-visible]:border-ring has-[select[aria-
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px 11.2px 0px 0px;
  padding: 8px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.gap-1.5` `.h-9` `.items-center` `.px-4`

**HTML structure:**

```html
<div class="flex h-9 items-center gap-1.5 px-4" aria-hidden="true"><span class="size-2.5 rounded-full bg-red-400"></span><span class="size-2.5 rounded-full bg-amber-400"></span><span class="size-2.5 rounded-full bg-green-500"></span></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px 11.2px 0px 0px;
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

**Instances found:** 4

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<button data-slot="dialog-trigger" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #ff667f;
  color: #ffffff;
  border-radius: 11.2px 11.2px 0px 0px;
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
  border-radius: 11.2px 11.2px 0px 0px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Translate X Px

**Instances found:** 18

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

### Flex

**Instances found:** 6

**CSS classes:** `.flex` `.flex-col` `.min-w-0` `.p-2` `.px-4` `.relative`

**HTML structure:**

```html
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2 px-4 lg:px-0"><div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-xl px-3 font-medium ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0 text-foreground text-sm">Cards</div><div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm"
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### [&>Svg]:Shrink 0

**Instances found:** 6

**CSS classes:** `.[&>svg]:shrink-0` `.[&>svg]:size-4` `.duration-200` `.ease-linear` `.flex` `.focus-visible:ring-2`

**HTML structure:**

```html
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-xl px-3 font-medium ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0 text-foreground text-sm">Cards</div>
```

**Base styles (from design tokens):**

```css
.[&>svg]:shrink-0 {
  background: #18181b;
  padding: 4px;
}```

### Text Sm

**Instances found:** 6

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

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.flex-col` `.gap-4` `.mb-4`

**HTML structure:**

```html
<div class="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><h2 class="font-heading flex items-center gap-3 text-xl font-semibold">Social Media Post 1<!-- --> <span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:rin
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### *:Focus Visible:Relative

**Instances found:** 4

**CSS classes:** `.*:focus-visible:relative` `.*:focus-visible:z-10` `.[&>*:not(:first-child)]:border-l-0` `.[&>*:not(:first-child)]:rounded-l-none` `.[&>*:not(:last-child)]:rounded-r-none` `.[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit`

**HTML structure:**

```html
<div role="group" data-slot="button-group" class="group/button-group flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[&gt;[data-slot=button-group]]:gap-2 has-[&gt;[data-variant=outline]]:*:data-[slot=input-group]:border-border has-[&gt;[data-variant=outline]]:*:data-[slot=select-trigger]:border-border has-[&gt;[data-variant=outline]]:[&amp;&gt;[data-slot=input-group]:has(:focus-visible)]:border-ring has-[&gt;[data-variant=outline]]:[&amp;&gt;[data-slot=select-trigger]:focus-visible]:border-ring has-[select[aria-hidden=true]:last-child]:[&amp;&gt;[data-slot=select-tri
```

**Base styles (from design tokens):**

```css
.*:focus-visible:relative {
  background: #18181b;
  padding: 4px;
}```

### Bg Muted/60

**Instances found:** 4

**CSS classes:** `.bg-muted/60` `.border` `.overflow-hidden` `.rounded-2xl`

**HTML structure:**

```html
<div class="bg-muted/60 overflow-hidden rounded-2xl border"><div class="flex h-9 items-center gap-1.5 px-4" aria-hidden="true"><span class="size-2.5 rounded-full bg-red-400"></span><span class="size-2.5 rounded-full bg-amber-400"></span><span class="size-2.5 rounded-full bg-green-500"></span></div><div class="-mx-px -mb-px overflow-hidden rounded-t-xl border"><div class="mx-auto w-full transition-[max-width] duration-200"><div data-slot="resizable-panel-group" class="flex h-full data-[panel-group-direction=vertical]:flex-col w-full overflow-visible!" style="display:flex;flex-direction:row;heig
```

**Base styles (from design tokens):**

```css
.bg-muted/60 {
  background: #18181b;
  padding: 4px;
}```

### Mb Px

**Instances found:** 4

**CSS classes:** `.-mb-px` `.-mx-px` `.border` `.overflow-hidden` `.rounded-t-xl`

**HTML structure:**

```html
<div class="-mx-px -mb-px overflow-hidden rounded-t-xl border"><div class="mx-auto w-full transition-[max-width] duration-200"><div data-slot="resizable-panel-group" class="flex h-full data-[panel-group-direction=vertical]:flex-col w-full overflow-visible!" style="display:flex;flex-direction:row;height:100%;overflow:hidden;width:100%" data-panel-group="" data-panel-group-direction="horizontal" data-panel-group-id="_R_52qnmiv5tiiv5b_"><div data-slot="resizable-panel" class="bg-background" id="_R_t2qnmiv5tiiv5b_" style="flex-basis:0;flex-grow:100;flex-shrink:1;overflow:hidden" data-panel-group-i
```

**Base styles (from design tokens):**

```css
.-mb-px {
  background: #18181b;
  padding: 4px;
}```

### Duration 200

**Instances found:** 4

**CSS classes:** `.duration-200` `.mx-auto` `.transition-[max-width]` `.w-full`

**HTML structure:**

```html
<div class="mx-auto w-full transition-[max-width] duration-200"><div data-slot="resizable-panel-group" class="flex h-full data-[panel-group-direction=vertical]:flex-col w-full overflow-visible!" style="display:flex;flex-direction:row;height:100%;overflow:hidden;width:100%" data-panel-group="" data-panel-group-direction="horizontal" data-panel-group-id="_R_52qnmiv5tiiv5b_"><div data-slot="resizable-panel" class="bg-background" id="_R_t2qnmiv5tiiv5b_" style="flex-basis:0;flex-grow:100;flex-shrink:1;overflow:hidden" data-panel-group-id="_R_52qnmiv5tiiv5b_" data-panel="" data-panel-id="_R_t2qnmiv5
```

**Base styles (from design tokens):**

```css
.duration-200 {
  background: #18181b;
  padding: 4px;
}```

### Data [Panel Group Direction=Vertical]:Flex Col

**Instances found:** 4

**CSS classes:** `.data-[panel-group-direction=vertical]:flex-col` `.flex` `.h-full` `.overflow-visible!` `.w-full`

**HTML structure:**

```html
<div data-slot="resizable-panel-group" class="flex h-full data-[panel-group-direction=vertical]:flex-col w-full overflow-visible!" style="display:flex;flex-direction:row;height:100%;overflow:hidden;width:100%" data-panel-group="" data-panel-group-direction="horizontal" data-panel-group-id="_R_52qnmiv5tiiv5b_"><div data-slot="resizable-panel" class="bg-background" id="_R_t2qnmiv5tiiv5b_" style="flex-basis:0;flex-grow:100;flex-shrink:1;overflow:hidden" data-panel-group-id="_R_52qnmiv5tiiv5b_" data-panel="" data-panel-id="_R_t2qnmiv5tiiv5b_" data-panel-size="100.0"><div class="relative w-full ove
```

**Base styles (from design tokens):**

```css
.data-[panel-group-direction=vertical]:flex-col {
  background: #18181b;
  padding: 4px;
}```

### Bg Background

**Instances found:** 4

**CSS classes:** `.bg-background`

**HTML structure:**

```html
<div data-slot="resizable-panel" class="bg-background" id="_R_t2qnmiv5tiiv5b_" style="flex-basis:0;flex-grow:100;flex-shrink:1;overflow:hidden" data-panel-group-id="_R_52qnmiv5tiiv5b_" data-panel="" data-panel-id="_R_t2qnmiv5tiiv5b_" data-panel-size="100.0"><div class="relative w-full overflow-hidden rounded-bl-lg rounded-br-lg" style="height: 526px;"><iframe src="/demo?path=%2Fexamples%2Fcards%2Fsocial-media-post%2F1" class="w-full" style="height: 526px;"></iframe></div></div>
```

**Base styles (from design tokens):**

```css
.bg-background {
  background: #18181b;
  padding: 4px;
}```

### Overflow Hidden

**Instances found:** 4

**CSS classes:** `.overflow-hidden` `.relative` `.rounded-bl-lg` `.rounded-br-lg` `.w-full`

**HTML structure:**

```html
<div class="relative w-full overflow-hidden rounded-bl-lg rounded-br-lg" style="height: 526px;"><iframe src="/demo?path=%2Fexamples%2Fcards%2Fsocial-media-post%2F1" class="w-full" style="height: 526px;"></iframe></div>
```

**Base styles (from design tokens):**

```css
.overflow-hidden {
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

