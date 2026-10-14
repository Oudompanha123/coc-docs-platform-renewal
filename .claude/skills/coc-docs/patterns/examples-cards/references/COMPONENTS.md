# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Font Medium** | unknown | 16× | `.font-medium`, `.text-foreground`, `.underline-offset-4` |
| **Group** | unknown | 10× | `.group` |
| ***:[Img:First Child]:Rounded T 4xl** | card | 10× | `.*:[img:first-child]:rounded-t-4xl`, `.*:[img:last-child]:rounded-b-4xl`, `.[--card-spacing:--spacing(6)]` |
| **Bg Muted** | unknown | 10× | `.bg-muted`, `.p-2.5`, `.rounded-2xl` |
| **Dark:Hidden** | unknown | 10× | `.dark:hidden`, `.h-full`, `.object-contain` |
| **Flex** | card | 10× | `.flex`, `.gap-3`, `.items-center` |
| **Min W 0** | unknown | 10× | `.min-w-0` |
| **Font Bold** | unknown | 9× | `.font-bold`, `.font-sans`, `.mb-4` |
| **[& A]:Block** | unknown | 9× | `.[&_a]:block`, `.[&_a]:hover:text-foreground`, `.[&_a]:hover:underline` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 7× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |
| **Flex** | card | 6× | `.flex`, `.gap-2.5`, `.items-start` |
| **[&>Svg]:Pointer Events None** | unknown | 6× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Font Semibold** | unknown | 5× | `.font-semibold`, `.text-foreground` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.text-xl` |
| **Data Open:Bg Muted/50** | unknown | 3× | `.data-open:bg-muted/50`, `.not-last:border-b` |
| **Flex** | unknown | 3× | `.flex` |
| ****:Data [Slot=Accordion Trigger Icon]:Ml Auto** | button | 3× | `.**:data-[slot=accordion-trigger-icon]:ml-auto`, `.**:data-[slot=accordion-trigger-icon]:size-4`, `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` |

## Cards

### *:[Img:First Child]:Rounded T 4xl

**Instances found:** 10

**CSS classes:** `.*:[img:first-child]:rounded-t-4xl` `.*:[img:last-child]:rounded-b-4xl` `.[--card-spacing:--spacing(6)]` `.bg-card` `.border` `.dark:ring-foreground/10`

**HTML structure:**

```html
<div data-slot="card" data-size="default" class="group/card flex flex-col rounded-4xl bg-card text-sm text-card-foreground ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl gap-0 overflow-hidden py-0 border ring-0 shadow-none group-hover:border-primary/20 transition-colors"><figure class="bg-muted w-full rounded-2xl p-2.5"><img alt="Blog card examples" loading="lazy" width="400" height="300" decoding="async" data-nimg="1" cl
```

**Base styles (from design tokens):**

```css
.*:[img:first-child]:rounded-t-4xl {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 10

**CSS classes:** `.flex` `.gap-3` `.items-center` `.justify-between` `.px-(--card-spacing)` `.py-4`

**HTML structure:**

```html
<div data-slot="card-content" class="px-(--card-spacing) flex items-center justify-between gap-3 py-4"><div class="min-w-0"><span class="font-medium">Blog Cards</span><div class="text-muted-foreground text-xs">4 examples</div></div></div>
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 6

**CSS classes:** `.flex` `.gap-2.5` `.items-start`

**HTML structure:**

```html
<li class="flex items-start gap-2.5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check text-background fill-foreground mt-0.5 size-4.5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg><span>Blog, product and social post cards</span></li>
```

**Base styles (from design tokens):**

```css
.flex {
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

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 7

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<button type="button" role="tab" aria-selected="false" aria-controls="radix-_R_4lfiv5tiiv5b_-content-all" data-state="inactive" id="radix-_R_4lfiv5tiiv5b_-trigger-all" data-slot="tabs-trigger" class="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full border border-transparent! text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 hover:text-foreground focus-visible:b
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #ff667f;
  color: #ffffff;
  border-radius: 15.2px;
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
  border-radius: 15.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

### **:Data [Slot=Accordion Trigger Icon]:Ml Auto

**Instances found:** 3

**CSS classes:** `.**:data-[slot=accordion-trigger-icon]:ml-auto` `.**:data-[slot=accordion-trigger-icon]:size-4` `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` `.border` `.border-transparent` `.disabled:opacity-50`

**HTML structure:**

```html
<button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_db5fiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground text-base" data-radix-collection-item="">Are the card examples free
```

**Base styles (from design tokens):**

```css
.**:data-[slot=accordion-trigger-icon]:ml-auto {
  background: #ff667f;
  color: #ffffff;
  border-radius: 15.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Font Medium

**Instances found:** 16

**CSS classes:** `.font-medium` `.text-foreground` `.underline-offset-4`

**HTML structure:**

```html
<a class="text-foreground font-medium hover:underline underline-offset-4" href="/examples/cards/blog">blog cards</a>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #18181b;
  padding: 4px;
}```

### Group

**Instances found:** 10

**CSS classes:** `.group`

**HTML structure:**

```html
<a class="group" href="/examples/cards/blog"><div data-slot="card" data-size="default" class="group/card flex flex-col rounded-4xl bg-card text-sm text-card-foreground ring-foreground/5 [--card-spacing:--spacing(6)] has-[&gt;img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl gap-0 overflow-hidden py-0 border ring-0 shadow-none group-hover:border-primary/20 transition-colors"><figure class="bg-muted w-full rounded-2xl p-2.5"><img alt="Blog card examples" loading="lazy" width="400" h
```

**Base styles (from design tokens):**

```css
.group {
  background: #18181b;
  padding: 4px;
}```

### Bg Muted

**Instances found:** 10

**CSS classes:** `.bg-muted` `.p-2.5` `.rounded-2xl` `.w-full`

**HTML structure:**

```html
<figure class="bg-muted w-full rounded-2xl p-2.5"><img alt="Blog card examples" loading="lazy" width="400" height="300" decoding="async" data-nimg="1" class="h-full w-full rounded-2xl object-contain dark:hidden" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fexamples%2Fcards%2Fblog.png&amp;w=640&amp;q=75 1x, /_next/image?url=%2Fimages%2Fexamples%2Fcards%2Fblog.png&amp;w=828&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fexamples%2Fcards%2Fblog.png&amp;w=828&amp;q=75"><img alt="Blog card examples dark" loading="lazy" width="400" height="300" decoding="async" data-n
```

**Base styles (from design tokens):**

```css
.bg-muted {
  background: #18181b;
  padding: 4px;
}```

### Dark:Hidden

**Instances found:** 10

**CSS classes:** `.dark:hidden` `.h-full` `.object-contain` `.rounded-2xl` `.w-full`

**HTML structure:**

```html
<img alt="Blog card examples" loading="lazy" width="400" height="300" decoding="async" data-nimg="1" class="h-full w-full rounded-2xl object-contain dark:hidden" style="color:transparent" srcset="/_next/image?url=%2Fimages%2Fexamples%2Fcards%2Fblog.png&amp;w=640&amp;q=75 1x, /_next/image?url=%2Fimages%2Fexamples%2Fcards%2Fblog.png&amp;w=828&amp;q=75 2x" src="/_next/image?url=%2Fimages%2Fexamples%2Fcards%2Fblog.png&amp;w=828&amp;q=75">
```

**Base styles (from design tokens):**

```css
.dark:hidden {
  background: #18181b;
  padding: 4px;
}```

### Min W 0

**Instances found:** 10

**CSS classes:** `.min-w-0`

**HTML structure:**

```html
<div class="min-w-0"><span class="font-medium">Blog Cards</span><div class="text-muted-foreground text-xs">4 examples</div></div>
```

**Base styles (from design tokens):**

```css
.min-w-0 {
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

### Font Semibold

**Instances found:** 5

**CSS classes:** `.font-semibold` `.text-foreground`

**HTML structure:**

```html
<span class="text-foreground font-semibold">Content cards:</span>
```

**Base styles (from design tokens):**

```css
.font-semibold {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 3

**CSS classes:** `.font-heading` `.font-semibold` `.text-xl`

**HTML structure:**

```html
<h3 class="font-heading text-xl font-semibold">What You Get With Card Examples</h3>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
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
  background: #18181b;
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
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

