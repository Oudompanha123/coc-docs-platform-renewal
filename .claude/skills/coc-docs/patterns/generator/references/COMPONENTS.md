# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Data [State=Open]:Bg Muted/80** | unknown | 11× | `.data-[state=open]:bg-muted/80`, `.data-[state=open]:px-4`, `.data-[state=open]:rounded-lg` |
| **Flex** | unknown | 11× | `.flex` |
| ****:Data [Slot=Accordion Trigger Icon]:Ml Auto** | button | 11× | `.**:data-[slot=accordion-trigger-icon]:ml-auto`, `.**:data-[slot=accordion-trigger-icon]:size-4`, `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` |
| **Absolute** | card | 5× | `.absolute`, `.bg-background`, `.flex` |
| **[& Svg:Not([Class*='Size '])]:Size 4** | button | 4× | `.[&_svg:not([class*='size-'])]:size-4`, `.[&_svg]:pointer-events-none`, `.[&_svg]:shrink-0` |

## Cards

### Absolute

**Instances found:** 5

**CSS classes:** `.absolute` `.bg-background` `.flex` `.inset-0` `.items-center` `.justify-center`

**HTML structure:**

```html
<div class="bg-background absolute inset-0 z-10 flex items-center justify-center" style="border-radius:8px"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-circle animate-spin text-muted-foreground size-6" data-slot="spinner" role="status" aria-label="Loading"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></div>
```

**Base styles (from design tokens):**

```css
.absolute {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 8px;
}```

## Buttons

### **:Data [Slot=Accordion Trigger Icon]:Ml Auto

**Instances found:** 11

**CSS classes:** `.**:data-[slot=accordion-trigger-icon]:ml-auto` `.**:data-[slot=accordion-trigger-icon]:size-4` `.**:data-[slot=accordion-trigger-icon]:text-muted-foreground` `.border` `.border-transparent` `.disabled:opacity-50`

**HTML structure:**

```html
<button type="button" aria-controls="radix-_R_4cimmltiv5b_" aria-expanded="true" data-state="open" aria-disabled="true" data-orientation="vertical" id="radix-_R_cimmltiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left text-sm font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground" data-
```

**Base styles (from design tokens):**

```css
.**:data-[slot=accordion-trigger-icon]:ml-auto {
  background: #00bcfe;
  color: #fafafa;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
}```

### [& Svg:Not([Class*='Size '])]:Size 4

**Instances found:** 4

**CSS classes:** `.[&_svg:not([class*='size-'])]:size-4` `.[&_svg]:pointer-events-none` `.[&_svg]:shrink-0` `.after:absolute` `.after:bg-foreground` `.after:opacity-0`

**HTML structure:**

```html
<button type="button" role="tab" aria-selected="true" aria-controls="radix-_R_2mltiv5b_-content-colors" data-state="closed" id="radix-_R_2mltiv5b_-trigger-colors" data-slot="tooltip-trigger" class="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full border border-transparent! px-3 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 hover:text-foreground focus-v
```

**Base styles (from design tokens):**

```css
.[&_svg:not([class*='size-'])]:size-4 {
  background: #00bcfe;
  color: #fafafa;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Other Components

### Data [State=Open]:Bg Muted/80

**Instances found:** 11

**CSS classes:** `.data-[state=open]:bg-muted/80` `.data-[state=open]:px-4` `.data-[state=open]:rounded-lg` `.data-open:bg-muted/50` `.not-last:border-b`

**HTML structure:**

```html
<div data-state="open" data-orientation="vertical" data-slot="accordion-item" class="not-last:border-b data-open:bg-muted/50 data-[state=open]:bg-muted/80 data-[state=open]:rounded-lg data-[state=open]:px-4"><h3 data-orientation="vertical" data-state="open" class="flex"><button type="button" aria-controls="radix-_R_4cimmltiv5b_" aria-expanded="true" data-state="open" aria-disabled="true" data-orientation="vertical" id="radix-_R_cimmltiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left
```

**Base styles (from design tokens):**

```css
.data-[state=open]:bg-muted/80 {
  background: #18181b;
  padding: 4px;
}```

### Flex

**Instances found:** 11

**CSS classes:** `.flex`

**HTML structure:**

```html
<h3 data-orientation="vertical" data-state="open" class="flex"><button type="button" aria-controls="radix-_R_4cimmltiv5b_" aria-expanded="true" data-state="open" aria-disabled="true" data-orientation="vertical" id="radix-_R_cimmltiv5b_" data-slot="accordion-trigger" class="group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border border-transparent p-4 text-left text-sm font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:
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
- Use `#00bcfe` for all interactive/active states

