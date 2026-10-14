# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Font Medium** | unknown | 22× | `.font-medium`, `.text-foreground`, `.underline-offset-4` |
| **Space Y 2** | unknown | 12× | `.space-y-2` |
| ***:[Img:First Child]:Rounded T 4xl** | card | 12× | `.*:[img:first-child]:rounded-t-4xl`, `.*:[img:last-child]:rounded-b-4xl`, `.[--card-spacing:--spacing(6)]` |
| **Aspect Video** | card | 12× | `.aspect-video`, `.flex`, `.items-center` |
| **Space Y 1** | unknown | 12× | `.space-y-1` |
| **Flex** | card | 11× | `.flex`, `.gap-2`, `.items-center` |
| **Font Medium** | unknown | 10× | `.font-medium`, `.font-sans` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | unknown | 6× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Flex** | card | 6× | `.flex`, `.gap-2.5`, `.items-start` |
| **Font Semibold** | unknown | 5× | `.font-semibold`, `.text-foreground` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Flex** | card | 3× | `.flex`, `.gap-1`, `.h-6` |
| **Bg Background** | card | 3× | `.bg-background`, `.flex`, `.gap-2` |
| **Bg Background** | card | 3× | `.bg-background`, `.items-center`, `.rounded-md` |
| **Flex** | unknown | 3× | `.flex`, `.flex-col`, `.gap-3` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.text-xl` |
| **Data Open:Bg Muted/50** | unknown | 3× | `.data-open:bg-muted/50`, `.not-last:border-b` |
| **Flex** | unknown | 3× | `.flex` |
| ****:Data [Slot=Accordion Trigger Icon]:Ml Auto** | button | 3× | `.**:data-[slot=accordion-trigger-icon]:ml-auto`, `.**:data-[slot=accordion-trigger-icon]:size-4`, `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` |

## Cards

### *:[Img:First Child]:Rounded T 4xl

**Instances found:** 12

**CSS classes:** `.*:[img:first-child]:rounded-t-4xl` `.*:[img:last-child]:rounded-b-4xl` `.[--card-spacing:--spacing(6)]` `.bg-muted` `.dark:ring-foreground/10` `.data-[size=sm]:[--card-spacing:--spacing(4)]`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl bg-muted shadow-none"><div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div class="bg-background w-40 items-center space-y-3 rounded-md p-3 sh
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-4xl {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### Aspect Video

**Instances found:** 12

**CSS classes:** `.aspect-video` `.flex` `.items-center` `.justify-center` `.px-(--card-spacing)` `.relative`

**HTML structure:**

```html
<div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div class="bg-background w-40 items-center space-y-3 rounded-md p-3 shadow/5"><div class="flex items-center justify-between"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left text-muted-foreground size-3 rounded-full" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg><span class="block h-2 w-3/12 rounded-full bg-
```

**Base styles (from design tokens):**

```css
.aspect-video {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### Flex

**Instances found:** 11

**CSS classes:** `.flex` `.gap-2` `.items-center` `.justify-between`

**HTML structure:**

```html
<div class="flex items-center justify-between gap-2"><h4 class="font-sans font-medium">Calendar</h4></div>
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

**Instances found:** 6

**CSS classes:** `.flex` `.gap-2.5` `.items-start`

**HTML structure:**

```html
<li class="flex items-start gap-2.5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check text-background fill-foreground mt-0.5 size-4.5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg><span>Inputs, textareas and fields</span></li>
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

**CSS classes:** `.flex` `.gap-1` `.h-6` `.items-center` `.justify-start` `.w-48`

**HTML structure:**

```html
<div class="flex h-6 w-48 items-center justify-start gap-1"><button type="button" role="checkbox" aria-checked="true" data-state="checked" value="on" data-slot="checkbox" class="peer relative flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-transparent bg-input/90 transition-shadow outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
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
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 12px;
  padding: 8px;
}```

### Bg Background

**Instances found:** 3

**CSS classes:** `.bg-background` `.items-center` `.rounded-md` `.shadow/5`

**HTML structure:**

```html
<div class="bg-background items-center rounded-md shadow/5"><div class="flex flex-col gap-3 p-3"><div class="bg-muted block h-2 w-10/12 rounded-full"></div><div class="bg-muted block h-2 w-7/12 rounded-full"></div><div class="bg-muted block h-2 w-10/12 rounded-full"></div><div class="bg-muted block h-2 w-7/12 rounded-full"></div></div></div>
```

**Base styles (from design tokens):**

```css
.bg-background {
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

### **:Data [Slot=Accordion Trigger Icon]:Ml Auto

**Instances found:** 3

**CSS classes:** `.**:data-[slot=accordion-trigger-icon]:ml-auto` `.**:data-[slot=accordion-trigger-icon]:size-4` `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` `.border` `.border-transparent` `.disabled:opacity-50`

**HTML structure:**

```html
<button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_db5fiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground text-base" data-radix-collection-item="">Do the form components wor
```

**Base styles (from design tokens):**

```css
.**:data-[slot=accordion-trigger-icon]:ml-auto {
  background: #00a544;
  color: #000000;
  border-radius: 12px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Font Medium

**Instances found:** 22

**CSS classes:** `.font-medium` `.text-foreground` `.underline-offset-4`

**HTML structure:**

```html
<a class="text-foreground font-medium hover:underline underline-offset-4" href="/components/input">inputs</a>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #fef2f2;
  padding: 4px;
}```

### Space Y 2

**Instances found:** 12

**CSS classes:** `.space-y-2`

**HTML structure:**

```html
<a class="space-y-2 hover:opacity-70" href="/components/calendar"><div data-slot="card" data-size="default" class="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-4xl py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl bg-muted shadow-none"><div data-slot="card-content" class="px-(--card-spacing) relative flex aspect-video items-center justify-center"><div 
```

**Base styles (from design tokens):**

```css
.space-y-2 {
  background: #fef2f2;
  padding: 4px;
}```

### Space Y 1

**Instances found:** 12

**CSS classes:** `.space-y-1`

**HTML structure:**

```html
<div class="space-y-1"><div class="flex items-center justify-between gap-2"><h4 class="font-sans font-medium">Calendar</h4></div><p class="text-muted-foreground text-xs">15<!-- --> variants</p></div>
```

**Base styles (from design tokens):**

```css
.space-y-1 {
  background: #fef2f2;
  padding: 4px;
}```

### Font Medium

**Instances found:** 10

**CSS classes:** `.font-medium` `.font-sans`

**HTML structure:**

```html
<h4 class="font-sans font-medium">Calendar</h4>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #fef2f2;
  padding: 4px;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 6

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<a type="button" role="tab" aria-selected="false" aria-controls="radix-_R_4lfiv5tiiv5b_-content-all" data-state="inactive" id="radix-_R_4lfiv5tiiv5b_-trigger-all" data-slot="tabs-trigger" class="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full border border-transparent! text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 hover:text-foreground focus-visible:border
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #fef2f2;
  padding: 4px;
}```

### Font Semibold

**Instances found:** 5

**CSS classes:** `.font-semibold` `.text-foreground`

**HTML structure:**

```html
<span class="text-foreground font-semibold">Text entry:</span>
```

**Base styles (from design tokens):**

```css
.font-semibold {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex` `.flex-col` `.gap-3` `.p-3`

**HTML structure:**

```html
<div class="flex flex-col gap-3 p-3"><div class="bg-muted block h-2 w-10/12 rounded-full"></div><div class="bg-muted block h-2 w-7/12 rounded-full"></div><div class="bg-muted block h-2 w-10/12 rounded-full"></div><div class="bg-muted block h-2 w-7/12 rounded-full"></div></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

### Font Heading

**Instances found:** 3

**CSS classes:** `.font-heading` `.font-semibold` `.text-xl`

**HTML structure:**

```html
<h3 class="font-heading text-xl font-semibold">What You Get With Form Components</h3>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #fef2f2;
  padding: 4px;
}```

### Data Open:Bg Muted/50

**Instances found:** 3

**CSS classes:** `.data-open:bg-muted/50` `.not-last:border-b`

**HTML structure:**

```html
<div data-state="closed" data-orientation="vertical" data-slot="accordion-item" class="not-last:border-b data-open:bg-muted/50"><h3 data-orientation="vertical" data-state="closed" class="flex"><button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_db5fiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-t
```

**Base styles (from design tokens):**

```css
.data-open:bg-muted/50 {
  background: #fef2f2;
  padding: 4px;
}```

### Flex

**Instances found:** 3

**CSS classes:** `.flex`

**HTML structure:**

```html
<h3 data-orientation="vertical" data-state="closed" class="flex"><button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_db5fiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground te
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#00a544` for all interactive/active states

