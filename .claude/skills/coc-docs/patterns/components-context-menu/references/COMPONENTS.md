# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Group/Menu Sub Item** | card | 49× | `.group/menu-sub-item`, `.relative` |
| **Translate X Px** | unknown | 49× | `.-translate-x-px`, `.[&>span:last-child]:truncate`, `.[&>svg]:shrink-0` |
| **Border B** | unknown | 18× | `.border-b`, `.data-[state=selected]:bg-muted`, `.transition-colors` |
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 17× | `.[&:has([role=checkbox])]:pr-0`, `.align-middle`, `.p-3` |
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 10× | `.[&:has([role=checkbox])]:pr-0`, `.align-top`, `.font-mono` |
| **Group** | unknown | 8× | `.group` |
| ***:[Img:First Child]:Rounded T 4xl** | card | 8× | `.*:[img:first-child]:rounded-t-4xl`, `.*:[img:last-child]:rounded-b-4xl`, `.[--card-spacing:--spacing(6)]` |
| **Bg Muted** | unknown | 8× | `.bg-muted`, `.p-2.5`, `.rounded-2xl` |
| **Dark:Hidden** | unknown | 8× | `.dark:hidden`, `.h-full`, `.object-contain` |
| **Min W 0** | unknown | 8× | `.min-w-0` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Text Sm** | unknown | 5× | `.text-sm`, `.w-full` |
| **Border L 0** | unknown | 5× | `.border-l-0`, `.border-sidebar-border`, `.flex` |
| **Flex** | card | 5× | `.flex`, `.gap-3`, `.items-center` |
| **[&:Has([Role=Checkbox])]:Pr 0** | unknown | 4× | `.[&:has([role=checkbox])]:pr-0`, `.align-middle`, `.font-medium` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Flex** | card | 3× | `.flex`, `.gap-3`, `.items-center` |
| **[&>Svg]:Pointer Events None** | unknown | 3× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |

## Cards

### Group/Menu Sub Item

**Instances found:** 49

**CSS classes:** `.group/menu-sub-item` `.relative`

**HTML structure:**

```html
<li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-acti
```

**Base styles (from design tokens):**

```css
.group/menu-sub-item {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### *:[Img:First Child]:Rounded T 4xl

**Instances found:** 8

**CSS classes:** `.*:[img:first-child]:rounded-t-4xl` `.*:[img:last-child]:rounded-b-4xl` `.[--card-spacing:--spacing(6)]` `.bg-card` `.border` `.dark:ring-foreground/10`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card flex flex-col rounded-4xl bg-card text-sm text-card-foreground ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl gap-0 overflow-hidden py-0 border ring-0 shadow-none group-hover:border-primary/20 transition-colors"><figure class="bg-muted w-full rounded-2xl p-2.5"><img alt="Team sections" loading="lazy" width="400" height="300" decoding="async" data-nimg="1" class="
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-4xl {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.gap-3` `.items-center` `.justify-between` `.px-(--card-spacing)` `.py-4`

**HTML structure:**

```html
<div data-slot="card-content" class="px-(--card-spacing) flex items-center justify-between gap-3 py-4"><div class="min-w-0"><span class="font-medium">Team Sections</span><div class="text-muted-foreground text-xs">12 blocks</div></div></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.gap-3` `.items-center` `.justify-between` `.px-(--card-spacing)` `.py-4`

**HTML structure:**

```html
<div data-slot="card-content" class="px-(--card-spacing) flex items-center justify-between gap-3 py-4"><div class="min-w-0"><span class="font-medium">Customer Reviews</span><div class="text-muted-foreground text-xs">9 blocks</div></div><span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:p
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
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
<button id="radix-_R_16aiv5b_-trigger-radix-_R_176aiv5b_" data-state="closed" aria-expanded="false" data-slot="navigation-menu-trigger" class="group/navigation-menu-trigger inline-flex w-max items-center justify-center rounded-3xl transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted group h-auto bg-transparent px-2.5 py-2 text-sm shadow-none hover:bg-transparent focus:bg
```

**Base styles (from design tokens):**

```css
.bg-transparent {
  background: #00a544;
  color: #000000;
  border-radius: 12px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Translate X Px

**Instances found:** 49

**CSS classes:** `.-translate-x-px` `.[&>span:last-child]:truncate` `.[&>svg]:shrink-0` `.[&>svg]:size-4` `.[&>svg]:text-sidebar-accent-foreground` `.active:bg-sidebar-accent`

**HTML structure:**

```html
<a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&amp;&gt;span:last-child]:truncate [&am
```

**Base styles (from design tokens):**

```css
.-translate-x-px {
  background: #fef2f2;
  padding: 4px;
}```

### Border B

**Instances found:** 18

**CSS classes:** `.border-b` `.data-[state=selected]:bg-muted` `.transition-colors`

**HTML structure:**

```html
<tr data-slot="table-row" class="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"><td data-slot="table-cell" class="p-3 whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 align-top font-mono text-xs">ContextMenu</td><td data-slot="table-cell" class="p-3 align-middle [&amp;:has([role=checkbox])]:pr-0 text-muted-foreground whitespace-normal">The root. Holds the open state and conne…</td></tr>
```

**Base styles (from design tokens):**

```css
.border-b {
  background: #fef2f2;
  padding: 4px;
}```

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 17

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-middle` `.p-3` `.text-muted-foreground` `.whitespace-normal`

**HTML structure:**

```html
<td data-slot="table-cell" class="p-3 align-middle [&amp;:has([role=checkbox])]:pr-0 text-muted-foreground whitespace-normal">The root. Holds the open state and connects the trigger to the content.</td>
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
  background: #fef2f2;
  padding: 4px;
}```

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 10

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-top` `.font-mono` `.p-3` `.text-xs` `.whitespace-nowrap`

**HTML structure:**

```html
<td data-slot="table-cell" class="p-3 whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 align-top font-mono text-xs">ContextMenu</td>
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Group

**Instances found:** 8

**CSS classes:** `.group`

**HTML structure:**

```html
<a class="group" href="/blocks/marketing/team-sections"><div data-slot="card" data-size="default" class="group/card flex flex-col rounded-4xl bg-card text-sm text-card-foreground ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl gap-0 overflow-hidden py-0 border ring-0 shadow-none group-hover:border-primary/20 transition-colors"><figure class="bg-muted w-full rounded-2xl p-2.5"><img alt="Team sections" loading="lazy" width="
```

**Base styles (from design tokens):**

```css
.group {
  background: #fef2f2;
  padding: 4px;
}```

### Bg Muted

**Instances found:** 8

**CSS classes:** `.bg-muted` `.p-2.5` `.rounded-2xl` `.w-full`

**HTML structure:**

```html
<figure class="bg-muted w-full rounded-2xl p-2.5"><img alt="Team sections" loading="lazy" width="400" height="300" decoding="async" data-nimg="1" class="h-full w-full rounded-2xl object-contain dark:hidden" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fteam-sections.png&amp;w=640&amp;q=75 1x, /_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fteam-sections.png&amp;w=828&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fteam-sections.png&amp;w=828&amp;q=75"><img alt="Team sections dark" loading="lazy" width="400" height="300" 
```

**Base styles (from design tokens):**

```css
.bg-muted {
  background: #fef2f2;
  padding: 4px;
}```

### Dark:Hidden

**Instances found:** 8

**CSS classes:** `.dark:hidden` `.h-full` `.object-contain` `.rounded-2xl` `.w-full`

**HTML structure:**

```html
<img alt="Team sections" loading="lazy" width="400" height="300" decoding="async" data-nimg="1" class="h-full w-full rounded-2xl object-contain dark:hidden" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fteam-sections.png&amp;w=640&amp;q=75 1x, /_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fteam-sections.png&amp;w=828&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fblocks%2Fmarketing%2Fteam-sections.png&amp;w=828&amp;q=75">
```

**Base styles (from design tokens):**

```css
.dark:hidden {
  background: #fef2f2;
  padding: 4px;
}```

### Min W 0

**Instances found:** 8

**CSS classes:** `.min-w-0`

**HTML structure:**

```html
<div class="min-w-0"><span class="font-medium">Team Sections</span><div class="text-muted-foreground text-xs">12 blocks</div></div>
```

**Base styles (from design tokens):**

```css
.min-w-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 5

**CSS classes:** `.flex` `.flex-col` `.min-w-0` `.p-2` `.px-4` `.relative`

**HTML structure:**

```html
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2 px-4 lg:px-0"><div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-xl px-3 font-medium ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0 text-foreground text-sm">Base</div><div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm">
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
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="flex h-8 shrink-0 items-center rounded-xl px-3 font-medium ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&amp;&gt;svg]:size-4 [&amp;&gt;svg]:shrink-0 text-foreground text-sm">Base</div>
```

**Base styles (from design tokens):**

```css
.[&>svg]:shrink-0 {
  background: #fef2f2;
  padding: 4px;
}```

### Text Sm

**Instances found:** 5

**CSS classes:** `.text-sm` `.w-full`

**HTML structure:**

```html
<div data-slot="sidebar-group-content" data-sidebar="group-content" class="w-full text-sm"><ul data-slot="sidebar-menu-sub" data-sidebar="menu-sub" class="mx-3.5 flex min-w-0 translate-x-px flex-col border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden ms-0 gap-0 border-l-0 ps-0"><li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg
```

**Base styles (from design tokens):**

```css
.text-sm {
  background: #fef2f2;
  padding: 4px;
}```

### Border L 0

**Instances found:** 5

**CSS classes:** `.border-l-0` `.border-sidebar-border` `.flex` `.flex-col` `.gap-0` `.group-data-[collapsible=icon]:hidden`

**HTML structure:**

```html
<ul data-slot="sidebar-menu-sub" data-sidebar="menu-sub" class="mx-3.5 flex min-w-0 translate-x-px flex-col border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden ms-0 gap-0 border-l-0 ps-0"><li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" class="group/menu-sub-item relative"><a class="flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar
```

**Base styles (from design tokens):**

```css
.border-l-0 {
  background: #fef2f2;
  padding: 4px;
}```

### [&:Has([Role=Checkbox])]:Pr 0

**Instances found:** 4

**CSS classes:** `.[&:has([role=checkbox])]:pr-0` `.align-middle` `.font-medium` `.h-12` `.px-3` `.text-foreground`

**HTML structure:**

```html
<th data-slot="table-head" class="h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&amp;:has([role=checkbox])]:pr-0 w-1/3">Part</th>
```

**Base styles (from design tokens):**

```css
.[&:has([role=checkbox])]:pr-0 {
  background: #fef2f2;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 3

**CSS classes:** `.[&>svg]:pointer-events-none` `.[&>svg]:size-3!` `.[a]:hover:bg-muted` `.[a]:hover:text-muted-foreground` `.aria-invalid:border-destructive` `.aria-invalid:ring-destructive/20`

**HTML structure:**

```html
<span data-slot="badge" data-variant="outline" class="group/badge inline-flex h-5 w-fit items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&amp;&gt;svg]:pointer-events-none [&amp;&gt;svg]:size-3! [a]:hover:bg-muted [a]:hover:text-muted-foreground shrink-0 border-em
```

**Base styles (from design tokens):**

```css
.[&>svg]:pointer-events-none {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#00a544` for all interactive/active states

