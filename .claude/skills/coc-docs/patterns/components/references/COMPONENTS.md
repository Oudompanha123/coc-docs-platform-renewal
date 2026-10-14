# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Space Y 2** | unknown | 49× | `.space-y-2` |
| ***:[Img:First Child]:Rounded T 4xl** | card | 49× | `.*:[img:first-child]:rounded-t-4xl`, `.*:[img:last-child]:rounded-b-4xl`, `.[--card-spacing:--spacing(6)]` |
| **Space Y 1** | unknown | 49× | `.space-y-1` |
| **Flex** | card | 48× | `.flex`, `.gap-2`, `.items-center` |
| **Aspect Video** | card | 47× | `.aspect-video`, `.flex`, `.items-center` |
| **Font Medium** | unknown | 40× | `.font-medium`, `.font-sans` |
| **Bg Background** | card | 13× | `.bg-background`, `.items-center`, `.rounded-md` |
| **[&>Svg]:Pointer Events None** | unknown | 10× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Flex** | unknown | 9× | `.flex`, `.flex-col`, `.gap-3` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 6× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Bg Background** | card | 6× | `.bg-background`, `.gap-2`, `.inline-flex` |
| **Flex** | card | 4× | `.flex`, `.gap-2`, `.items-center` |
| **Bg Background** | card | 4× | `.bg-background`, `.h-7`, `.items-center` |
| **Grow** | unknown | 4× | `.grow`, `.space-y-2` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Bg Background** | card | 3× | `.bg-background`, `.items-center`, `.p-3` |
| **Flex** | card | 3× | `.flex`, `.gap-1`, `.h-6` |
| **Items Center** | card | 3× | `.items-center`, `.space-y-2`, `.w-32` |
| **Bg Background** | card | 3× | `.bg-background`, `.flex`, `.gap-2` |

## Cards

### *:[Img:First Child]:Rounded T 4xl

**Instances found:** 49

**CSS classes:** `.*:[img:first-child]:rounded-t-4xl` `.*:[img:last-child]:rounded-b-4xl` `.[--card-spacing:--spacing(6)]` `.bg-muted` `.dark:ring-foreground/10` `.data-[size=sm]:[--card-spacing:--spacing(4)]`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl bg-muted shadow-none"><div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div class="bg-background w-48 items-center rounded-md shadow/5"><div c
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-4xl {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 48

**CSS classes:** `.flex` `.gap-2` `.items-center` `.justify-between`

**HTML structure:**

```html
<div class="flex items-center justify-between gap-2"><h4 class="font-sans font-medium">Accordion</h4></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Aspect Video

**Instances found:** 47

**CSS classes:** `.aspect-video` `.flex` `.items-center` `.justify-center` `.px-(--card-spacing)` `.relative`

**HTML structure:**

```html
<div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div class="bg-background w-48 items-center rounded-md shadow/5"><div class="flex items-center gap-2 p-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down text-muted-foreground size-3" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg><div class="block h-2 w-7/12 rounded-full bg-black/10 dark:bg-white/10"></div></d
```

**Base styles (from design tokens):**

```css
.aspect-video {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Bg Background

**Instances found:** 13

**CSS classes:** `.bg-background` `.items-center` `.rounded-md` `.shadow/5` `.w-48`

**HTML structure:**

```html
<div class="bg-background w-48 items-center rounded-md shadow/5"><div class="flex items-center gap-3 p-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert text-muted-foreground size-3" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><div class="block h-2 w-7/12 rounded-full bg-black/10 dark:bg-white/10"></div><
```

**Base styles (from design tokens):**

```css
.bg-background {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Bg Background

**Instances found:** 6

**CSS classes:** `.bg-background` `.gap-2` `.inline-flex` `.items-center` `.justify-between` `.p-2`

**HTML structure:**

```html
<div class="bg-background inline-flex items-center justify-between gap-2 rounded-md p-2 shadow/5"><div class="block h-2 w-8 rounded-full bg-black/10 dark:bg-white/10"></div></div>
```

**Base styles (from design tokens):**

```css
.bg-background {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex` `.gap-2` `.items-center` `.p-3`

**HTML structure:**

```html
<div class="flex items-center gap-2 p-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down text-muted-foreground size-3" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg><div class="block h-2 w-7/12 rounded-full bg-black/10 dark:bg-white/10"></div></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Bg Background

**Instances found:** 4

**CSS classes:** `.bg-background` `.h-7` `.items-center` `.rounded-md` `.shadow/5`

**HTML structure:**

```html
<div class="bg-background h-7 items-center rounded-md shadow/5"></div>
```

**Base styles (from design tokens):**

```css
.bg-background {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Bg Background

**Instances found:** 3

**CSS classes:** `.bg-background` `.items-center` `.p-3` `.rounded-md` `.shadow/5` `.space-y-3`

**HTML structure:**

```html
<div class="bg-background w-40 items-center space-y-3 rounded-md p-3 shadow/5"><div class="flex items-center justify-between"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left text-muted-foreground size-3 rounded-full" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg><span class="block h-2 w-3/12 rounded-full bg-black/10 dark:bg-white/10"></span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 
```

**Base styles (from design tokens):**

```css
.bg-background {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.gap-1` `.h-6` `.items-center` `.justify-start` `.w-48`

**HTML structure:**

```html
<div class="flex h-6 w-48 items-center justify-start gap-1"><button type="button" role="checkbox" aria-checked="true" data-state="checked" value="on" data-slot="checkbox" class="peer relative flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-transparent bg-input/90 transition-shadow outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Items Center

**Instances found:** 3

**CSS classes:** `.items-center` `.space-y-2` `.w-32`

**HTML structure:**

```html
<div class="w-32 items-center space-y-2"><div class="bg-background flex items-center justify-between gap-2 rounded-md p-2 shadow/5"><div class="block h-2 w-5/12 rounded-full bg-black/10 dark:bg-white/10"></div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down text-muted-foreground size-3" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></div><div class="bg-background items-center rounded-md shadow/5"><div class="flex flex-co
```

**Base styles (from design tokens):**

```css
.items-center {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 11.2px;
  padding: 8px;
}```

### Bg Background

**Instances found:** 3

**CSS classes:** `.bg-background` `.flex` `.gap-2` `.items-center` `.justify-between` `.p-2`

**HTML structure:**

```html
<div class="bg-background flex items-center justify-between gap-2 rounded-md p-2 shadow/5"><div class="block h-2 w-5/12 rounded-full bg-black/10 dark:bg-white/10"></div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down text-muted-foreground size-3" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></div>
```

**Base styles (from design tokens):**

```css
.bg-background {
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
  border-radius: 11.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Space Y 2

**Instances found:** 49

**CSS classes:** `.space-y-2`

**HTML structure:**

```html
<a class="space-y-2 hover:opacity-70" href="/components/accordion"><div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl bg-muted shadow-none"><div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div
```

**Base styles (from design tokens):**

```css
.space-y-2 {
  background: #18181b;
  padding: 4px;
}```

### Space Y 1

**Instances found:** 49

**CSS classes:** `.space-y-1`

**HTML structure:**

```html
<div class="space-y-1"><div class="flex items-center justify-between gap-2"><h4 class="font-sans font-medium">Accordion</h4></div><p class="text-muted-foreground text-xs">12<!-- --> variants</p></div>
```

**Base styles (from design tokens):**

```css
.space-y-1 {
  background: #18181b;
  padding: 4px;
}```

### Font Medium

**Instances found:** 40

**CSS classes:** `.font-medium` `.font-sans`

**HTML structure:**

```html
<h4 class="font-sans font-medium">Accordion</h4>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #18181b;
  padding: 4px;
}```

### [&>Svg]:Pointer Events None

**Instances found:** 10

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

**Instances found:** 9

**CSS classes:** `.flex` `.flex-col` `.gap-3` `.p-3`

**HTML structure:**

```html
<div class="flex flex-col gap-3 p-3"><div class="bg-muted block h-2 w-10/12 rounded-full"></div><div class="bg-muted block h-2 w-7/12 rounded-full"></div><div class="bg-muted block h-2 w-10/12 rounded-full"></div><div class="bg-muted block h-2 w-7/12 rounded-full"></div></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 6

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<a type="button" role="tab" aria-selected="true" aria-controls="radix-_R_9av5tiiv5b_-content-all" data-state="active" id="radix-_R_9av5tiiv5b_-trigger-all" data-slot="tabs-trigger" class="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full border border-transparent! text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 hover:text-foreground focus-visible:border-ring f
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #18181b;
  padding: 4px;
}```

### Grow

**Instances found:** 4

**CSS classes:** `.grow` `.space-y-2`

**HTML structure:**

```html
<div class="grow space-y-2"><div class="block h-2 w-10/12 rounded-full bg-black/10 dark:bg-white/10"></div><div class="bg-muted block h-2 w-7/12 rounded-full"></div></div>
```

**Base styles (from design tokens):**

```css
.grow {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

