# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Border B** | card | 44× | `.border-b`, `.flex`, `.gap-1` |
| **Border B** | card | 27× | `.border-b`, `.flex`, `.gap-1` |
| **Border B** | card | 18× | `.border-b`, `.flex`, `.h-14` |
| **Border B** | unknown | 15× | `.border-b`, `.last:border-b-0` |
| **Flex** | card | 10× | `.flex`, `.gap-2`, `.items-center` |
| **Font Medium** | unknown | 10× | `.font-medium`, `.text-base` |
| **Font Medium** | unknown | 8× | `.font-medium`, `.text-base` |
| **Flex** | card | 7× | `.flex`, `.gap-2`, `.items-center` |
| **[&>Svg]:Pointer Events None** | unknown | 7× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **[&>Div:Nth Child(Odd)]:Bg Muted** | unknown | 5× | `.[&>div:nth-child(odd)]:bg-muted`, `.divide-y`, `.flex-1` |
| **Mb 4** | unknown | 4× | `.mb-4` |
| **Flex** | unknown | 4× | `.flex`, `.flex-col` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.mb-1` |
| **Mb 4** | unknown | 3× | `.mb-4`, `.text-muted-foreground`, `.text-sm` |
| **Flex** | card | 3× | `.flex`, `.gap-2`, `.items-end` |
| **Font Bold** | unknown | 3× | `.font-bold`, `.text-4xl` |
| **Line Through** | unknown | 3× | `.line-through`, `.text-muted-foreground`, `.text-xl` |
| **Inline** | unknown | 3× | `.inline` |

## Cards

### Border B

**Instances found:** 44

**CSS classes:** `.border-b` `.flex` `.gap-1` `.h-14` `.items-center` `.justify-center`

**HTML structure:**

```html
<div class="text-muted-foreground flex h-14 items-center justify-center gap-1 border-b px-4 text-sm last:border-b-0"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x text-destructive size-5" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></div>
```

**Base styles (from design tokens):**

```css
.border-b {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Border B

**Instances found:** 27

**CSS classes:** `.border-b` `.flex` `.gap-1` `.h-14` `.items-center` `.justify-center`

**HTML structure:**

```html
<div class="text-muted-foreground flex h-14 items-center justify-center gap-1 border-b px-4 text-sm last:border-b-0"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check size-4 shrink-0 text-green-600" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg><span>1 free template</span></div>
```

**Base styles (from design tokens):**

```css
.border-b {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Border B

**Instances found:** 18

**CSS classes:** `.border-b` `.flex` `.h-14` `.items-center` `.last:border-b-0` `.px-4`

**HTML structure:**

```html
<div class="flex h-14 items-center border-b px-4 last:border-b-0"><div class="flex items-center gap-2"><a target="_blank" class="text-base font-medium hover:underline" href="/dashboard/crm">16 admin dashboards</a><button type="button" aria-label="More information about 16 admin dashboards" class="text-muted-foreground hover:text-foreground transition-colors" data-state="closed" data-slot="tooltip-trigger"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="luc
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

**Instances found:** 10

**CSS classes:** `.flex` `.gap-2` `.items-center`

**HTML structure:**

```html
<div class="flex items-center gap-2"><a target="_blank" class="text-base font-medium hover:underline" href="/dashboard/crm">16 admin dashboards</a><button type="button" aria-label="More information about 16 admin dashboards" class="text-muted-foreground hover:text-foreground transition-colors" data-state="closed" data-slot="tooltip-trigger"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert size-4" aria-hidden="true"><circle cx="12"
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

**Instances found:** 7

**CSS classes:** `.flex` `.gap-2` `.items-center`

**HTML structure:**

```html
<div class="flex items-center gap-2"><span class="text-base font-medium">CLI</span><button type="button" aria-label="More information about CLI" class="text-muted-foreground hover:text-foreground transition-colors" data-state="closed" data-slot="tooltip-trigger"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert size-4" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></li
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

**Instances found:** 3

**CSS classes:** `.flex` `.gap-2` `.items-end`

**HTML structure:**

```html
<div class="flex items-end gap-2"><span class="text-4xl font-bold">$79</span><span class="flex flex-col"><span class="text-muted-foreground text-xl line-through">$129</span><span class="text-muted-foreground text-xs text-nowrap">One-time payment</span></span></div>
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

### Font Medium

**Instances found:** 10

**CSS classes:** `.font-medium` `.text-base`

**HTML structure:**

```html
<a target="_blank" class="text-base font-medium hover:underline" href="/dashboard/crm">16 admin dashboards</a>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #18181b;
  padding: 4px;
}```

### Font Medium

**Instances found:** 8

**CSS classes:** `.font-medium` `.text-base`

**HTML structure:**

```html
<span class="text-base font-medium">Figma file</span>
```

**Base styles (from design tokens):**

```css
.font-medium {
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

### [&>Div:Nth Child(Odd)]:Bg Muted

**Instances found:** 5

**CSS classes:** `.[&>div:nth-child(odd)]:bg-muted` `.divide-y` `.flex-1`

**HTML structure:**

```html
<div class="[&amp;&gt;div:nth-child(odd)]:bg-muted flex-1 divide-y"><div class="flex h-14 items-center border-b px-4 last:border-b-0"><div class="flex items-center gap-2"><a target="_blank" class="text-base font-medium hover:underline" href="/dashboard/crm">16 admin dashboards</a><button type="button" aria-label="More information about 16 admin dashboards" class="text-muted-foreground hover:text-foreground transition-colors" data-state="closed" data-slot="tooltip-trigger"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke
```

**Base styles (from design tokens):**

```css
.[&>div:nth-child(odd)]:bg-muted {
  background: #18181b;
  padding: 4px;
}```

### Mb 4

**Instances found:** 4

**CSS classes:** `.mb-4`

**HTML structure:**

```html
<div class="mb-4"><div class="flex items-end gap-2"><div class="text-4xl font-bold">Free</div><span class="flex flex-col"><span class="invisible text-xl line-through" aria-hidden="true">$0</span><span class="invisible text-xs text-nowrap" aria-hidden="true">One-time payment</span></span></div></div>
```

**Base styles (from design tokens):**

```css
.mb-4 {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.flex-col`

**HTML structure:**

```html
<span class="flex flex-col"><span class="invisible text-xl line-through" aria-hidden="true">$0</span><span class="invisible text-xs text-nowrap" aria-hidden="true">One-time payment</span></span>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 3

**CSS classes:** `.font-heading` `.font-semibold` `.mb-1` `.text-xl`

**HTML structure:**

```html
<h3 class="font-heading mb-1 text-xl font-semibold">Starter</h3>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

### Mb 4

**Instances found:** 3

**CSS classes:** `.mb-4` `.text-muted-foreground` `.text-sm` `.truncate`

**HTML structure:**

```html
<p class="text-muted-foreground mb-4 truncate text-sm">For solo makers.</p>
```

**Base styles (from design tokens):**

```css
.mb-4 {
  background: #18181b;
  padding: 4px;
}```

### Font Bold

**Instances found:** 3

**CSS classes:** `.font-bold` `.text-4xl`

**HTML structure:**

```html
<span class="text-4xl font-bold">$79</span>
```

**Base styles (from design tokens):**

```css
.font-bold {
  background: #18181b;
  padding: 4px;
}```

### Line Through

**Instances found:** 3

**CSS classes:** `.line-through` `.text-muted-foreground` `.text-xl`

**HTML structure:**

```html
<span class="text-muted-foreground text-xl line-through">$129</span>
```

**Base styles (from design tokens):**

```css
.line-through {
  background: #18181b;
  padding: 4px;
}```

### Inline

**Instances found:** 3

**CSS classes:** `.inline`

**HTML structure:**

```html
<div class="inline"><button data-slot="button" data-variant="default" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:r
```

**Base styles (from design tokens):**

```css
.inline {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

