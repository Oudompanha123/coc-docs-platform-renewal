# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Font Bold** | unknown | 9× | `.font-bold`, `.font-sans`, `.mb-4` |
| **[& A]:Block** | unknown | 9× | `.[&_a]:block`, `.[&_a]:hover:text-foreground`, `.[&_a]:hover:underline` |
| **[&>Svg]:Pointer Events None** | unknown | 7× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Leading Relaxed** | unknown | 7× | `.leading-relaxed`, `.text-balance`, `.text-muted-foreground` |
| **Border X** | unknown | 6× | `.border-x`, `.container`, `.mx-auto` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-8` |
| **Flex 1** | unknown | 5× | `.flex-1`, `.space-y-4` |
| **[&>Svg]:Pointer Events None** | unknown | 5× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-secondary/80` |
| **Font Heading** | unknown | 5× | `.font-heading`, `.font-semibold`, `.text-2xl` |
| **Font Medium** | unknown | 5× | `.font-medium`, `.text-sm` |
| **Border** | unknown | 5× | `.border`, `.flex-1`, `.overflow-hidden` |
| **H Auto** | unknown | 5× | `.h-auto`, `.w-full` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Flex** | card | 3× | `.flex`, `.flex-col`, `.items-center` |
| **[& Svg]:Size 7** | unknown | 3× | `.[&_svg]:size-7`, `.[&_svg]:stroke-[1.5]`, `.border-2` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.mt-5` |
| **Leading Relaxed** | unknown | 3× | `.leading-relaxed`, `.max-w-64`, `.mt-3` |

## Cards

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.flex-col` `.items-center` `.px-4` `.text-center`

**HTML structure:**

```html
<li class="flex flex-col items-center px-4 text-center"><div class="relative flex w-full justify-center"><div class="text-foreground border-muted-foreground/60 flex size-20 items-center justify-center rounded-full border-2 border-dashed md:size-28 [&amp;_svg]:size-7 [&amp;_svg]:stroke-[1.5] md:[&amp;_svg]:size-9"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"></rec
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

## Buttons

### Bg Transparent

**Instances found:** 3

**CSS classes:** `.bg-transparent` `.data-[state=open]:bg-transparent` `.data-open:bg-muted/50` `.data-open:focus:bg-muted` `.data-open:hover:bg-muted` `.data-popup-open:bg-muted/50`

**HTML structure:**

```html
<button id="radix-_R_16aiv5b_-trigger-radix-_R_176aiv5b_" data-state="closed" aria-expanded="false" data-slot="navigation-menu-trigger" class="group/navigation-menu-trigger inline-flex w-max items-center justify-center rounded-3xl transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted group h-auto bg-transparent px-2.5 py-2 text-sm font-normal shadow-none hover:bg-transpar
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
  background: #18181b;
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
  background: #18181b;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 7

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-muted` `.[a]:hover:text-muted-foreground` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20`

**HTML structure:**

```html
<span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! border-border text-foreground [a]:hover:bg-muted [a]:hover:t
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
  background: #18181b;
  padding: 4px;
}```

### Leading Relaxed

**Instances found:** 7

**CSS classes:** `.leading-relaxed` `.text-balance` `.text-muted-foreground`

**HTML structure:**

```html
<p class="text-muted-foreground leading-relaxed text-balance md:text-xl">Combine ready-made blocks into multi-page sites, edit the content right on the canvas and preview every breakpoint. When it looks right, export clean Next.js code or add it to your project with the CLI.</p>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
  background: #18181b;
  padding: 4px;
}```

### Border X

**Instances found:** 6

**CSS classes:** `.border-x` `.container` `.mx-auto` `.px-0`

**HTML structure:**

```html
<div class="container mx-auto border-x px-0"><div class="flex flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-12 lg:py-20"><div class="flex-1 space-y-4"><span data-slot="badge" data-variant="secondary" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive
```

**Base styles (from design tokens):**

```css
.border-x {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.gap-8` `.px-6` `.py-12`

**HTML structure:**

```html
<div class="flex flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-12 lg:py-20"><div class="flex-1 space-y-4"><span data-slot="badge" data-variant="secondary" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-i
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### Flex 1

**Instances found:** 5

**CSS classes:** `.flex-1` `.space-y-4`

**HTML structure:**

```html
<div class="flex-1 space-y-4"><span data-slot="badge" data-variant="secondary" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! bg-secondary te
```

**Base styles (from design tokens):**

```css
.flex-1 {
  background: #18181b;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 5

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-secondary/80` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20` `.bg-secondary`

**HTML structure:**

```html
<span data-slot="badge" data-variant="secondary" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! bg-secondary text-secondary-foreground [a]:ho
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 5

**CSS classes:** `.font-heading` `.font-semibold` `.text-2xl` `.text-balance`

**HTML structure:**

```html
<h2 class="font-heading text-2xl font-semibold text-balance lg:text-4xl">432+ Blocks in One Library</h2>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

### Font Medium

**Instances found:** 5

**CSS classes:** `.font-medium` `.text-sm`

**HTML structure:**

```html
<p class="text-sm font-medium">Start from proven sections, not a blank page.</p>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #18181b;
  padding: 4px;
}```

### Border

**Instances found:** 5

**CSS classes:** `.border` `.flex-1` `.overflow-hidden` `.rounded-lg`

**HTML structure:**

```html
<div class="flex-1 overflow-hidden rounded-lg border"><video class="h-auto w-full" width="1772" height="1088" poster="/images/page-builder/builder1-poster.jpg" aria-label="432+ Blocks in One Library" muted="" loop="" playsinline="" preload="none" src="/images/page-builder/builder1.mp4"></video></div>
```

**Base styles (from design tokens):**

```css
.border {
  background: #18181b;
  padding: 4px;
}```

### H Auto

**Instances found:** 5

**CSS classes:** `.h-auto` `.w-full`

**HTML structure:**

```html
<video class="h-auto w-full" width="1772" height="1088" poster="/images/page-builder/builder1-poster.jpg" aria-label="432+ Blocks in One Library" muted="" loop="" playsinline="" preload="none" src="/images/page-builder/builder1.mp4"></video>
```

**Base styles (from design tokens):**

```css
.h-auto {
  background: #18181b;
  padding: 4px;
}```

### [& Svg]:Size 7

**Instances found:** 3

**CSS classes:** `.[&_svg]:size-7` `.[&_svg]:stroke-[1.5]` `.border-2` `.border-dashed` `.border-muted-foreground/60` `.flex`

**HTML structure:**

```html
<div class="text-foreground border-muted-foreground/60 flex size-20 items-center justify-center rounded-full border-2 border-dashed md:size-28 [&amp;_svg]:size-7 [&amp;_svg]:stroke-[1.5] md:[&amp;_svg]:size-9"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"><
```

**Base styles (from design tokens):**

```css
.[&_svg]:size-7 {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 3

**CSS classes:** `.font-heading` `.font-semibold` `.mt-5` `.text-lg`

**HTML structure:**

```html
<h3 class="font-heading mt-5 text-lg font-semibold md:mt-8 lg:text-2xl">Pick your blocks</h3>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

### Leading Relaxed

**Instances found:** 3

**CSS classes:** `.leading-relaxed` `.max-w-64` `.mt-3` `.text-balance` `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<p class="text-muted-foreground mt-3 max-w-64 text-sm leading-relaxed text-balance lg:text-base">Browse the library and add the sections you need to each page of your site.</p>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

