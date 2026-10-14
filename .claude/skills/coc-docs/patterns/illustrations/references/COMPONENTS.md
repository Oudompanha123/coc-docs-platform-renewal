# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Flex** | card | 36× | `.flex`, `.flex-col`, `.group` |
| **Group Hover:Opacity 100** | unknown | 36× | `.group-hover:opacity-100`, `.opacity-0`, `.transition-opacity` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 36× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Flex** | card | 35× | `.flex`, `.items-center`, `.justify-center` |
| **Absolute** | card | 28× | `.absolute`, `.flex`, `.items-start` |
| **Border** | card | 8× | `.border`, `.flex`, `.h-20` |
| **Flex** | card | 8× | `.flex`, `.gap-4`, `.items-center` |
| **Min W 0** | unknown | 8× | `.min-w-0` |
| **Absolute** | card | 8× | `.absolute`, `.bg-background`, `.border` |
| **Left 7** | card | 4× | `.-left-7`, `.-top-7`, `.absolute` |
| **After:Absolute** | unknown | 4× | `.after:absolute`, `.after:border`, `.after:border-border` |
| **Aspect Square** | unknown | 4× | `.aspect-square`, `.object-cover`, `.rounded-full` |
| **Bg Green 50** | unknown | 4× | `.bg-green-50`, `.border`, `.border-current/10` |
| **Animated Flow Line** | unknown | 4× | `.animated-flow-line` |
| **Flex** | unknown | 4× | `.flex`, `.overflow-hidden`, `.py-2` |
| **Flex** | unknown | 4× | `.flex`, `.shrink-0`, `.w-max` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Translate X 1/2** | unknown | 3× | `.-translate-x-1/2`, `.-translate-y-1/2`, `.absolute` |
| **Absolute** | card | 3× | `.absolute`, `.flex`, `.flex-col` |

## Cards

### Flex

**Instances found:** 36

**CSS classes:** `.flex` `.flex-col` `.group` `.items-center` `.justify-center` `.min-w-0`

**HTML structure:**

```html
<div class="group hover:bg-muted/20 relative flex min-w-0 flex-col items-center justify-center overflow-hidden p-4 lg:min-h-64 lg:p-8"><div class="absolute top-0 right-0 left-0 z-30 mb-4 flex items-start justify-between p-4 transition-opacity"><div class="opacity-0 transition-opacity group-hover:opacity-100"><button data-slot="dialog-trigger" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focu
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

**Instances found:** 35

**CSS classes:** `.flex` `.items-center` `.justify-center` `.py-8` `.w-full`

**HTML structure:**

```html
<div class="flex w-full items-center justify-center py-8"><div aria-hidden="true" class="bg-background w-full max-w-md rounded-lg border p-6" style="opacity: 1; transform: none;"><div class="mb-4"><h2 class="text-muted-foreground mb-1 text-xs">Credit Score Growth</h2><div class="flex items-center"><span class="text-4xl font-bold">100</span><span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring f
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Absolute

**Instances found:** 28

**CSS classes:** `.absolute` `.flex` `.items-start` `.justify-between` `.left-0` `.mb-4`

**HTML structure:**

```html
<div class="absolute top-0 right-0 left-0 z-30 mb-4 flex items-start justify-between p-4 transition-opacity"><div class="opacity-0 transition-opacity group-hover:opacity-100"><button data-slot="dialog-trigger" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 
```

**Base styles (from design tokens):**

```css
.absolute {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Border

**Instances found:** 8

**CSS classes:** `.border` `.flex` `.h-20` `.items-center` `.justify-between` `.mb-4`

**HTML structure:**

```html
<div class="relative mb-4 flex h-20 w-full items-center justify-between rounded-2xl border p-4 transition-colors" style="transform: scale(0.9); opacity: 0.4;"><div class="flex min-w-0 items-center gap-4"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check" aria-hidden="true"><path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4
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

**Instances found:** 8

**CSS classes:** `.flex` `.gap-4` `.items-center` `.min-w-0`

**HTML structure:**

```html
<div class="flex min-w-0 items-center gap-4"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-check" aria-hidden="true"><path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg></div><div class="min-w-0"><h3 class="truncate text-sm font-semibold">KYC Submitted</h3><p class="text-
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Absolute

**Instances found:** 8

**CSS classes:** `.absolute` `.bg-background` `.border` `.flex` `.items-center` `.justify-center`

**HTML structure:**

```html
<div class="bg-background absolute z-10 flex size-10 items-center justify-center rounded-full border transition-transform hover:scale-105 sm:size-[68px]" style="left:18.75%;top:20%;transform:translate(-50%, -50%)"><svg viewBox="0 0 24 24" class="size-5 sm:size-8"><path fill="#E01E5A" d="M9.2 4.4A2.6 2.6 0 006.6 7h2.6V4.4z"></path><path fill="#E01E5A" d="M10.4 7a2.6 2.6 0 100 5H5a2.6 2.6 0 110-5h5.4z"></path><path fill="#36C5F0" d="M19.6 9.2A2.6 2.6 0 0017 6.6v2.6h2.6z"></path><path fill="#36C5F0" d="M17 10.4a2.6 2.6 0 10-5 0V19a2.6 2.6 0 115 0v-8.6z"></path><path fill="#2EB67D" d="M14.8 19.6A2
```

**Base styles (from design tokens):**

```css
.absolute {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Left 7

**Instances found:** 4

**CSS classes:** `.-left-7` `.-top-7` `.absolute` `.flex` `.h-14` `.items-center`

**HTML structure:**

```html
<div class="absolute -top-7 -left-7 flex h-14 w-14 items-center justify-center" style="transform: rotate(92.7504deg);"><span data-slot="avatar" data-size="default" class="group/avatar relative flex shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten size-12"><img data-slot="avatar-image" class="aspect-square size-full rounded-full object-cover" alt="User Avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=form
```

**Base styles (from design tokens):**

```css
.-left-7 {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 7.2px;
  padding: 8px;
}```

### Absolute

**Instances found:** 3

**CSS classes:** `.absolute` `.flex` `.flex-col` `.gap-1` `.items-start` `.pointer-events-none`

**HTML structure:**

```html
<div class="pointer-events-none absolute z-10 flex flex-col items-start gap-1" style="left: 24.16%; top: 32.672%;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mouse-pointer2 lucide-mouse-pointer-2 text-muted-foreground size-4" aria-hidden="true"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"></path></svg><span class="rounded-full px-3 py-1 text
```

**Base styles (from design tokens):**

```css
.absolute {
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

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 36

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.active:not-aria-[haspopup]:translate-y-px` `.aria-expanded:bg-muted` `.aria-expanded:text-foreground`

**HTML structure:**

```html
<button data-slot="dialog-trigger" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&amp;_svg]:
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #ff667f;
  color: #ffffff;
  border-radius: 7.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

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
  background: #ff667f;
  color: #ffffff;
  border-radius: 7.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Group Hover:Opacity 100

**Instances found:** 36

**CSS classes:** `.group-hover:opacity-100` `.opacity-0` `.transition-opacity`

**HTML structure:**

```html
<div class="opacity-0 transition-opacity group-hover:opacity-100"><button data-slot="dialog-trigger" data-variant="outline" data-size="default" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border
```

**Base styles (from design tokens):**

```css
.group-hover:opacity-100 {
  background: #18181b;
  padding: 4px;
}```

### Min W 0

**Instances found:** 8

**CSS classes:** `.min-w-0`

**HTML structure:**

```html
<div class="min-w-0"><h3 class="truncate text-sm font-semibold">KYC Submitted</h3><p class="text-muted-foreground truncate text-[10px] font-medium tracking-wider uppercase">Steven Kirk, London, UK</p></div>
```

**Base styles (from design tokens):**

```css
.min-w-0 {
  background: #18181b;
  padding: 4px;
}```

### After:Absolute

**Instances found:** 4

**CSS classes:** `.after:absolute` `.after:border` `.after:border-border` `.after:inset-0` `.after:mix-blend-darken` `.after:rounded-full`

**HTML structure:**

```html
<span data-slot="avatar" data-size="default" class="group/avatar relative flex shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten size-12"><img data-slot="avatar-image" class="aspect-square size-full rounded-full object-cover" alt="User Avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&amp;fit=crop&amp;w=150&amp;q=80"></span>
```

**Base styles (from design tokens):**

```css
.after:absolute {
  background: #18181b;
  padding: 4px;
}```

### Aspect Square

**Instances found:** 4

**CSS classes:** `.aspect-square` `.object-cover` `.rounded-full` `.size-full`

**HTML structure:**

```html
<img data-slot="avatar-image" class="aspect-square size-full rounded-full object-cover" alt="User Avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&amp;fit=crop&amp;w=150&amp;q=80">
```

**Base styles (from design tokens):**

```css
.aspect-square {
  background: #18181b;
  padding: 4px;
}```

### Bg Green 50

**Instances found:** 4

**CSS classes:** `.bg-green-50` `.border` `.border-current/10` `.dark:bg-green-950` `.dark:text-green-400` `.flex`

**HTML structure:**

```html
<div class="flex shrink-0 items-center gap-1.5 rounded-full border border-current/10 px-3 py-1 text-[10px] font-bold bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">Completed</div>
```

**Base styles (from design tokens):**

```css
.bg-green-50 {
  background: #18181b;
  padding: 4px;
}```

### Animated Flow Line

**Instances found:** 4

**CSS classes:** `.animated-flow-line`

**HTML structure:**

```html
<path d="M 310 200 H 250 Q 230 200 230 180 V 100 Q 230 80 210 80 H 150" class="animated-flow-line" style="animation-delay:0s;animation-duration:2.8s"></path>
```

**Base styles (from design tokens):**

```css
.animated-flow-line {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.overflow-hidden` `.py-2` `.select-none`

**HTML structure:**

```html
<div class="flex overflow-hidden py-2 select-none"><div class="flex w-max shrink-0" style="transform: translateX(-2.09571%);"><div class="bg-background mx-2 flex min-w-max items-center gap-3 rounded-xl border px-4 py-2 whitespace-nowrap transition-transform duration-300 hover:scale-105"><div class="flex items-center justify-center rounded-xl p-2 bg-teal-50 dark:bg-teal-950"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings text-teal-50
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.shrink-0` `.w-max`

**HTML structure:**

```html
<div class="flex w-max shrink-0" style="transform: translateX(-2.09571%);"><div class="bg-background mx-2 flex min-w-max items-center gap-3 rounded-xl border px-4 py-2 whitespace-nowrap transition-transform duration-300 hover:scale-105"><div class="flex items-center justify-center rounded-xl p-2 bg-teal-50 dark:bg-teal-950"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings text-teal-500 dark:text-teal-200 size-3" aria-hidden="true"><pa
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### Translate X 1/2

**Instances found:** 3

**CSS classes:** `.-translate-x-1/2` `.-translate-y-1/2` `.absolute` `.bg-background` `.border` `.flex`

**HTML structure:**

```html
<div class="bg-background absolute top-[50%] left-[50%] z-20 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full border px-8 py-3"><span class="text-muted-foreground text-sm">Integrations</span></div>
```

**Base styles (from design tokens):**

```css
.-translate-x-1/2 {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

