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
| **Group Has Data [Slot=Card Title]/Card Header:@Max Md/Card:Order Last** | card | 10× | `.group-has-data-[slot=card-title]/card-header:@max-md/card:order-last`, `.group-has-data-[slot=card-title]/card-header:@max-md/card:w-full`, `.text-muted-foreground` |
| **Group/Menu Item** | card | 8× | `.group/menu-item`, `.relative` |
| **Border B** | unknown | 7× | `.border-b`, `.data-[state=selected]:bg-muted`, `.transition-colors` |
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 7× | `.[&:has([role=checkbox])]:pr-0`, `.align-middle`, `.ps-6` |
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 7× | `.[&:has([role=checkbox])]:pr-0`, `.align-middle`, `.px-2` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-2` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.gap-0` |
| **Space Y 4** | unknown | 3× | `.space-y-4` |
| ***:[Img:First Child]:Rounded T Lg** | card | 3× | `.*:[img:first-child]:rounded-t-lg`, `.*:[img:last-child]:rounded-b-lg`, `.@container/card` |
| **Bg Card** | card | 3× | `.bg-card`, `.flex-1`, `.overflow-hidden` |
| **Flex** | card | 3× | `.flex`, `.items-center`, `.justify-between` |
| **Flex** | card | 3× | `.flex`, `.items-center`, `.space-x-3` |
| **Font Bold** | unknown | 3× | `.font-bold`, `.text-2xl`, `.text-foreground` |

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

### Group Has Data [Slot=Card Title]/Card Header:@Max Md/Card:Order Last

**Instances found:** 10

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

### *:[Img:First Child]:Rounded T Lg

**Instances found:** 3

**CSS classes:** `.*:[img:first-child]:rounded-t-lg` `.*:[img:last-child]:rounded-b-lg` `.@container/card` `.[--card-spacing:--spacing(4)]` `.bg-muted/40` `.cursor-pointer`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card @container/card flex flex-col gap-1 overflow-hidden rounded-xl bg-muted/40 text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] data-[size=sm]:[--card-spacing:--spacing(3)] *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg cursor-pointer transition-shadow hover:shadow-md"><div data-slot="card-content" class="flex-1 overflow-hidden rounded-lg bg-card p-(--card-spacing) ring-1 ring-foreground/5 shadow-2xs"><div class="flex items-center justify-between"><div class="flex items-center space-x-
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-lg {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Bg Card

**Instances found:** 3

**CSS classes:** `.bg-card` `.flex-1` `.overflow-hidden` `.p-(--card-spacing)` `.ring-1` `.ring-foreground/5`

**HTML structure:**

```html
<div data-slot="card-content" class="flex-1 overflow-hidden rounded-lg bg-card p-(--card-spacing) ring-1 ring-foreground/5 shadow-2xs"><div class="flex items-center justify-between"><div class="flex items-center space-x-3"><span class="text-2xl">🇺🇸</span><div><div class="text-foreground text-2xl font-bold">1,240.30<!-- --> <!-- -->USD</div></div></div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right text-muted-foreground h-5 w-
```

**Base styles (from design tokens):**

```css
.bg-card {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.items-center` `.justify-between`

**HTML structure:**

```html
<div class="flex items-center justify-between"><div class="flex items-center space-x-3"><span class="text-2xl">🇺🇸</span><div><div class="text-foreground text-2xl font-bold">1,240.30<!-- --> <!-- -->USD</div></div></div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right text-muted-foreground h-5 w-5" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.items-center` `.space-x-3`

**HTML structure:**

```html
<div class="flex items-center space-x-3"><span class="text-2xl">🇺🇸</span><div><div class="text-foreground text-2xl font-bold">1,240.30<!-- --> <!-- -->USD</div></div></div>
```

**Base styles (from design tokens):**

```css
.flex {
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

### Border B

**Instances found:** 7

**CSS classes:** `.border-b` `.data-[state=selected]:bg-muted` `.transition-colors`

**HTML structure:**

```html
<tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 w-36 ps-6">16 Aug 2025</td><td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0"><div><div class="text-foreground font-medium">Withdrawal to JP Morgan Chase (0440)</div><div class="text-muted-foreground text-sm">Completed</div></div></td><td data-slot="table-cell" class="px-2 py-3 align-middle 
```

**Base styles (from design tokens):**

```css
.border-b {
  background: #fef2f2;
  padding: 4px;
}```

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 7

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-middle` `.ps-6` `.px-2` `.py-3` `.w-36`

**HTML structure:**

```html
<td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 w-36 ps-6">16 Aug 2025</td>
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
  background: #fef2f2;
  padding: 4px;
}```

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 7

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-middle` `.px-2` `.py-3` `.whitespace-nowrap`

**HTML structure:**

```html
<td data-slot="table-cell" class="px-2 py-3 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0"><div><div class="text-foreground font-medium">Withdrawal to JP Morgan Chase (0440)</div><div class="text-muted-foreground text-sm">Completed</div></div></td>
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
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

### Space Y 4

**Instances found:** 3

**CSS classes:** `.space-y-4`

**HTML structure:**

```html
<div class="space-y-4 lg:space-y-6"><div class="space-y-2"><h1 class="text-xl font-bold tracking-tight lg:text-2xl">Balances</h1><div class="text-muted-foreground text-sm">Total funds in all balances: 1.740,30 US…</div></div><div class="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3"><div class="space-y-4 lg:space-y-6 lg:col-span-2"><div class="space-y-4"><div data-slot="alert" role="alert" class="group/alert relative w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[&gt;svg]:grid-cols-[auto_1fr] has-[&g
```

**Base styles (from design tokens):**

```css
.space-y-4 {
  background: #fef2f2;
  padding: 4px;
}```

### Font Bold

**Instances found:** 3

**CSS classes:** `.font-bold` `.text-2xl` `.text-foreground`

**HTML structure:**

```html
<div class="text-foreground text-2xl font-bold">1,240.30<!-- --> <!-- -->USD</div>
```

**Base styles (from design tokens):**

```css
.font-bold {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#262626` for all dividers within components
- Use `#ff6568` for all interactive/active states

