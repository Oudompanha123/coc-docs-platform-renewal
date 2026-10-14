# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Aspect Video** | unknown | 41× | `.aspect-video`, `.border`, `.dark:hidden` |
| **Shrink 0** | unknown | 40× | `.shrink-0` |
| **Basis 2/3** | unknown | 16× | `.basis-2/3`, `.grow-0`, `.min-w-0` |
| **Block** | unknown | 16× | `.block`, `.border`, `.group` |
| **Flex** | card | 16× | `.flex`, `.items-center`, `.justify-between` |
| **Text Sm** | unknown | 16× | `.text-sm` |
| **Group Hover:Opacity 100** | unknown | 16× | `.group-hover:opacity-100`, `.opacity-0`, `.text-sm` |
| **Border T** | unknown | 16× | `.border-t`, `.rounded-xl` |
| **Aspect 3/2** | unknown | 16× | `.aspect-3/2`, `.block`, `.dark:hidden` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 8× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Bg Background** | unknown | 6× | `.bg-background`, `.border`, `.dark:bg-transparent` |
| **Space Y 2** | unknown | 4× | `.space-y-2` |
| **Font Heading** | unknown | 4× | `.font-heading`, `.font-semibold`, `.text-xl` |
| **Leading Relaxed** | unknown | 4× | `.leading-relaxed`, `.text-balance`, `.text-muted-foreground` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 4× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 3× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Aspect 4/3** | form-field | 3× | `.aspect-4/3`, `.border`, `.object-cover` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 3× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |

## Cards

### Flex

**Instances found:** 16

**CSS classes:** `.flex` `.items-center` `.justify-between` `.px-3` `.py-2`

**HTML structure:**

```html
<div class="flex items-center justify-between px-3 py-2"><span class="text-sm">Classic Dashboard</span><span class="text-sm opacity-0 group-hover:opacity-100">View Demo</span></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 7.2px;
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
  border-bottom: 1px solid var(--border);
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
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 7.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 3

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<button type="button" role="tab" aria-selected="true" aria-controls="radix-_R_4eltiiv5b_-content-blocks" data-state="active" id="radix-_R_4eltiiv5b_-trigger-blocks" data-slot="tabs-trigger" class="relative h-[calc(100%-1px)] flex-1 items-center justify-center border-transparent! text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 7.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Form Fields

### Aspect 4/3

**Instances found:** 3

**CSS classes:** `.aspect-4/3` `.border` `.object-cover` `.rounded-md` `.transition-transform`

**HTML structure:**

```html
<img alt="Neofolio Template" loading="lazy" width="400" height="300" decoding="async" data-nimg="1" class="aspect-4/3 rounded-md border object-cover transition-transform hover:rotate-5" style="color:transparent;opacity:0;transform:translateY(16px)" sizes="(min-width: 768px) 220px, 30vw" srcset="/_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=256&amp;q=75 256w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=384&amp;q=75 384w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F01.png&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fimages%2Ftemplates%2Fneofolio%2F
```

**Base styles (from design tokens):**

```css
.aspect-4/3 {
  background: var(--card);
  padding: 4px;
}```

## Other Components

### Aspect Video

**Instances found:** 41

**CSS classes:** `.aspect-video` `.border` `.dark:hidden` `.object-cover` `.object-top` `.rounded-xl`

**HTML structure:**

```html
<img alt="Admin dashboard templates" loading="lazy" width="1000" height="1000" decoding="async" data-nimg="1" class="aspect-video rounded-xl border object-cover object-top dark:hidden" sizes="(min-width: 768px) 50vw, 100vw" srcset="/_next/image?url=%2Fimages%2Fdashboard%2Facademy.png&amp;w=384&amp;q=75 384w, /_next/image?url=%2Fimages%2Fdashboard%2Facademy.png&amp;w=640&amp;q=75 640w, /_next/image?url=%2Fimages%2Fdashboard%2Facademy.png&amp;w=750&amp;q=75 750w, /_next/image?url=%2Fimages%2Fdashboard%2Facademy.png&amp;w=828&amp;q=75 828w, /_next/image?url=%2Fimages%2Fdashboard%2Facade
```

**Base styles (from design tokens):**

```css
.aspect-video {
  background: var(--card);
  padding: 4px;
}```

### Shrink 0

**Instances found:** 40

**CSS classes:** `.shrink-0`

**HTML structure:**

```html
<div class="shrink-0"><img alt="Hero sections block" loading="lazy" width="300" height="169" decoding="async" data-nimg="1" class="aspect-video rounded-lg border object-cover dark:hidden" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fhero-sections.png&amp;w=384&amp;q=75 1x, /_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fhero-sections.png&amp;w=640&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fhero-sections.png&amp;w=640&amp;q=75"><img alt="Hero sections block dark" loading="lazy" width="300" height
```

**Base styles (from design tokens):**

```css
.shrink-0 {
  background: var(--card);
  padding: 4px;
}```

### Basis 2/3

**Instances found:** 16

**CSS classes:** `.basis-2/3` `.grow-0` `.min-w-0` `.pl-4` `.shrink-0`

**HTML structure:**

```html
<div role="group" aria-roledescription="slide" data-slot="carousel-item" class="min-w-0 shrink-0 grow-0 pl-4 basis-2/3 md:basis-1/3" style="transform: translate3d(0px, 0px, 0px);"><a target="_blank" class="group hover:border-primary/40 block overflow-hidden rounded-lg border hover:opacity-85" href="/dashboard/default"><div class="flex items-center justify-between px-3 py-2"><span class="text-sm">Classic Dashboard</span><span class="text-sm opacity-0 group-hover:opacity-100">View Demo</span></div><figure class="rounded-xl border-t"><img alt="Classic dashboard admin dashboard template"
```

**Base styles (from design tokens):**

```css
.basis-2/3 {
  background: var(--card);
  padding: 4px;
}```

### Block

**Instances found:** 16

**CSS classes:** `.block` `.border` `.group` `.overflow-hidden` `.rounded-lg`

**HTML structure:**

```html
<a target="_blank" class="group hover:border-primary/40 block overflow-hidden rounded-lg border hover:opacity-85" href="/dashboard/default"><div class="flex items-center justify-between px-3 py-2"><span class="text-sm">Classic Dashboard</span><span class="text-sm opacity-0 group-hover:opacity-100">View Demo</span></div><figure class="rounded-xl border-t"><img alt="Classic dashboard admin dashboard template" loading="lazy" width="300" height="300" decoding="async" data-nimg="1" class="hidden aspect-3/2 w-full rounded-tl-md rounded-tr-lg shadow-2xl dark:block" style="color:transparent"
```

**Base styles (from design tokens):**

```css
.block {
  background: var(--card);
  padding: 4px;
}```

### Text Sm

**Instances found:** 16

**CSS classes:** `.text-sm`

**HTML structure:**

```html
<span class="text-sm">Classic Dashboard</span>
```

**Base styles (from design tokens):**

```css
.text-sm {
  background: var(--card);
  padding: 4px;
}```

### Group Hover:Opacity 100

**Instances found:** 16

**CSS classes:** `.group-hover:opacity-100` `.opacity-0` `.text-sm`

**HTML structure:**

```html
<span class="text-sm opacity-0 group-hover:opacity-100">View Demo</span>
```

**Base styles (from design tokens):**

```css
.group-hover:opacity-100 {
  background: var(--card);
  padding: 4px;
}```

### Border T

**Instances found:** 16

**CSS classes:** `.border-t` `.rounded-xl`

**HTML structure:**

```html
<figure class="rounded-xl border-t"><img alt="Classic dashboard admin dashboard template" loading="lazy" width="300" height="300" decoding="async" data-nimg="1" class="hidden aspect-3/2 w-full rounded-tl-md rounded-tr-lg shadow-2xl dark:block" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fdashboard%2Fclassic-dark.png&amp;w=384&amp;q=75 1x, /_next/image?url=%2Fimages%2Fdashboard%2Fclassic-dark.png&amp;w=640&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fdashboard%2Fclassic-dark.png&amp;w=640&amp;q=75"><img alt="Classic dashboard admin dashboard template dark
```

**Base styles (from design tokens):**

```css
.border-t {
  background: var(--card);
  padding: 4px;
}```

### Aspect 3/2

**Instances found:** 16

**CSS classes:** `.aspect-3/2` `.block` `.dark:hidden` `.rounded-tl-md` `.rounded-tr-lg` `.shadow-2xl`

**HTML structure:**

```html
<img alt="Classic dashboard admin dashboard template dark" loading="lazy" width="300" height="300" decoding="async" data-nimg="1" class="block aspect-3/2 w-full rounded-tl-md rounded-tr-lg shadow-2xl dark:hidden" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fdashboard%2Fclassic.png&amp;w=384&amp;q=75 1x, /_next/image?url=%2Fimages%2Fdashboard%2Fclassic.png&amp;w=640&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fdashboard%2Fclassic.png&amp;w=640&amp;q=75">
```

**Base styles (from design tokens):**

```css
.aspect-3/2 {
  background: var(--card);
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 8

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-invalid:border-destructive` `.aria-invalid:ring-3`

**HTML structure:**

```html
<a data-slot="button" data-variant="default" data-size="lg" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: var(--card);
  padding: 4px;
}```

### Bg Background

**Instances found:** 6

**CSS classes:** `.bg-background` `.border` `.dark:bg-transparent` `.flex` `.relative` `.rounded-xl`

**HTML structure:**

```html
<div class="bg-background relative flex size-12 rounded-xl border dark:bg-transparent"><div class="relative z-20 m-auto size-fit *:size-6"><img alt="reactjs logo" loading="lazy" width="26" height="26" decoding="async" data-nimg="1" style="color:transparent" src="/reactjs-logo.svg"></div><div class="to-muted-foreground/25 absolute z-10 h-px bg-linear-to-r top-1/2 left-full w-[130px] origin-left rotate-25"></div></div>
```

**Base styles (from design tokens):**

```css
.bg-background {
  background: var(--card);
  padding: 4px;
}```

### Space Y 2

**Instances found:** 4

**CSS classes:** `.space-y-2`

**HTML structure:**

```html
<div class="space-y-2"><h2 class="font-heading font-semibold text-xl">Admin Dashboards, Pages &amp; Components</h2><p class="text-muted-foreground leading-relaxed text-balance">Includes 16 production-ready admin dashb…</p></div>
```

**Base styles (from design tokens):**

```css
.space-y-2 {
  background: var(--card);
  padding: 4px;
}```

### Font Heading

**Instances found:** 4

**CSS classes:** `.font-heading` `.font-semibold` `.text-xl`

**HTML structure:**

```html
<h2 class="font-heading font-semibold text-xl">Admin Dashboards, Pages &amp; Components</h2>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: var(--card);
  padding: 4px;
}```

### Leading Relaxed

**Instances found:** 4

**CSS classes:** `.leading-relaxed` `.text-balance` `.text-muted-foreground`

**HTML structure:**

```html
<p class="text-muted-foreground leading-relaxed text-balance">Includes <!-- -->16<!-- --> production-ready admin dashboards,<!-- --> <!-- -->17<!-- --> web application templates, <!-- -->40<!-- -->+ additional pages, and 100+ reusable components. It saves you dozens of hours in development time and significantly reduces overall project costs.</p>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
  background: var(--card);
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
  background: var(--card);
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 3

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<a data-slot="button" data-variant="outline" data-size="default" class="group/button shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-events-none [&amp
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: var(--card);
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `var(--border)` for all dividers within components
- Use `var(--primary)` for active states and `var(--ring)` for focus

