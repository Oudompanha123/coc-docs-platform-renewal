# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Leading Relaxed** | unknown | 21× | `.leading-relaxed`, `.text-balance`, `.text-muted-foreground` |
| **Border B** | card | 20× | `.border-b`, `.flex`, `.flex-col` |
| **Font Heading** | unknown | 20× | `.font-heading`, `.font-semibold` |
| **Flex** | card | 18× | `.flex`, `.items-center`, `.justify-between` |
| **Text Sm** | unknown | 18× | `.text-sm` |
| **Block** | unknown | 16× | `.block`, `.border`, `.group` |
| **Group Hover:Opacity 100** | unknown | 16× | `.group-hover:opacity-100`, `.opacity-0`, `.text-sm` |
| **Border T** | unknown | 16× | `.border-t`, `.rounded-xl` |
| **Aspect 3/2** | unknown | 16× | `.aspect-3/2`, `.block`, `.dark:hidden` |
| **Border** | card | 16× | `.border`, `.inline-flex`, `.items-center` |
| **Border B** | unknown | 15× | `.border-b`, `.last:border-b-0` |
| **Flex** | unknown | 15× | `.flex`, `.flex-col`, `.gap-3` |
| **Flex** | card | 15× | `.flex`, `.gap-2`, `.items-start` |
| **[&>Svg]:Pointer Events None** | unknown | 8× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Border** | card | 4× | `.border`, `.inline-flex`, `.items-center` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 3× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Font Medium** | unknown | 3× | `.font-medium`, `.text-foreground` |
| **Hidden** | unknown | 3× | `.hidden`, `.text-muted-foreground`, `.text-sm` |

## Cards

### Border B

**Instances found:** 20

**CSS classes:** `.border-b` `.flex` `.flex-col` `.gap-2` `.h-full` `.items-center`

**HTML structure:**

```html
<a href="#" target="_blank" rel="noopener noreferrer" class="flex h-full flex-col items-center gap-2 border-b p-6 text-center last:border-b-0 sm:border-e sm:max-lg:nth-[2n]:border-e-0 sm:max-lg:nth-last-[-n+2]:border-b-0 lg:nth-[4n]:border-e-0 lg:nth-last-[-n+4]:border-b-0 hover:bg-muted/50 transition-colors"><span class="mb-2 inline-flex size-12 shrink-0 items-center justify-center rounded-full border"><img alt="" loading="lazy" width="24" height="24" decoding="async" data-nimg="1" class="size-6 object-contain dark:invert" style="color:transparent" src="/images/tech/coc-docs
```

**Base styles (from design tokens):**

```css
.border-b {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 18

**CSS classes:** `.flex` `.items-center` `.justify-between` `.px-3` `.py-2`

**HTML structure:**

```html
<div class="flex items-center justify-between px-3 py-2"><span class="text-sm">Classic Dashboard</span><span class="text-sm opacity-0 group-hover:opacity-100">View Demo</span></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Border

**Instances found:** 16

**CSS classes:** `.border` `.inline-flex` `.items-center` `.justify-center` `.mb-2` `.rounded-full`

**HTML structure:**

```html
<span class="mb-2 inline-flex size-12 shrink-0 items-center justify-center rounded-full border"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move size-5" aria-hidden="true"><path d="M12 2v20"></path><path d="m15 19-3 3-3-3"></path><path d="m19 9 3 3-3 3"></path><path d="M2 12h20"></path><path d="m5 9-3 3 3 3"></path><path d="m9 5 3-3 3 3"></path></svg></span>
```

**Base styles (from design tokens):**

```css
.border {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 15

**CSS classes:** `.flex` `.gap-2` `.items-start` `.justify-between`

**HTML structure:**

```html
<div class="flex items-start justify-between gap-2"><div class="flex items-center gap-3"><a target="_blank" rel="noopener noreferrer" href="https://x.com/vdeev7"><img src="/images/reviews/vdeev7.jpg" alt="Vladimir Deev" width="48" height="48" loading="lazy" class="size-12 rounded-full"></a><div class="min-w-0"><a target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 font-bold hover:underline" href="https://x.com/vdeev7"><span class="truncate">Vladimir Deev</span></a><div class="text-muted-foreground flex items-center gap-1 text-sm"><span class="truncate">@<!-- -->vdeev7</spa
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Border

**Instances found:** 4

**CSS classes:** `.border` `.inline-flex` `.items-center` `.justify-center` `.mb-2` `.rounded-full`

**HTML structure:**

```html
<span class="mb-2 inline-flex size-12 shrink-0 items-center justify-center rounded-full border"><img alt="" loading="lazy" width="24" height="24" decoding="async" data-nimg="1" class="size-6 object-contain dark:invert" style="color:transparent" src="/images/tech/coc-docs.svg"></span>
```

**Base styles (from design tokens):**

```css
.border {
  background: #18181b;
  border: 1px solid #27272a;
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
  border-radius: 7.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Leading Relaxed

**Instances found:** 21

**CSS classes:** `.leading-relaxed` `.text-balance` `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<p class="text-muted-foreground text-sm leading-relaxed text-balance">Every page is built on core primitives, keeping the code simple and easy to customize.</p>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 20

**CSS classes:** `.font-heading` `.font-semibold`

**HTML structure:**

```html
<h3 class="font-heading font-semibold md:text-lg">UI</h3>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

### Text Sm

**Instances found:** 18

**CSS classes:** `.text-sm`

**HTML structure:**

```html
<span class="text-sm">Classic Dashboard</span>
```

**Base styles (from design tokens):**

```css
.text-sm {
  background: #18181b;
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
  background: #18181b;
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
  background: #18181b;
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
  background: #18181b;
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
  background: #18181b;
  padding: 4px;
}```

### Border B

**Instances found:** 15

**CSS classes:** `.border-b` `.last:border-b-0`

**HTML structure:**

```html
<div class="border-b last:border-b-0 sm:border-e sm:last:col-span-2 sm:max-lg:nth-[2n]:border-e-0 sm:max-lg:last:border-e-0 lg:nth-[3n]:border-e-0 lg:nth-last-[-n+3]:border-b-0 lg:last:col-span-1"><div class="flex h-full flex-col gap-3 p-4"><div class="flex items-start justify-between gap-2"><div class="flex items-center gap-3"><a target="_blank" rel="noopener noreferrer" href="https://x.com/vdeev7"><img src="/images/reviews/vdeev7.jpg" alt="Vladimir Deev" width="48" height="48" loading="lazy" class="size-12 rounded-full"></a><div class="min-w-0"><a target="_blank" rel="noopener noreferrer" cl
```

**Base styles (from design tokens):**

```css
.border-b {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 15

**CSS classes:** `.flex` `.flex-col` `.gap-3` `.h-full` `.p-4`

**HTML structure:**

```html
<div class="flex h-full flex-col gap-3 p-4"><div class="flex items-start justify-between gap-2"><div class="flex items-center gap-3"><a target="_blank" rel="noopener noreferrer" href="https://x.com/vdeev7"><img src="/images/reviews/vdeev7.jpg" alt="Vladimir Deev" width="48" height="48" loading="lazy" class="size-12 rounded-full"></a><div class="min-w-0"><a target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 font-bold hover:underline" href="https://x.com/vdeev7"><span class="truncate">Vladimir Deev</span></a><div class="text-muted-foreground flex items-center gap-1 text-sm"
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 8

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

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 3

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-invalid:border-destructive` `.aria-invalid:ring-3`

**HTML structure:**

```html
<a data-slot="button" data-variant="default" data-size="lg" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #18181b;
  padding: 4px;
}```

### Font Medium

**Instances found:** 3

**CSS classes:** `.font-medium` `.text-foreground`

**HTML structure:**

```html
<span class="text-foreground font-medium lg:text-base">16<!-- --> Dashboards</span>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #18181b;
  padding: 4px;
}```

### Hidden

**Instances found:** 3

**CSS classes:** `.hidden` `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<span class="text-muted-foreground hidden text-sm lg:inline">CRM, E-commerce, Sales, Finance, Payment, and more</span>
```

**Base styles (from design tokens):**

```css
.hidden {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

