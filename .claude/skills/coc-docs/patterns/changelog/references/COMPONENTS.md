# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Bg Muted** | card | 61× | `.bg-muted`, `.border`, `.flex` |
| **[&>Svg]:Pointer Events None** | unknown | 34× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Relative** | unknown | 28× | `.relative` |
| **Space Y 2** | unknown | 28× | `.space-y-2` |
| **Flex** | card | 28× | `.flex`, `.gap-3`, `.items-center` |
| **Font Semibold** | unknown | 28× | `.font-semibold`, `.text-foreground`, `.text-xl` |
| **Space Y 4** | unknown | 22× | `.space-y-4` |
| **Leading Relaxed** | unknown | 22× | `.leading-relaxed`, `.text-muted-foreground` |
| **Flex** | card | 16× | `.flex`, `.flex-wrap`, `.gap-1.5` |
| **Font Bold** | unknown | 9× | `.font-bold`, `.font-sans`, `.mb-4` |
| **[& A]:Block** | unknown | 9× | `.[&_a]:block`, `.[&_a]:hover:text-foreground`, `.[&_a]:hover:underline` |
| **Space Y 4** | unknown | 6× | `.space-y-4` |
| **Flex** | card | 6× | `.flex`, `.flex-wrap`, `.gap-1.5` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 4× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Flex** | card | 4× | `.flex`, `.flex-wrap`, `.gap-1.5` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Leading Relaxed** | unknown | 3× | `.leading-relaxed`, `.prose`, `.prose-h4:font-normal` |

## Cards

### Bg Muted

**Instances found:** 61

**CSS classes:** `.bg-muted` `.border` `.flex` `.items-center` `.px-3` `.py-1.5`

**HTML structure:**

```html
<a class="hover:bg-primary bg-muted hover:text-primary-foreground flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors" target="_blank" href="/blocks/dashboard-ui/dropdown-components">Dashboard Dropdowns<!-- --> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link ms-2 size-3" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0
```

**Base styles (from design tokens):**

```css
.bg-muted {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 28

**CSS classes:** `.flex` `.gap-3` `.items-center`

**HTML structure:**

```html
<div class="flex items-center gap-3"><span class="text-muted-foreground text-xs uppercase">Oct 4, 2026</span><span class="text-muted-foreground/30">/</span><span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 16

**CSS classes:** `.flex` `.flex-wrap` `.gap-1.5` `.items-center`

**HTML structure:**

```html
<div class="flex flex-wrap items-center gap-1.5"><a class="hover:bg-primary bg-muted hover:text-primary-foreground flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors" target="_blank" href="/dashboard/ai-analytics">AI Analytics Dashboard<!-- --> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link ms-2 size-3" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 1
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 6

**CSS classes:** `.flex` `.flex-wrap` `.gap-1.5` `.items-center`

**HTML structure:**

```html
<div class="flex flex-wrap items-center gap-1.5"><a class="hover:bg-primary bg-muted hover:text-primary-foreground flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors" target="_blank" href="/blocks/dashboard-ui/dropdown-components">Dashboard Dropdowns<!-- --> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link ms-2 size-3" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.flex-wrap` `.gap-1.5` `.items-center`

**HTML structure:**

```html
<div class="flex flex-wrap items-center gap-1.5"><a class="hover:bg-primary bg-muted hover:text-primary-foreground flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors" target="_blank" href="/page-builder">Page Builder<!-- --> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link ms-2 size-3" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54
```

**Base styles (from design tokens):**

```css
.flex {
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

### [&>Svg]:Pointer Events None

**Instances found:** 34

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

### Relative

**Instances found:** 28

**CSS classes:** `.relative`

**HTML structure:**

```html
<div class="relative"><div class="ring-background bg-primary absolute top-0.5 -left-[37px] h-2.5 w-2.5 rounded-full ring-4"></div><div class="space-y-2"><div class="flex items-center gap-3"><span class="text-muted-foreground text-xs uppercase">Oct 4, 2026</span><span class="text-muted-foreground/30">/</span><span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-vis
```

**Base styles (from design tokens):**

```css
.relative {
  background: #18181b;
  padding: 4px;
}```

### Space Y 2

**Instances found:** 28

**CSS classes:** `.space-y-2`

**HTML structure:**

```html
<div class="space-y-2"><div class="flex items-center gap-3"><span class="text-muted-foreground text-xs uppercase">Oct 4, 2026</span><span class="text-muted-foreground/30">/</span><span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-inval
```

**Base styles (from design tokens):**

```css
.space-y-2 {
  background: #18181b;
  padding: 4px;
}```

### Font Semibold

**Instances found:** 28

**CSS classes:** `.font-semibold` `.text-foreground` `.text-xl`

**HTML structure:**

```html
<h3 class="text-foreground text-xl font-semibold">109 New Dashboard UI Blocks and a Dropdowns Category</h3>
```

**Base styles (from design tokens):**

```css
.font-semibold {
  background: #18181b;
  padding: 4px;
}```

### Space Y 4

**Instances found:** 22

**CSS classes:** `.space-y-4`

**HTML structure:**

```html
<div class="space-y-4"><h3 class="text-foreground text-xl font-semibold">AI Analytics Dashboard</h3><p class="text-muted-foreground leading-relaxed">A new AI Analytics dashboard has been ad…</p><div class="flex flex-wrap items-center gap-1.5"><a class="hover:bg-primary bg-muted hover:text-primary-foreground flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors" target="_blank" href="/dashboard/ai-analytics">AI Analytics Dashboard<!-- --> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" st
```

**Base styles (from design tokens):**

```css
.space-y-4 {
  background: #18181b;
  padding: 4px;
}```

### Leading Relaxed

**Instances found:** 22

**CSS classes:** `.leading-relaxed` `.text-muted-foreground`

**HTML structure:**

```html
<p class="text-muted-foreground leading-relaxed">A new AI Analytics dashboard has been added. Track token consumption, model usage, costs and cache efficiency in one place. It ships with animated stat cards, time range filters on every chart, a model usage comparison section and a member usage table.</p>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
  background: #18181b;
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

### Space Y 4

**Instances found:** 6

**CSS classes:** `.space-y-4`

**HTML structure:**

```html
<div class="space-y-4"><h3 class="text-foreground text-xl font-semibold">109 New Dashboard UI Blocks and a Dropdo…</h3><div class="text-muted-foreground prose prose-h4:font-normal prose-li:m-0! prose-p:text-sm prose-li:text-sm prose-ul:gap-1.5 prose-ul:flex prose-ul:flex-col leading-relaxed"><p>A big drop for <strong>Dashboard UI</strong>: 109 new blocks across Charts, Stat Cards, Tables, Form Layouts and the new Dashboard Dropdowns category, plus a full redesign of the existing tables and forms.</p><h4>Dashboard Dropdowns, new category with 1…</h4><ul><li>Account menus with theme switchers, p
```

**Base styles (from design tokens):**

```css
.space-y-4 {
  background: #18181b;
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 4

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<a target="_blank" data-slot="button" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:pointer-e
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #18181b;
  padding: 4px;
}```

### Leading Relaxed

**Instances found:** 3

**CSS classes:** `.leading-relaxed` `.prose` `.prose-h4:font-normal` `.prose-li:m-0!` `.prose-li:text-sm` `.prose-p:text-sm`

**HTML structure:**

```html
<div class="text-muted-foreground prose prose-h4:font-normal prose-li:m-0! prose-p:text-sm prose-li:text-sm prose-ul:gap-1.5 prose-ul:flex prose-ul:flex-col leading-relaxed"><p>A big drop for <strong>Dashboard UI</strong>: 109 new blocks across Charts, Stat Cards, Tables, Form Layouts and the new Dashboard Dropdowns category, plus a full redesign of the existing tables and forms.</p><h4>Dashboard Dropdowns, new category with 1…</h4><ul><li>Account menus with theme switchers, pres…</li><li>Notification and chat inboxes with tabs,…</li><li>A mini cart with quantity steppers and a…</li><li>Worksp
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

