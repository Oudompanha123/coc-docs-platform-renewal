# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Font Bold** | unknown | 9× | `.font-bold`, `.font-sans`, `.mb-4` |
| **[& A]:Block** | unknown | 9× | `.[&_a]:block`, `.[&_a]:hover:text-foreground`, `.[&_a]:hover:underline` |
| **[&>Svg]:Pointer Events None** | unknown | 6× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Flex** | unknown | 4× | `.flex`, `.flex-col`, `.gap-5` |
| **Aspect [4/3]** | unknown | 4× | `.aspect-[4/3]`, `.bg-muted`, `.border` |
| **Duration 300** | form-field | 4× | `.duration-300`, `.group-hover:scale-105`, `.object-cover` |
| **Flex** | unknown | 4× | `.flex`, `.flex-1`, `.flex-col` |
| **Font Heading** | unknown | 4× | `.font-heading`, `.font-semibold`, `.text-balance` |
| **Leading Relaxed** | unknown | 4× | `.leading-relaxed`, `.text-muted-foreground`, `.text-sm` |
| **Font Medium** | card | 4× | `.font-medium`, `.gap-1`, `.group-hover:underline` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |

## Cards

### Font Medium

**Instances found:** 4

**CSS classes:** `.font-medium` `.gap-1` `.group-hover:underline` `.inline-flex` `.items-center` `.mt-2`

**HTML structure:**

```html
<span class="text-foreground mt-2 inline-flex items-center gap-1 text-sm font-medium group-hover:underline">Read more<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></span>
```

**Base styles (from design tokens):**

```css
.font-medium {
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

## Form Fields

### Duration 300

**Instances found:** 4

**CSS classes:** `.duration-300` `.group-hover:scale-105` `.object-cover` `.size-full` `.transition-transform`

**HTML structure:**

```html
<img alt="How to Build a Website with Blocks" loading="lazy" width="800" height="600" decoding="async" data-nimg="1" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" style="color:transparent" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" srcset="/_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=256&amp;q=75 256w, /_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=384&amp;q=75 384w, /_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp
```

**Base styles (from design tokens):**

```css
.duration-300 {
  background: #18181b;
  padding: 4px;
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

**Instances found:** 6

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

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.flex-col` `.gap-5` `.group`

**HTML structure:**

```html
<a class="group flex flex-col gap-5" href="/blog/build-a-website-with-blocks"><div class="bg-muted aspect-[4/3] w-full overflow-hidden rounded-xl border"><img alt="How to Build a Website with Blocks" loading="lazy" width="800" height="600" decoding="async" data-nimg="1" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" style="color:transparent" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" srcset="/_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=256&amp;q=75 256w, /_next/image?url=%2F
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### Aspect [4/3]

**Instances found:** 4

**CSS classes:** `.aspect-[4/3]` `.bg-muted` `.border` `.overflow-hidden` `.rounded-xl` `.w-full`

**HTML structure:**

```html
<div class="bg-muted aspect-[4/3] w-full overflow-hidden rounded-xl border"><img alt="How to Build a Website with Blocks" loading="lazy" width="800" height="600" decoding="async" data-nimg="1" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" style="color:transparent" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" srcset="/_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=256&amp;q=75 256w, /_next/image?url=%2Fimages%2Fblog%2Fbuild-a-website-with-blocks.jpg&amp;w=384&amp;q=75 384w, /_nex
```

**Base styles (from design tokens):**

```css
.aspect-[4/3] {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.flex-1` `.flex-col` `.gap-2`

**HTML structure:**

```html
<div class="flex flex-1 flex-col gap-2"><div class="text-muted-foreground flex items-center gap-2 text-xs uppercase"><time>Sep 24, 2026</time><span class="text-muted-foreground/30">/</span><span>Page Builder</span></div><h2 class="font-heading text-foreground text-xl font-semibold text-balance sm:text-2xl">How to Build a Website with Bl…</h2><p class="text-muted-foreground text-sm leading-relaxed">A step by step guide to building multi-p…</p><span class="text-foreground mt-2 inline-flex items-center gap-1 text-sm font-medium group-hover:underline">Read more<svg xmlns="http
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 4

**CSS classes:** `.font-heading` `.font-semibold` `.text-balance` `.text-foreground` `.text-xl`

**HTML structure:**

```html
<h2 class="font-heading text-foreground text-xl font-semibold text-balance sm:text-2xl">How to Build a Website with Blocks</h2>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

### Leading Relaxed

**Instances found:** 4

**CSS classes:** `.leading-relaxed` `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<p class="text-muted-foreground text-sm leading-relaxed">A step by step guide to building multi-page Next.js sites from blocks with the Page Builder, then exporting clean code as a Next.js project or with the CLI.</p>
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

