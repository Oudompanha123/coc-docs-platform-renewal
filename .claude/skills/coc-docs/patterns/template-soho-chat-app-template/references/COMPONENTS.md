# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **[&>Svg]:Pointer Events None** | unknown | 13× | `.[&>svg]:pointer-events-none`, `.[&>svg]:size-3!`, `.[a]:hover:bg-muted` |
| **Flex** | card | 9× | `.flex`, `.gap-3`, `.items-start` |
| **Text Muted Foreground** | unknown | 9× | `.text-muted-foreground` |
| **Font Semibold** | unknown | 9× | `.font-semibold`, `.text-foreground` |
| **Font Bold** | unknown | 9× | `.font-bold`, `.font-sans`, `.mb-4` |
| **[& A]:Block** | unknown | 9× | `.[&_a]:block`, `.[&_a]:hover:text-foreground`, `.[&_a]:hover:underline` |
| **Border** | unknown | 8× | `.border`, `.p-1`, `.rounded-xl` |
| **[& [Data Rmiz Btn Unzoom]]:Absolute** | button | 8× | `.[&_[data-rmiz-btn-unzoom]]:absolute`, `.[&_[data-rmiz-btn-unzoom]]:appearance-none`, `.[&_[data-rmiz-btn-unzoom]]:bg-foreground/70` |
| **Object Cover** | unknown | 8× | `.object-cover`, `.object-top`, `.rounded-lg` |
| **Flex** | card | 7× | `.flex`, `.gap-4`, `.items-center` |
| **Text Muted Foreground** | unknown | 6× | `.text-muted-foreground` |
| **Font Medium** | unknown | 6× | `.font-medium`, `.text-end` |
| **Data Open:Bg Muted/50** | unknown | 4× | `.data-open:bg-muted/50`, `.not-last:border-b` |
| **Flex** | unknown | 4× | `.flex` |
| ****:Data [Slot=Accordion Trigger Icon]:Ml Auto** | button | 4× | `.**:data-[slot=accordion-trigger-icon]:ml-auto`, `.**:data-[slot=accordion-trigger-icon]:size-4`, `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| **Font Heading** | unknown | 3× | `.font-heading`, `.font-semibold`, `.text-2xl` |
| **Flex** | card | 3× | `.flex`, `.gap-3`, `.items-center` |

## Cards

### Flex

**Instances found:** 9

**CSS classes:** `.flex` `.gap-3` `.items-start`

**HTML structure:**

```html
<li class="flex items-start gap-3"><span class="bg-muted mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check size-3.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg></span><p class="text-muted-foreground"><span class="text-foreground font-semibold">Complete chat interface.</span> <!-- -->Chat lists, conversation views and message states that feel like a
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

**Instances found:** 7

**CSS classes:** `.flex` `.gap-4` `.items-center` `.justify-between`

**HTML structure:**

```html
<div class="flex items-center justify-between gap-4"><dt class="text-muted-foreground">Version</dt><dd class="text-end font-medium">2.0.0</dd></div>
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

**Instances found:** 3

**CSS classes:** `.flex` `.gap-3` `.items-center`

**HTML structure:**

```html
<li class="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles size-4 shrink-0 opacity-70" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22
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

### [& [Data Rmiz Btn Unzoom]]:Absolute

**Instances found:** 8

**CSS classes:** `.[&_[data-rmiz-btn-unzoom]]:absolute` `.[&_[data-rmiz-btn-unzoom]]:appearance-none` `.[&_[data-rmiz-btn-unzoom]]:bg-foreground/70` `.[&_[data-rmiz-btn-unzoom]]:border-none` `.[&_[data-rmiz-btn-unzoom]]:bottom-auto` `.[&_[data-rmiz-btn-unzoom]]:cursor-zoom-out`

**HTML structure:**

```html
<div class="relative [&amp;_[data-rmiz-ghost]]:pointer-events-none [&amp;_[data-rmiz-ghost]]:absolute [&amp;_[data-rmiz-btn-zoom]]:m-0 [&amp;_[data-rmiz-btn-zoom]]:size-10 [&amp;_[data-rmiz-btn-zoom]]:touch-manipulation [&amp;_[data-rmiz-btn-zoom]]:appearance-none [&amp;_[data-rmiz-btn-zoom]]:rounded-[50%] [&amp;_[data-rmiz-btn-zoom]]:border-none [&amp;_[data-rmiz-btn-zoom]]:bg-foreground/70 [&amp;_[data-rmiz-btn-zoom]]:p-2 [&amp;_[data-rmiz-btn-zoom]]:text-background [&amp;_[data-rmiz-btn-zoom]]:outline-offset-2 [&amp;_[data-rmiz-btn-unzoom]]:m-0 [&amp;_[data-rmiz-btn-unzoom]]:size-10 [&amp;_
```

**Base styles (from design tokens):**

```css
.[&_[data-rmiz-btn-unzoom]]:absolute {
  background: #ff667f;
  color: #ffffff;
  border-radius: 15.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

### **:Data [Slot=Accordion Trigger Icon]:Ml Auto

**Instances found:** 4

**CSS classes:** `.**:data-[slot=accordion-trigger-icon]:ml-auto` `.**:data-[slot=accordion-trigger-icon]:size-4` `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` `.border` `.border-transparent` `.disabled:opacity-50`

**HTML structure:**

```html
<button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_1lclfiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground text-base" data-radix-collection-item="">What do I get when I buy 
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

### [&>Svg]:Pointer Events None

**Instances found:** 13

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

### Text Muted Foreground

**Instances found:** 9

**CSS classes:** `.text-muted-foreground`

**HTML structure:**

```html
<p class="text-muted-foreground"><span class="text-foreground font-semibold">Complete chat interface.</span> <!-- -->Chat lists, conversation views and message states that feel like a real product from day one.</p>
```

**Base styles (from design tokens):**

```css
.text-muted-foreground {
  background: #18181b;
  padding: 4px;
}```

### Font Semibold

**Instances found:** 9

**CSS classes:** `.font-semibold` `.text-foreground`

**HTML structure:**

```html
<span class="text-foreground font-semibold">Complete chat interface.</span>
```

**Base styles (from design tokens):**

```css
.font-semibold {
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

### Border

**Instances found:** 8

**CSS classes:** `.border` `.p-1` `.rounded-xl` `.transition-colors`

**HTML structure:**

```html
<figure class="hover:bg-muted/50 rounded-xl border p-1 transition-colors"><div class="relative [&amp;_[data-rmiz-ghost]]:pointer-events-none [&amp;_[data-rmiz-ghost]]:absolute [&amp;_[data-rmiz-btn-zoom]]:m-0 [&amp;_[data-rmiz-btn-zoom]]:size-10 [&amp;_[data-rmiz-btn-zoom]]:touch-manipulation [&amp;_[data-rmiz-btn-zoom]]:appearance-none [&amp;_[data-rmiz-btn-zoom]]:rounded-[50%] [&amp;_[data-rmiz-btn-zoom]]:border-none [&amp;_[data-rmiz-btn-zoom]]:bg-foreground/70 [&amp;_[data-rmiz-btn-zoom]]:p-2 [&amp;_[data-rmiz-btn-zoom]]:text-background [&amp;_[data-rmiz-btn-zoom]]:outline-offset-2 [&amp;_
```

**Base styles (from design tokens):**

```css
.border {
  background: #18181b;
  padding: 4px;
}```

### Object Cover

**Instances found:** 8

**CSS classes:** `.object-cover` `.object-top` `.rounded-lg` `.w-full`

**HTML structure:**

```html
<img class="w-full rounded-lg object-cover object-top" src="/images/templates/soho/01.png" alt="chat list and messages">
```

**Base styles (from design tokens):**

```css
.object-cover {
  background: #18181b;
  padding: 4px;
}```

### Text Muted Foreground

**Instances found:** 6

**CSS classes:** `.text-muted-foreground`

**HTML structure:**

```html
<dt class="text-muted-foreground">Version</dt>
```

**Base styles (from design tokens):**

```css
.text-muted-foreground {
  background: #18181b;
  padding: 4px;
}```

### Font Medium

**Instances found:** 6

**CSS classes:** `.font-medium` `.text-end`

**HTML structure:**

```html
<dd class="text-end font-medium">Next.js (App Router)</dd>
```

**Base styles (from design tokens):**

```css
.font-medium {
  background: #18181b;
  padding: 4px;
}```

### Data Open:Bg Muted/50

**Instances found:** 4

**CSS classes:** `.data-open:bg-muted/50` `.not-last:border-b`

**HTML structure:**

```html
<div data-state="closed" data-orientation="vertical" data-slot="accordion-item" class="not-last:border-b data-open:bg-muted/50"><h3 data-orientation="vertical" data-state="closed" class="flex"><button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_1lclfiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-
```

**Base styles (from design tokens):**

```css
.data-open:bg-muted/50 {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 4

**CSS classes:** `.flex`

**HTML structure:**

```html
<h3 data-orientation="vertical" data-state="closed" class="flex"><button type="button" aria-expanded="false" data-state="closed" data-orientation="vertical" id="radix-_R_1lclfiv5tiiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground t
```

**Base styles (from design tokens):**

```css
.flex {
  background: #18181b;
  padding: 4px;
}```

### Font Heading

**Instances found:** 3

**CSS classes:** `.font-heading` `.font-semibold` `.text-2xl`

**HTML structure:**

```html
<h2 class="font-heading text-2xl font-semibold lg:text-3xl">What is included</h2>
```

**Base styles (from design tokens):**

```css
.font-heading {
  background: #18181b;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#ff667f` for all interactive/active states

