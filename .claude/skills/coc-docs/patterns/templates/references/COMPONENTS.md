# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Border** | unknown | 12× | `.border`, `.p-1`, `.rounded-xl` |
| **Aspect Video** | unknown | 12× | `.aspect-video`, `.object-cover`, `.object-top` |
| **Text Muted Foreground** | unknown | 6× | `.text-muted-foreground` |
| **Text Muted Foreground** | unknown | 6× | `.text-muted-foreground` |
| **Col Span 3** | unknown | 6× | `.col-span-3`, `.relative` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 4× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Gap 8** | card | 3× | `.gap-8`, `.grid`, `.items-center` |
| **Col Span 2** | unknown | 3× | `.col-span-2`, `.space-y-3` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.text-xl` |
| **Flex** | unknown | 3× | `.flex`, `.gap-3` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 3× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Gap 4** | unknown | 3× | `.gap-4`, `.grid` |
| **Absolute** | unknown | 3× | `.absolute`, `.inset-0`, `.z-10` |
| **Cursor Not Allowed** | card | 3× | `.cursor-not-allowed`, `.gap-8`, `.grid` |
| **Col Span 2** | unknown | 3× | `.col-span-2`, `.space-y-3` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.text-xl` |
| **Flex** | unknown | 3× | `.flex`, `.gap-3` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 3× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |

## Cards

### Gap 8

**Instances found:** 3

**CSS classes:** `.gap-8` `.grid` `.items-center` `.p-4` `.relative`

**HTML structure:**

```html
<div class="relative grid items-center gap-8 p-4 lg:grid-cols-5 lg:ps-8!"><div class="col-span-2 space-y-3"><h2 class="text-xl lg:text-2xl font-heading font-semibold"><a href="/template/neofolio-portfolio-template">Neofolio<!-- --> -<!-- --> <span class="text-muted-foreground">Next.js Portfolio Template</span></a></h2><p class="text-muted-foreground">A dashboard style portfolio website temp…</p><div class="flex gap-3"><a data-slot="button" data-variant="default" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-cli
```

**Base styles (from design tokens):**

```css
.gap-8 {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Cursor Not Allowed

**Instances found:** 3

**CSS classes:** `.cursor-not-allowed` `.gap-8` `.grid` `.items-center` `.p-4` `.relative`

**HTML structure:**

```html
<div aria-disabled="true" class="relative grid cursor-not-allowed items-center gap-8 p-4 select-none lg:grid-cols-5 lg:ps-8!"><div class="col-span-2 space-y-3"><span data-slot="badge" data-variant="secondary" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-inv
```

**Base styles (from design tokens):**

```css
.cursor-not-allowed {
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

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 3

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-invalid:border-destructive` `.aria-invalid:ring-3`

**HTML structure:**

```html
<button data-slot="button" data-variant="default" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [
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

## Other Components

### Border

**Instances found:** 12

**CSS classes:** `.border` `.p-1` `.rounded-xl`

**HTML structure:**

```html
<figure class="rounded-xl border p-1"><img alt="light mode" loading="lazy" width="800" height="450" decoding="async" data-nimg="1" class="aspect-video w-full rounded-lg object-cover object-top" style="color:transparent" sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 100vw" srcset="/_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=256&amp;q=75 256w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=384&amp;q=75 384w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.
```

**Base styles (from design tokens):**

```css
.border {
  background: #18181b;
  padding: 4px;
}```

### Aspect Video

**Instances found:** 12

**CSS classes:** `.aspect-video` `.object-cover` `.object-top` `.rounded-lg` `.w-full`

**HTML structure:**

```html
<img alt="light mode" loading="lazy" width="800" height="450" decoding="async" data-nimg="1" class="aspect-video w-full rounded-lg object-cover object-top" style="color:transparent" sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 100vw" srcset="/_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=256&amp;q=75 256w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=384&amp;q=75 384w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=750&amp;q=75 750w, /_next/im
```

**Base styles (from design tokens):**

```css
.aspect-video {
  background: #18181b;
  padding: 4px;
}```

### Text Muted Foreground

**Instances found:** 6

**CSS classes:** `.text-muted-foreground`

**HTML structure:**

```html
<span class="text-muted-foreground">Next.js Portfolio Template</span>
```

**Base styles (from design tokens):**

```css
.text-muted-foreground {
  background: #18181b;
  padding: 4px;
}```

### Text Muted Foreground

**Instances found:** 6

**CSS classes:** `.text-muted-foreground`

**HTML structure:**

```html
<p class="text-muted-foreground">A dashboard style portfolio website template.</p>
```

**Base styles (from design tokens):**

```css
.text-muted-foreground {
  background: #18181b;
  padding: 4px;
}```

### Col Span 3

**Instances found:** 6

**CSS classes:** `.col-span-3` `.relative`

**HTML structure:**

```html
<div class="relative col-span-3"><div class="grid gap-4 md:grid-cols-2"><a class="absolute inset-0 z-10 lg:left-8" aria-label="Neofolio template details" href="/template/neofolio-portfolio-template"></a><figure class="rounded-xl border p-1"><img alt="light mode" loading="lazy" width="800" height="450" decoding="async" data-nimg="1" class="aspect-video w-full rounded-lg object-cover object-top" style="color:transparent" sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 100vw" srcset="/_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=256&amp;q=75 256w, /_next/image?url=%2F
```

**Base styles (from design tokens):**

```css
.col-span-3 {
  background: #18181b;
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 4

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<a data-slot="button" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-event
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #18181b;
  padding: 4px;
}```

### Col Span 2

**Instances found:** 3

**CSS classes:** `.col-span-2` `.space-y-3`

**HTML structure:**

```html
<div class="col-span-2 space-y-3"><h2 class="text-xl lg:text-2xl font-heading font-semibold"><a href="/template/neofolio-portfolio-template">Neofolio<!-- --> -<!-- --> <span class="text-muted-foreground">Next.js Portfolio Template</span></a></h2><p class="text-muted-foreground">A dashboard style portfolio website temp…</p><div class="flex gap-3"><a data-slot="button" data-variant="default" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-non
```

**Base styles (from design tokens):**

```css
.col-span-2 {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 3

**CSS classes:** `.font-heading` `.font-semibold` `.text-xl`

**HTML structure:**

```html
<h2 class="text-xl lg:text-2xl font-heading font-semibold"><a href="/template/neofolio-portfolio-template">Neofolio<!-- --> -<!-- --> <span class="text-muted-foreground">Next.js Portfolio Template</span></a></h2>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.gap-3`

**HTML structure:**

```html
<div class="flex gap-3"><a data-slot="button" data-variant="default" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ri
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 3

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-invalid:border-destructive` `.aria-invalid:ring-3`

**HTML structure:**

```html
<a data-slot="button" data-variant="default" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #18181b;
  padding: 4px;
}```

### Gap 4

**Instances found:** 3

**CSS classes:** `.gap-4` `.grid`

**HTML structure:**

```html
<div class="grid gap-4 md:grid-cols-2"><a class="absolute inset-0 z-10 lg:left-8" aria-label="Neofolio template details" href="/template/neofolio-portfolio-template"></a><figure class="rounded-xl border p-1"><img alt="light mode" loading="lazy" width="800" height="450" decoding="async" data-nimg="1" class="aspect-video w-full rounded-lg object-cover object-top" style="color:transparent" sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 100vw" srcset="/_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=256&amp;q=75 256w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F0
```

**Base styles (from design tokens):**

```css
.gap-4 {
  background: #18181b;
  padding: 4px;
}```

### Absolute

**Instances found:** 3

**CSS classes:** `.absolute` `.inset-0` `.z-10`

**HTML structure:**

```html
<a class="absolute inset-0 z-10 lg:left-8" aria-label="Neofolio template details" href="/template/neofolio-portfolio-template"></a>
```

**Base styles (from design tokens):**

```css
.absolute {
  background: #18181b;
  padding: 4px;
}```

### Col Span 2

**Instances found:** 3

**CSS classes:** `.col-span-2` `.space-y-3`

**HTML structure:**

```html
<div class="col-span-2 space-y-3"><span data-slot="badge" data-variant="secondary" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! bg-se
```

**Base styles (from design tokens):**

```css
.col-span-2 {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 3

**CSS classes:** `.font-heading` `.font-semibold` `.text-xl`

**HTML structure:**

```html
<h2 class="font-heading text-xl font-semibold lg:text-2xl">Cnstore<!-- --> -<!-- --> <span class="text-muted-foreground">E-commerce Template</span></h2>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.gap-3`

**HTML structure:**

```html
<div class="flex gap-3"><button data-slot="button" data-variant="default" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-inval
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

