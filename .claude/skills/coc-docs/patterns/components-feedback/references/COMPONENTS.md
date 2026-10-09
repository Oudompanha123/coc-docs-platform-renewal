# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Font Medium** | unknown | 16× | `.font-medium`, `.text-foreground`, `.underline-offset-4` |
| **Font Bold** | unknown | 9× | `.font-bold`, `.font-sans`, `.mb-4` |
| **[& A]:Block** | unknown | 9× | `.[&_a]:block`, `.[&_a]:hover:text-foreground`, `.[&_a]:hover:underline` |
| **Space Y 2** | unknown | 7× | `.space-y-2` |
| ***:[Img:First Child]:Rounded T 4xl** | card | 7× | `.*:[img:first-child]:rounded-t-4xl`, `.*:[img:last-child]:rounded-b-4xl`, `.[--card-spacing:--spacing(6)]` |
| **Space Y 1** | unknown | 7× | `.space-y-1` |
| **Flex** | card | 7× | `.flex`, `.gap-2`, `.items-center` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 6× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Aspect Video** | card | 6× | `.aspect-video`, `.flex`, `.items-center` |
| **Font Medium** | unknown | 6× | `.font-medium`, `.font-sans` |
| **Flex** | card | 6× | `.flex`, `.gap-2.5`, `.items-start` |
| **[&>Svg]:Pointer Events None** | unknown | 6× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Font Semibold** | unknown | 5× | `.font-semibold`, `.text-foreground` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.text-xl` |
| **Leading Relaxed** | list-item | 3× | `.leading-relaxed` |
| **Data Open:Bg Muted/50** | unknown | 3× | `.data-open:bg-muted/50`, `.not-last:border-b` |
| **Flex** | unknown | 3× | `.flex` |
| ****:Data [Slot=Accordion Trigger Icon]:Ml Auto** | button | 3× | `.**:data-[slot=accordion-trigger-icon]:ml-auto`, `.**:data-[slot=accordion-trigger-icon]:size-4`, `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` |

## Cards

### *:[Img:First Child]:Rounded T 4xl

**Instances found:** 7

**CSS classes:** `.*:[img:first-child]:rounded-t-4xl` `.*:[img:last-child]:rounded-b-4xl` `.[--card-spacing:--spacing(6)]` `.bg-muted` `.dark:ring-foreground/10` `.data-[size=sm]:[--card-spacing:--spacing(4)]`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl bg-muted shadow-none"><div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div class="w-40 space-y-4"><div class="flex flex-col items-center just
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-4xl {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### Flex

**Instances found:** 7

**CSS classes:** `.flex` `.gap-2` `.items-center` `.justify-between`

**HTML structure:**

```html
<div class="flex items-center justify-between gap-2"><h4 class="font-sans font-medium">Empty State</h4></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### Aspect Video

**Instances found:** 6

**CSS classes:** `.aspect-video` `.flex` `.items-center` `.justify-center` `.px-(--card-spacing)` `.relative`

**HTML structure:**

```html
<div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div class="w-40 space-y-4"><div class="flex flex-col items-center justify-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search text-muted-foreground size-4" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg><div class="block h-2 w-8/12 rounded-full bg-black/10 dark:bg
```

**Base styles (from design tokens):**

```css
.aspect-video {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### Flex

**Instances found:** 6

**CSS classes:** `.flex` `.gap-2.5` `.items-start`

**HTML structure:**

```html
<li class="flex items-start gap-2.5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check text-background fill-foreground mt-0.5 size-4.5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg><span>Toasts with Sonner</span></li>
```

**Base styles (from design tokens):**

```css
.flex {
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

### Leading Relaxed

**Instances found:** 3

**CSS classes:** `.leading-relaxed`

**HTML structure:**

```html
<li class="leading-relaxed"><span class="text-foreground font-semibold">Notifications:</span> <a class="text-foreground font-medium hover:underline underline-offset-4" href="/components/sonner-toast">Sonner toasts</a> <!-- -->with success, error, loading and action variants.</li>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
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
  border-radius: 12px;
  padding: 4px 8px;
  cursor: pointer;
}```

### **:Data [Slot=Accordion Trigger Icon]:Ml Auto

**Instances found:** 3

**CSS classes:** `.**:data-[slot=accordion-trigger-icon]:ml-auto` `.**:data-[slot=accordion-trigger-icon]:size-4` `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` `.border` `.border-transparent` `.disabled:opacity-50`

**HTML structure:**

```html
<button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_db5fiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground text-base" data-radix-collection-item="">Which toast library is use
```

**Base styles (from design tokens):**

```css
.**:data-[slot=accordion-trigger-icon]:ml-auto {
  background: #00a544;
  color: #000000;
  border-radius: 12px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Font Medium

**Instances found:** 16

**CSS classes:** `.font-medium` `.text-foreground` `.underline-offset-4`

**HTML structure:**

```html
<a class="text-foreground font-medium hover:underline underline-offset-4" href="/components/sonner-toast">toasts</a>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #fef2f2;
  padding: 4px;
}```

### Font Bold

**Instances found:** 9

**CSS classes:** `.font-bold` `.font-sans` `.mb-4`

**HTML structure:**

```html
<div class="mb-4 font-sans font-bold">Products</div>
```

**Base styles (from design tokens):**

```css
.font-bold {
  background: #fef2f2;
  padding: 4px;
}```

### [& A]:Block

**Instances found:** 9

**CSS classes:** `.[&_a]:block` `.[&_a]:hover:text-foreground` `.[&_a]:hover:underline` `.[&_a]:text-muted-foreground` `.[&_a]:text-sm` `.flex`

**HTML structure:**

```html
<ul class="[&amp;_a]:text-muted-foreground [&amp;_a]:hover:text-foreground flex flex-col gap-4 [&amp;_a]:block [&amp;_a]:text-sm [&amp;_a]:hover:underline"><li><a href="/admin-dashboard">Admin Dashboards</a></li><li><a href="/components">Components</a></li><li><a href="/blocks">Blocks</a></li><li><a href="/examples">Examples</a></li><li><a href="/illustrations">Illustrations</a></li><li><a href="/templates">Templates</a></li></ul>
```

**Base styles (from design tokens):**

```css
.[&_a]:block {
  background: #fef2f2;
  padding: 4px;
}```

### Space Y 2

**Instances found:** 7

**CSS classes:** `.space-y-2`

**HTML structure:**

```html
<a class="space-y-2 hover:opacity-70" href="/components/empty"><div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl bg-muted shadow-none"><div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div cla
```

**Base styles (from design tokens):**

```css
.space-y-2 {
  background: #fef2f2;
  padding: 4px;
}```

### Space Y 1

**Instances found:** 7

**CSS classes:** `.space-y-1`

**HTML structure:**

```html
<div class="space-y-1"><div class="flex items-center justify-between gap-2"><h4 class="font-sans font-medium">Empty State</h4></div><p class="text-muted-foreground text-xs">8<!-- --> variants</p></div>
```

**Base styles (from design tokens):**

```css
.space-y-1 {
  background: #fef2f2;
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 6

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<a type="button" role="tab" aria-selected="false" aria-controls="radix-_R_4lfiv5tiiv5b_-content-all" data-state="inactive" id="radix-_R_4lfiv5tiiv5b_-trigger-all" data-slot="tabs-trigger" class="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full border border-transparent! text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 hover:text-foreground focus-visible:border
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #fef2f2;
  padding: 4px;
}```

### Font Medium

**Instances found:** 6

**CSS classes:** `.font-medium` `.font-sans`

**HTML structure:**

```html
<h4 class="font-sans font-medium">Empty State</h4>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #fef2f2;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 6

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-muted` `.[a]:hover:text-muted-foreground` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20`

**HTML structure:**

```html
<span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! border-border text-foreground [a]:hover:bg-muted [a]:hover:t
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
  background: #fef2f2;
  padding: 4px;
}```

### Font Semibold

**Instances found:** 5

**CSS classes:** `.font-semibold` `.text-foreground`

**HTML structure:**

```html
<span class="text-foreground font-semibold">Notifications:</span>
```

**Base styles (from design tokens):**

```css
.font-semibold {
  background: #fef2f2;
  padding: 4px;
}```

### Font Heading

**Instances found:** 3

**CSS classes:** `.font-heading` `.font-semibold` `.text-xl`

**HTML structure:**

```html
<h3 class="font-heading text-xl font-semibold">What You Get With Feedback Components</h3>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #fef2f2;
  padding: 4px;
}```

### Data Open:Bg Muted/50

**Instances found:** 3

**CSS classes:** `.data-open:bg-muted/50` `.not-last:border-b`

**HTML structure:**

```html
<div data-state="closed" data-orientation="vertical" data-slot="accordion-item" class="not-last:border-b data-open:bg-muted/50"><h3 data-orientation="vertical" data-state="closed" class="flex"><button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_db5fiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-t
```

**Base styles (from design tokens):**

```css
.data-open:bg-muted/50 {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex`

**HTML structure:**

```html
<h3 data-orientation="vertical" data-state="closed" class="flex"><button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_db5fiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground te
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
- Use `#27272a` for all dividers within components
- Use `#00a544` for all interactive/active states

