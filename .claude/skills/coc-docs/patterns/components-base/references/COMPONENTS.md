# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Font Medium** | unknown | 20× | `.font-medium`, `.text-foreground`, `.underline-offset-4` |
| **Space Y 2** | unknown | 11× | `.space-y-2` |
| ***:[Img:First Child]:Rounded T 4xl** | card | 11× | `.*:[img:first-child]:rounded-t-4xl`, `.*:[img:last-child]:rounded-b-4xl`, `.[--card-spacing:--spacing(6)]` |
| **Aspect Video** | card | 11× | `.aspect-video`, `.flex`, `.items-center` |
| **Space Y 1** | unknown | 11× | `.space-y-1` |
| **Flex** | card | 11× | `.flex`, `.gap-2`, `.items-center` |
| **Font Medium** | unknown | 9× | `.font-medium`, `.font-sans` |
| **Font Bold** | unknown | 9× | `.font-bold`, `.font-sans`, `.mb-4` |
| **[& A]:Block** | unknown | 9× | `.[&_a]:block`, `.[&_a]:hover:text-foreground`, `.[&_a]:hover:underline` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 6× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Flex** | card | 6× | `.flex`, `.gap-2.5`, `.items-start` |
| **Font Semibold** | unknown | 5× | `.font-semibold`, `.text-foreground` |
| **Leading Relaxed** | list-item | 4× | `.leading-relaxed` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Flex** | card | 3× | `.flex`, `.gap-2`, `.items-center` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.text-xl` |
| **Data Open:Bg Muted/50** | unknown | 3× | `.data-open:bg-muted/50`, `.not-last:border-b` |
| **Flex** | unknown | 3× | `.flex` |
| ****:Data [Slot=Accordion Trigger Icon]:Ml Auto** | button | 3× | `.**:data-[slot=accordion-trigger-icon]:ml-auto`, `.**:data-[slot=accordion-trigger-icon]:size-4`, `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` |

## Cards

### *:[Img:First Child]:Rounded T 4xl

**Instances found:** 11

**CSS classes:** `.*:[img:first-child]:rounded-t-4xl` `.*:[img:last-child]:rounded-b-4xl` `.[--card-spacing:--spacing(6)]` `.bg-muted` `.dark:ring-foreground/10` `.data-[size=sm]:[--card-spacing:--spacing(4)]`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl bg-muted shadow-none"><div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div class="bg-background w-48 items-center rounded-md shadow/5"><div c
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-4xl {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### Aspect Video

**Instances found:** 11

**CSS classes:** `.aspect-video` `.flex` `.items-center` `.justify-center` `.px-(--card-spacing)` `.relative`

**HTML structure:**

```html
<div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div class="bg-background w-48 items-center rounded-md shadow/5"><div class="flex items-center gap-2 p-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down text-muted-foreground size-3" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg><div class="block h-2 w-7/12 rounded-full bg-black/10 dark:bg-white/10"></div></d
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

**Instances found:** 11

**CSS classes:** `.flex` `.gap-2` `.items-center` `.justify-between`

**HTML structure:**

```html
<div class="flex items-center justify-between gap-2"><h4 class="font-sans font-medium">Accordion</h4></div>
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

**Instances found:** 6

**CSS classes:** `.flex` `.gap-2.5` `.items-start`

**HTML structure:**

```html
<li class="flex items-start gap-2.5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check text-background fill-foreground mt-0.5 size-4.5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg><span>Buttons, badges and avatars</span></li>
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

**Instances found:** 3

**CSS classes:** `.flex` `.gap-2` `.items-center` `.p-3`

**HTML structure:**

```html
<div class="flex items-center gap-2 p-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down text-muted-foreground size-3" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg><div class="block h-2 w-7/12 rounded-full bg-black/10 dark:bg-white/10"></div></div>
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

### Leading Relaxed

**Instances found:** 4

**CSS classes:** `.leading-relaxed`

**HTML structure:**

```html
<li class="leading-relaxed"><span class="text-foreground font-semibold">Actions:</span> <a class="text-foreground font-medium hover:underline underline-offset-4" href="/components/button">Button</a> <!-- -->and<!-- --> <a class="text-foreground font-medium hover:underline underline-offset-4" href="/components/button-group">button group</a> <!-- -->variants with icons, loading states, sizes and split actions.</li>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
  padding: 4px 0;
  border-bottom: 1px solid #27272a;
}```

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
  border-radius: 12px;
  padding: 4px 8px;
  cursor: pointer;
}```

### **:Data [Slot=Accordion Trigger Icon]:Ml Auto

**Instances found:** 3

**CSS classes:** `.**:data-[slot=accordion-trigger-icon]:ml-auto` `.**:data-[slot=accordion-trigger-icon]:size-4` `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` `.border` `.border-transparent` `.disabled:opacity-50`

**HTML structure:**

```html
<button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_db5fiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground text-base" data-radix-collection-item="">Are the base components fr
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

**Instances found:** 20

**CSS classes:** `.font-medium` `.text-foreground` `.underline-offset-4`

**HTML structure:**

```html
<a class="text-foreground font-medium hover:underline underline-offset-4" href="/components/button">buttons</a>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #fef2f2;
  padding: 4px;
}```

### Space Y 2

**Instances found:** 11

**CSS classes:** `.space-y-2`

**HTML structure:**

```html
<a class="space-y-2 hover:opacity-70" href="/components/accordion"><div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl bg-muted shadow-none"><div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div
```

**Base styles (from design tokens):**

```css
.space-y-2 {
  background: #fef2f2;
  padding: 4px;
}```

### Space Y 1

**Instances found:** 11

**CSS classes:** `.space-y-1`

**HTML structure:**

```html
<div class="space-y-1"><div class="flex items-center justify-between gap-2"><h4 class="font-sans font-medium">Accordion</h4></div><p class="text-muted-foreground text-xs">12<!-- --> variants</p></div>
```

**Base styles (from design tokens):**

```css
.space-y-1 {
  background: #fef2f2;
  padding: 4px;
}```

### Font Medium

**Instances found:** 9

**CSS classes:** `.font-medium` `.font-sans`

**HTML structure:**

```html
<h4 class="font-sans font-medium">Accordion</h4>
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

### Font Semibold

**Instances found:** 5

**CSS classes:** `.font-semibold` `.text-foreground`

**HTML structure:**

```html
<span class="text-foreground font-semibold">Actions:</span>
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
<h3 class="font-heading text-xl font-semibold">What You Get With Base Components</h3>
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

