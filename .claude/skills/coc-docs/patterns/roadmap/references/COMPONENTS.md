# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **@Container/Card Header** | card | 27× | `.@container/card-header`, `.[.border-b]:pb-(--card-spacing)`, `.auto-rows-min` |
| **Col Start 2** | unknown | 27× | `.col-start-2`, `.justify-self-end`, `.row-span-2` |
| **Leading Relaxed** | unknown | 27× | `.leading-relaxed`, `.text-muted-foreground`, `.text-sm` |
| **[&>Svg]:Pointer Events None** | unknown | 15× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-primary/80` |
| **Flex** | card | 14× | `.flex`, `.font-heading`, `.font-medium` |
| **Bg Card** | card | 13× | `.bg-card`, `.block`, `.border` |
| **Flex** | card | 13× | `.flex`, `.font-heading`, `.font-medium` |
| **Bg Card** | card | 9× | `.bg-card`, `.block`, `.border` |
| **Font Bold** | unknown | 9× | `.font-bold`, `.font-sans`, `.mb-4` |
| **[& A]:Block** | unknown | 9× | `.[&_a]:block`, `.[&_a]:hover:text-foreground`, `.[&_a]:hover:underline` |
| **[&>Svg]:Pointer Events None** | unknown | 7× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-primary/80` |
| **[&>Svg]:Pointer Events None** | unknown | 6× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Bg Card** | card | 5× | `.bg-card`, `.block`, `.border` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Bg Muted/30** | unknown | 3× | `.bg-muted/30`, `.border-b`, `.flex` |
| **[&>Svg]:Pointer Events None** | unknown | 3× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-primary/80` |

## Cards

### @Container/Card Header

**Instances found:** 27

**CSS classes:** `.@container/card-header` `.[.border-b]:pb-(--card-spacing)` `.auto-rows-min` `.gap-1.5` `.grid` `.group/card-header`

**HTML structure:**

```html
<div data-slot="card-header" class="group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-4xl has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing) h-full p-4 sm:p-6"><div data-slot="card-title" class="font-heading flex items-start gap-2 text-base font-medium"><span>Logistics Dashboard</span></div><div data-slot="card-action" class="col-start-2 row-span-2 row-start-1 self-start justify-self-end"><span data-slot="badge" data-variant="default" class="group/badge inline-flex h-5 w
```

**Base styles (from design tokens):**

```css
.@container/card-header {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 14

**CSS classes:** `.flex` `.font-heading` `.font-medium` `.gap-2` `.items-start` `.text-base`

**HTML structure:**

```html
<div data-slot="card-title" class="font-heading flex items-start gap-2 text-base font-medium"><span>Logistics Dashboard</span></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Bg Card

**Instances found:** 13

**CSS classes:** `.bg-card` `.block` `.border` `.opacity-60` `.rounded-xl` `.transition-all`

**HTML structure:**

```html
<a class="bg-card block rounded-xl border transition-all hover:bg-muted/50 opacity-60 hover:opacity-100" target="_blank" href="/dashboard/apps/kanban"><div data-slot="card-header" class="group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-4xl has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing) h-full p-4 sm:p-6"><div data-slot="card-title" class="font-heading flex items-start gap-2 text-base font-medium"><span>Kanban app</span><svg xmlns="http://www.w
```

**Base styles (from design tokens):**

```css
.bg-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 13

**CSS classes:** `.flex` `.font-heading` `.font-medium` `.gap-2` `.items-start` `.text-base`

**HTML structure:**

```html
<div data-slot="card-title" class="font-heading flex items-start gap-2 text-base font-medium"><span>Kanban app</span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-arrow-out-up-right text-muted-foreground mt-1 size-3.5 shrink-0" aria-hidden="true"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"></path><path d="m21 3-9 9"></path><path d="M15 3h6v6"></path></svg></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Bg Card

**Instances found:** 9

**CSS classes:** `.bg-card` `.block` `.border` `.rounded-xl` `.transition-all`

**HTML structure:**

```html
<div class="bg-card block rounded-xl border transition-all"><div data-slot="card-header" class="group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-4xl has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing) h-full p-4 sm:p-6"><div data-slot="card-title" class="font-heading flex items-start gap-2 text-base font-medium"><span>Logistics Dashboard</span></div><div data-slot="card-action" class="col-start-2 row-span-2 row-start-1 self-start justify-self-end"><span data-slot="badge"
```

**Base styles (from design tokens):**

```css
.bg-card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Bg Card

**Instances found:** 5

**CSS classes:** `.bg-card` `.block` `.border` `.opacity-60` `.rounded-xl` `.transition-all`

**HTML structure:**

```html
<div class="bg-card block rounded-xl border transition-all opacity-60 hover:opacity-100"><div data-slot="card-header" class="group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-4xl has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing) h-full p-4 sm:p-6"><div data-slot="card-title" class="font-heading flex items-start gap-2 text-base font-medium"><span>Upgrade to Tailwind CSS 4</span></div><div data-slot="card-action" class="col-start-2 row-span-2 row-start-1 self-start justif
```

**Base styles (from design tokens):**

```css
.bg-card {
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

### Col Start 2

**Instances found:** 27

**CSS classes:** `.col-start-2` `.justify-self-end` `.row-span-2` `.row-start-1` `.self-start`

**HTML structure:**

```html
<div data-slot="card-action" class="col-start-2 row-span-2 row-start-1 self-start justify-self-end"><span data-slot="badge" data-variant="default" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40
```

**Base styles (from design tokens):**

```css
.col-start-2 {
  background: #18181b;
  padding: 4px;
}```

### Leading Relaxed

**Instances found:** 27

**CSS classes:** `.leading-relaxed` `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<p class="text-muted-foreground text-sm leading-relaxed">An admin dashboard template for tracking shipments, fleets, warehouses and delivery performance.</p>
```

**Base styles (from design tokens):**

```css
.leading-relaxed {
  background: #18181b;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 15

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-primary/80` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20` `.bg-primary`

**HTML structure:**

```html
<span data-slot="badge" data-variant="default" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! text-primary-foreground [a]:hover:bg-prim
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
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

### [&>Svg]:Pointer Events None

**Instances found:** 7

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-primary/80` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20` `.bg-green-600`

**HTML structure:**

```html
<span data-slot="badge" data-variant="default" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! [a]:hover:bg-primary/80 bg-green-600 text
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
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

### Bg Muted/30

**Instances found:** 3

**CSS classes:** `.bg-muted/30` `.border-b` `.flex` `.font-heading` `.font-medium` `.gap-2.5`

**HTML structure:**

```html
<h2 class="bg-muted/30 font-heading flex items-center gap-2.5 border-b px-4 py-4 font-medium sm:px-6"><span aria-hidden="true" class="size-2 rounded-full bg-amber-500"></span>Being Worked On 🔥<span data-slot="badge" data-variant="secondary" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-in
```

**Base styles (from design tokens):**

```css
.bg-muted/30 {
  background: #18181b;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 3

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-primary/80` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20` `.bg-orange-500`

**HTML structure:**

```html
<span data-slot="badge" data-variant="default" class="group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! [a]:hover:bg-primary/80 bg-orange-500 tex
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

