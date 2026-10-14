# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **[&>Span:Last Child]:Truncate** | unknown | 39× | `.[&>span:last-child]:truncate`, `.[&_svg]:shrink-0`, `.[&_svg]:size-4` |
| **Group/Menu Item** | card | 32× | `.group/menu-item`, `.relative` |
| **Group/Menu Item** | card | 13× | `.group/menu-item`, `.relative` |
| **Block** | unknown | 13× | `.block`, `.group-data-[collapsible=icon]:hidden`, `.group/collapsible` |
| **[&>Span:Last Child]:Truncate** | button | 13× | `.[&>span:last-child]:truncate`, `.[&_svg]:shrink-0`, `.[&_svg]:size-4` |
| **Group/Menu Item** | card | 8× | `.group/menu-item`, `.relative` |
| **Group Has Data [Slot=Card Title]/Card Header:@Max Md/Card:Order Last** | card | 8× | `.group-has-data-[slot=card-title]/card-header:@max-md/card:order-last`, `.group-has-data-[slot=card-title]/card-header:@max-md/card:w-full`, `.text-muted-foreground` |
| **Aspect 3/2** | unknown | 6× | `.aspect-3/2`, `.object-contain`, `.rounded-lg` |
| **Border** | unknown | 6× | `.border`, `.group-[.swiper-slide-thumb-active]:border-primary`, `.group-[.swiper-slide-thumb-active]:opacity-100!` |
| **Aspect Square** | unknown | 6× | `.aspect-square`, `.object-contain`, `.w-full` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-2` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-0` |
| **Text Muted Foreground** | unknown | 5× | `.text-muted-foreground`, `.text-sm` |
| **Swiper Slide** | unknown | 4× | `.swiper-slide` |
| **Auto Cols Max** | unknown | 4× | `.auto-cols-max`, `.bg-muted`, `.border` |
| **Flex** | unknown | 4× | `.flex`, `.flex-col`, `.gap-1` |
| **Font Semibold** | unknown | 4× | `.font-semibold`, `.text-lg` |
| **Border B** | unknown | 4× | `.border-b`, `.data-[state=selected]:bg-muted`, `.transition-colors` |

## Cards

### Group/Menu Item

**Instances found:** 32

**CSS classes:** `.group/menu-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer
```

**Base styles (from design tokens):**

```css
.group/menu-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Group/Menu Item

**Instances found:** 13

**CSS classes:** `.group/menu-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><div class="hidden group-data-[collapsible=icon]:block"><button data-slot="dropdown-menu-trigger" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sideba
```

**Base styles (from design tokens):**

```css
.group/menu-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Group/Menu Item

**Instances found:** 8

**CSS classes:** `.group/menu-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabl
```

**Base styles (from design tokens):**

```css
.group/menu-item {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Group Has Data [Slot=Card Title]/Card Header:@Max Md/Card:Order Last

**Instances found:** 8

**CSS classes:** `.group-has-data-[slot=card-title]/card-header:@max-md/card:order-last` `.group-has-data-[slot=card-title]/card-header:@max-md/card:w-full` `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<div data-slot="card-description" class="text-sm text-muted-foreground group-has-data-[slot=card-title]/card-header:@max-md/card:order-last group-has-data-[slot=card-title]/card-header:@max-md/card:w-full">You are viewing the live demo. Every dashboard you see here is included.</div>
```

**Base styles (from design tokens):**

```css
.group-has-data-[slot=card-title]/card-header:@max-md/card:order-last {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

## Buttons

### [&>Span:Last Child]:Truncate

**Instances found:** 13

**CSS classes:** `.[&>span:last-child]:truncate` `.[&_svg]:shrink-0` `.[&_svg]:size-4` `.active:bg-sidebar-accent` `.active:text-sidebar-accent-foreground` `.aria-disabled:opacity-50`

**HTML structure:**

```html
<button data-slot="collapsible-trigger" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacit
```

**Base styles (from design tokens):**

```css
.[&>span:last-child]:truncate {
  background: #ff6568;
  color: #0a1510;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### [&>Span:Last Child]:Truncate

**Instances found:** 39

**CSS classes:** `.[&>span:last-child]:truncate` `.[&_svg]:shrink-0` `.[&_svg]:size-4` `.active:bg-sidebar-accent` `.active:text-sidebar-accent-foreground` `.aria-disabled:opacity-50`

**HTML structure:**

```html
<a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:o
```

**Base styles (from design tokens):**

```css
.[&>span:last-child]:truncate {
  background: #fef2f2;
  padding: 4px;
}```

### Block

**Instances found:** 13

**CSS classes:** `.block` `.group-data-[collapsible=icon]:hidden` `.group/collapsible`

**HTML structure:**

```html
<div data-state="closed" data-slot="collapsible" class="group/collapsible block group-data-[collapsible=icon]:hidden"><button data-slot="collapsible-trigger" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-acc
```

**Base styles (from design tokens):**

```css
.block {
  background: #fef2f2;
  padding: 4px;
}```

### Aspect 3/2

**Instances found:** 6

**CSS classes:** `.aspect-3/2` `.object-contain` `.rounded-lg` `.w-full`

**HTML structure:**

```html
<img src="/images/products/01.jpeg" class="aspect-3/2 w-full rounded-lg object-contain lg:aspect-square" width="300px" height="300px" alt="coc-docs">
```

**Base styles (from design tokens):**

```css
.aspect-3/2 {
  background: #fef2f2;
  padding: 4px;
}```

### Border

**Instances found:** 6

**CSS classes:** `.border` `.group-[.swiper-slide-thumb-active]:border-primary` `.group-[.swiper-slide-thumb-active]:opacity-100!` `.opacity-70` `.overflow-hidden` `.rounded-lg`

**HTML structure:**

```html
<figure class="group-[.swiper-slide-thumb-active]:border-primary overflow-hidden rounded-lg border opacity-70 group-[.swiper-slide-thumb-active]:opacity-100!"><img class="aspect-square w-full object-contain" src="/images/products/01.jpeg" width="300" height="300" alt="coc-docs"></figure>
```

**Base styles (from design tokens):**

```css
.border {
  background: #fef2f2;
  padding: 4px;
}```

### Aspect Square

**Instances found:** 6

**CSS classes:** `.aspect-square` `.object-contain` `.w-full`

**HTML structure:**

```html
<img class="aspect-square w-full object-contain" src="/images/products/01.jpeg" width="300" height="300" alt="coc-docs">
```

**Base styles (from design tokens):**

```css
.aspect-square {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.min-w-0` `.p-2` `.relative` `.w-full`

**HTML structure:**

```html
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2"><div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0">Dashboards</div><div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### [&>Svg]:Shrink 0

**Instances found:** 5

**CSS classes:** `.[&>svg]:shrink-0` `.[&>svg]:size-4` `.duration-200` `.ease-linear` `.flex` `.focus-visible:ring-2`

**HTML structure:**

```html
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0">Dashboards</div>
```

**Base styles (from design tokens):**

```css
.[&>svg]:shrink-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.gap-2` `.text-sm` `.w-full`

**HTML structure:**

```html
<div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm flex flex-col gap-2"><ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-0"><li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-da
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.gap-0` `.min-w-0` `.w-full`

**HTML structure:**

```html
<ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-0"><li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><a target="" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### Text Muted Foreground

**Instances found:** 5

**CSS classes:** `.text-muted-foreground` `.text-sm`

**HTML structure:**

```html
<span class="text-muted-foreground text-sm">Price</span>
```

**Base styles (from design tokens):**

```css
.text-muted-foreground {
  background: #fef2f2;
  padding: 4px;
}```

### Swiper Slide

**Instances found:** 4

**CSS classes:** `.swiper-slide`

**HTML structure:**

```html
<div class="swiper-slide" data-swiper-slide-index="2" style="width: 360px; margin-right: 10px;"><img src="/images/products/03.jpeg" class="aspect-3/2 w-full rounded-lg object-contain lg:aspect-square" width="300px" height="300px" alt="coc-docs"></div>
```

**Base styles (from design tokens):**

```css
.swiper-slide {
  background: #fef2f2;
  padding: 4px;
}```

### Auto Cols Max

**Instances found:** 4

**CSS classes:** `.auto-cols-max` `.bg-muted` `.border` `.gap-4` `.grid` `.grid-flow-col`

**HTML structure:**

```html
<div class="hover:border-primary/30 bg-muted grid auto-cols-max grid-flow-col gap-4 rounded-lg border p-4"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-dollar-sign size-6 opacity-40" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg><div class="flex flex-col gap-1"><span class="text-muted-foreground text-sm">Price</span><span class="te
```

**Base styles (from design tokens):**

```css
.auto-cols-max {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.flex-col` `.gap-1`

**HTML structure:**

```html
<div class="flex flex-col gap-1"><span class="text-muted-foreground text-sm">Price</span><span class="text-lg font-semibold">$120.40</span></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### Font Semibold

**Instances found:** 4

**CSS classes:** `.font-semibold` `.text-lg`

**HTML structure:**

```html
<span class="text-lg font-semibold">$120.40</span>
```

**Base styles (from design tokens):**

```css
.font-semibold {
  background: #fef2f2;
  padding: 4px;
}```

### Border B

**Instances found:** 4

**CSS classes:** `.border-b` `.data-[state=selected]:bg-muted` `.transition-colors`

**HTML structure:**

```html
<tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 font-semibold">Category</td><td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 text-right">T-Shirt</td></tr>
```

**Base styles (from design tokens):**

```css
.border-b {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#262626` for all dividers within components
- Use `#ff6568` for all interactive/active states

