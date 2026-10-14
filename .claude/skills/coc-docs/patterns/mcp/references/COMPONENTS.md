# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Bg Card** | card | 15× | `.bg-card`, `.border`, `.p-5` |
| **[&>Svg]:Pointer Events None** | unknown | 15× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-secondary/80` |
| **[&>Svg]:Pointer Events None** | unknown | 7× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **[&>Svg]:Pointer Events None** | unknown | 5× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Font Heading** | unknown | 5× | `.font-heading`, `.font-semibold`, `.text-3xl` |
| **Border X** | unknown | 4× | `.border-x`, `.container`, `.mx-auto` |
| **Max W 4xl** | unknown | 4× | `.max-w-4xl`, `.mx-auto`, `.space-y-4` |
| **Text Balance** | unknown | 4× | `.text-balance`, `.text-muted-foreground` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 4× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Flex** | card | 4× | `.flex`, `.gap-2`, `.items-center` |
| **Hidden** | unknown | 4× | `.hidden` |
| **Font Normal** | unknown | 4× | `.font-normal`, `.hidden`, `.leading-relaxed` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 4× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Translate X 1/2** | unknown | 3× | `.-translate-x-1/2`, `.-translate-y-1/2`, `.[&_svg]:size-6` |
| **Flex** | card | 3× | `.flex`, `.flex-col`, `.items-center` |
| **[& Svg]:Size 7** | unknown | 3× | `.[&_svg]:size-7`, `.[&_svg]:stroke-[1.5]`, `.border-2` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.mt-5` |
| **Leading Relaxed** | unknown | 3× | `.leading-relaxed`, `.max-w-64`, `.mt-3` |

## Cards

### Bg Card

**Instances found:** 15

**CSS classes:** `.bg-card` `.border` `.p-5` `.rounded-lg` `.space-y-3`

**HTML structure:**

```html
<li class="bg-card space-y-3 rounded-lg border p-5"><span data-slot="badge" data-variant="secondary" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;
```

**Base styles (from design tokens):**

```css
.bg-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.gap-2` `.items-center`

**HTML structure:**

```html
<span class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rows3 lucide-rows-3" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M21 9H3"></path><path d="M21 15H3"></path></svg><span class="lg:hidden">Sections</span><span class="hidden lg:inline">430+ blocks and 530+ components</span></span>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.flex-col` `.items-center` `.px-4` `.text-center`

**HTML structure:**

```html
<li class="flex flex-col items-center px-4 text-center"><div class="relative flex w-full justify-center"><div class="text-foreground border-muted-foreground/60 flex size-20 items-center justify-center rounded-full border-2 border-dashed md:size-28 [&amp;_svg]:size-7 [&amp;_svg]:stroke-[1.5] md:[&amp;_svg]:size-9"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round" aria-hidden="true"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
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

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<button type="button" role="tab" aria-selected="true" aria-controls="radix-_R_iav5tiiv5b_-content-section" data-state="active" id="radix-_R_iav5tiiv5b_-trigger-section" data-slot="tabs-trigger" class="relative inline-flex justify-center rounded-full border border-transparent! px-3 py-1 text-sm font-medium text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring 
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #ff667f;
  color: #ffffff;
  border-radius: 11.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 4

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<button type="button" role="tab" aria-selected="true" aria-controls="radix-_R_jav5tiiv5b_-content-claude-code" data-state="active" id="radix-_R_jav5tiiv5b_-trigger-claude-code" data-slot="tabs-trigger" class="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full border border-transparent! px-3 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 hover:text-foregro
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #ff667f;
  color: #ffffff;
  border-radius: 11.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

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
  border-radius: 11.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### [&>Svg]:Pointer Events None

**Instances found:** 15

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-secondary/80` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20` `.bg-secondary`

**HTML structure:**

```html
<span data-slot="badge" data-variant="secondary" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! bg-secondary text-secondary-foreground 
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
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

### [&>Svg]:Pointer Events None

**Instances found:** 5

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-muted` `.[a]:hover:text-muted-foreground` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20`

**HTML structure:**

```html
<span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! border-border text-foreground [a]:hover:bg-muted [a]:hover:text-mu
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 5

**CSS classes:** `.font-heading` `.font-semibold` `.text-3xl` `.text-balance`

**HTML structure:**

```html
<h2 class="font-heading text-3xl font-semibold text-balance lg:text-5xl">Watch your assistant build with the kit</h2>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

### Border X

**Instances found:** 4

**CSS classes:** `.border-x` `.container` `.mx-auto` `.px-0`

**HTML structure:**

```html
<div class="container mx-auto border-x px-0"><div class="px-6 py-12 lg:px-12 lg:py-20"><div class="mx-auto max-w-4xl space-y-4 text-center"><span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring
```

**Base styles (from design tokens):**

```css
.border-x {
  background: #18181b;
  padding: 4px;
}```

### Max W 4xl

**Instances found:** 4

**CSS classes:** `.max-w-4xl` `.mx-auto` `.space-y-4` `.text-center`

**HTML structure:**

```html
<div class="mx-auto max-w-4xl space-y-4 text-center"><span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! border-border
```

**Base styles (from design tokens):**

```css
.max-w-4xl {
  background: #18181b;
  padding: 4px;
}```

### Text Balance

**Instances found:** 4

**CSS classes:** `.text-balance` `.text-muted-foreground`

**HTML structure:**

```html
<p class="text-muted-foreground text-balance lg:text-lg">Sections, full pages and dashboards come from real kit code and adapt to your project. Pick a scenario to replay it.</p>
```

**Base styles (from design tokens):**

```css
.text-balance {
  background: #18181b;
  padding: 4px;
}```

### Hidden

**Instances found:** 4

**CSS classes:** `.hidden`

**HTML structure:**

```html
<span class="hidden lg:inline">430+ blocks and 530+ components</span>
```

**Base styles (from design tokens):**

```css
.hidden {
  background: #18181b;
  padding: 4px;
}```

### Font Normal

**Instances found:** 4

**CSS classes:** `.font-normal` `.hidden` `.leading-relaxed` `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<span class="text-muted-foreground hidden text-sm leading-relaxed font-normal lg:block">Ask for a section in plain words. Your assistant finds the right variant and brings its source into your project.</span>
```

**Base styles (from design tokens):**

```css
.font-normal {
  background: #18181b;
  padding: 4px;
}```

### Translate X 1/2

**Instances found:** 3

**CSS classes:** `.-translate-x-1/2` `.-translate-y-1/2` `.[&_svg]:size-6` `.absolute` `.bg-background` `.border`

**HTML structure:**

```html
<div role="img" aria-label="Claude Code" class="bg-background absolute z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-transform hover:scale-105 md:size-17 [&amp;_svg]:size-6 md:[&amp;_svg]:size-8" style="left:54%;top:20%" data-state="closed" data-slot="tooltip-trigger"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="remixicon text-orange-500"><path d="M5.92 15.3L9.86 13.1L9.92 12.9L9.86 12.8H9.66L9 12.76L6.76 12.7L4.8 12.6L2.9 12.5L2.42 12.4L2 11.8L2.04 11.5L2.44 11.24L
```

**Base styles (from design tokens):**

```css
.-translate-x-1/2 {
  background: #18181b;
  padding: 4px;
}```

### [& Svg]:Size 7

**Instances found:** 3

**CSS classes:** `.[&_svg]:size-7` `.[&_svg]:stroke-[1.5]` `.border-2` `.border-dashed` `.border-muted-foreground/60` `.flex`

**HTML structure:**

```html
<div class="text-foreground border-muted-foreground/60 flex size-20 items-center justify-center rounded-full border-2 border-dashed md:size-28 [&amp;_svg]:size-7 [&amp;_svg]:stroke-[1.5] md:[&amp;_svg]:size-9"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round" aria-hidden="true"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.8
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
<h3 class="font-heading mt-5 text-lg font-semibold md:mt-8 lg:text-2xl">Create an API key</h3>
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
<p class="text-muted-foreground mt-3 max-w-64 text-sm leading-relaxed text-balance lg:text-base">Open your account and create a key. It is the same key the CLI uses.</p>
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

