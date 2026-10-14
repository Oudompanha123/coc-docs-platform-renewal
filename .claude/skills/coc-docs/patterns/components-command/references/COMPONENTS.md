# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Group/Menu Sub Item** | card | 49× | `.group/menu-sub-item`, `.relative` |
| **Translate X Px** | unknown | 49× | `.-translate-x-px`, `.[&>span:last-child]:truncate`, `.[&>svg]:shrink-0` |
| **Flex** | card | 9× | `.flex`, `.flex-col`, `.group` |
| **Absolute** | card | 9× | `.absolute`, `.flex`, `.inset-x-0` |
| **Flex** | card | 9× | `.flex`, `.items-center`, `.justify-center` |
| **P 1** | unknown | 9× | `.p-1`, `.pb-0` |
| **Bg Input/50** | form-field | 9× | `.bg-input/50`, `.border`, `.border-transparent` |
| **Group Hover:Opacity 100** | unknown | 8× | `.group-hover:opacity-100`, `.opacity-0`, `.transition-opacity` |
| **Flex** | card | 8× | `.flex`, `.gap-2`, `.items-center` |
| **Disabled:Cursor Not Allowed** | unknown | 8× | `.disabled:cursor-not-allowed`, `.disabled:opacity-50`, `.outline-hidden` |
| **Max H 72** | unknown | 8× | `.max-h-72`, `.no-scrollbar`, `.outline-none` |
| **Border** | unknown | 7× | `.border`, `.max-w-md`, `.rounded-lg` |
| **Flex** | unknown | 5× | `.flex`, `.flex-col`, `.min-w-0` |
| **[&>Svg]:Shrink 0** | unknown | 5× | `.[&>svg]:shrink-0`, `.[&>svg]:size-4`, `.duration-200` |
| **Text Sm** | unknown | 5× | `.text-sm`, `.w-full` |
| **Border L 0** | unknown | 5× | `.border-l-0`, `.border-sidebar-border`, `.flex` |
| ****:Data [Slot=Input Group]:Bg Background** | form-field | 5× | `.**:data-[slot=input-group]:bg-background`, `.**:data-[slot=input-group]:border-border`, `.bg-popover` |
| **Relative** | list-item | 3× | `.relative` |
| **Bg Transparent** | button | 3× | `.bg-transparent`, `.data-[state=open]:bg-transparent`, `.data-open:bg-muted/50` |
| ****:[[Cmdk Group Heading]]:Font Medium** | unknown | 3× | `.**:[[cmdk-group-heading]]:font-medium`, `.**:[[cmdk-group-heading]]:px-3`, `.**:[[cmdk-group-heading]]:py-2` |

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
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 9

**CSS classes:** `.flex` `.flex-col` `.group` `.items-center` `.justify-center` `.p-4`

**HTML structure:**

```html
<div class="group relative flex flex-col items-center justify-center p-4 lg:min-h-56 lg:p-8"><div class="absolute inset-x-0 top-0 mb-4 flex items-start justify-between p-3 transition-opacity"><div class="opacity-0 transition-opacity group-hover:opacity-100"><div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="icon" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-vis
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Absolute

**Instances found:** 9

**CSS classes:** `.absolute` `.flex` `.inset-x-0` `.items-start` `.justify-between` `.mb-4`

**HTML structure:**

```html
<div class="absolute inset-x-0 top-0 mb-4 flex items-start justify-between p-3 transition-opacity"><div class="opacity-0 transition-opacity group-hover:opacity-100"><div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="icon" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disa
```

**Base styles (from design tokens):**

```css
.absolute {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 9

**CSS classes:** `.flex` `.items-center` `.justify-center` `.py-8` `.w-full`

**HTML structure:**

```html
<div class="flex w-full items-center justify-center py-8"><div class="w-full max-w-md rounded-lg border shadow-md"><div tabindex="-1" data-slot="command" class="flex size-full flex-col overflow-hidden rounded-4xl bg-popover p-1 text-popover-foreground **:data-[slot=input-group]:border-border **:data-[slot=input-group]:bg-background" cmdk-root=""><label cmdk-label="" for="radix-_R_gkluiv5tiiv5bH2_" id="radix-_R_gkluiv5tiiv5bH1_" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border-width:0"></label><div data-slot="com
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
  border: 1px solid #27272a;
  border-radius: 15.2px;
  padding: 8px;
}```

### Flex

**Instances found:** 8

**CSS classes:** `.flex` `.gap-2` `.items-center`

**HTML structure:**

```html
<div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="icon" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-d
```

**Base styles (from design tokens):**

```css
.flex {
  background: #fef2f2;
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
<button id="radix-_R_16aiv5b_-trigger-radix-_R_176aiv5b_" data-state="closed" aria-expanded="false" data-slot="navigation-menu-trigger" class="group/navigation-menu-trigger inline-flex w-max items-center justify-center rounded-3xl transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted group h-auto bg-transparent px-2.5 py-2 text-sm shadow-none hover:bg-transparent focus:bg
```

**Base styles (from design tokens):**

```css
.bg-transparent {
  background: #00a544;
  color: #000000;
  border-radius: 15.2px;
  padding: 4px 8px;
  cursor: pointer;
}```

## Form Fields

### Bg Input/50

**Instances found:** 9

**CSS classes:** `.bg-input/50` `.border` `.border-transparent` `.dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40` `.flex` `.group/input-group`

**HTML structure:**

```html
<div data-slot="input-group" role="group" class="group/input-group relative flex w-full min-w-0 items-center rounded-4xl border border-transparent transition-[color,box-shadow,background-color] outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-data-[align=block-end]:rounded-3xl has-data-[align=block-start]:rounded-3xl has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30 has-[[data-sl
```

**Base styles (from design tokens):**

```css
.bg-input/50 {
  background: #fef2f2;
  padding: 4px;
}```

### **:Data [Slot=Input Group]:Bg Background

**Instances found:** 5

**CSS classes:** `.**:data-[slot=input-group]:bg-background` `.**:data-[slot=input-group]:border-border` `.bg-popover` `.flex` `.flex-col` `.overflow-hidden`

**HTML structure:**

```html
<div tabindex="-1" data-slot="command" class="flex size-full flex-col overflow-hidden rounded-4xl bg-popover p-1 text-popover-foreground **:data-[slot=input-group]:border-border **:data-[slot=input-group]:bg-background" cmdk-root=""><label cmdk-label="" for="radix-_R_gkluiv5tiiv5bH2_" id="radix-_R_gkluiv5tiiv5bH1_" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border-width:0"></label><div data-slot="command-input-wrapper" class="p-1 pb-0"><div data-slot="input-group" role="group" class="group/input-group relative fl
```

**Base styles (from design tokens):**

```css
.**:data-[slot=input-group]:bg-background {
  background: #fef2f2;
  padding: 4px;
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

### P 1

**Instances found:** 9

**CSS classes:** `.p-1` `.pb-0`

**HTML structure:**

```html
<div data-slot="command-input-wrapper" class="p-1 pb-0"><div data-slot="input-group" role="group" class="group/input-group relative flex w-full min-w-0 items-center rounded-4xl border border-transparent transition-[color,box-shadow,background-color] outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-data-[align=block-end]:rounded-3xl has-data-[align=block-start]:rounded-3xl has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-
```

**Base styles (from design tokens):**

```css
.p-1 {
  background: #fef2f2;
  padding: 4px;
}```

### Group Hover:Opacity 100

**Instances found:** 8

**CSS classes:** `.group-hover:opacity-100` `.opacity-0` `.transition-opacity`

**HTML structure:**

```html
<div class="opacity-0 transition-opacity group-hover:opacity-100"><div class="flex items-center gap-2"><button data-slot="button" data-variant="outline" data-size="icon" class="group/button inline-flex shrink-0 items-center justify-center rounded-4xl border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/2
```

**Base styles (from design tokens):**

```css
.group-hover:opacity-100 {
  background: #fef2f2;
  padding: 4px;
}```

### Disabled:Cursor Not Allowed

**Instances found:** 8

**CSS classes:** `.disabled:cursor-not-allowed` `.disabled:opacity-50` `.outline-hidden` `.text-sm` `.w-full`

**HTML structure:**

```html
<input data-slot="command-input" class="w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50" placeholder="Search categories..." cmdk-input="" autocomplete="off" autocorrect="off" spellcheck="false" aria-autocomplete="list" role="combobox" aria-expanded="true" aria-controls="radix-_R_gkluiv5tiiv5b_" aria-labelledby="radix-_R_gkluiv5tiiv5bH1_" id="radix-_R_gkluiv5tiiv5bH2_" type="text" value="">
```

**Base styles (from design tokens):**

```css
.disabled:cursor-not-allowed {
  background: #fef2f2;
  padding: 4px;
}```

### Max H 72

**Instances found:** 8

**CSS classes:** `.max-h-72` `.no-scrollbar` `.outline-none` `.overflow-x-hidden` `.overflow-y-auto` `.scroll-py-1`

**HTML structure:**

```html
<div data-slot="command-list" class="no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none" cmdk-list="" role="listbox" tabindex="-1" aria-label="Suggestions" id="radix-_R_gkluiv5tiiv5b_" style="--cmdk-list-height: 228.0px;"><div cmdk-list-sizer=""><div data-slot="command-group" class="overflow-hidden p-1.5 text-foreground **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground" cmdk-group="" role="presentation" data-value="undefined"><div cmd
```

**Base styles (from design tokens):**

```css
.max-h-72 {
  background: #fef2f2;
  padding: 4px;
}```

### Border

**Instances found:** 7

**CSS classes:** `.border` `.max-w-md` `.rounded-lg` `.shadow-md` `.w-full`

**HTML structure:**

```html
<div class="w-full max-w-md rounded-lg border shadow-md"><div tabindex="-1" data-slot="command" class="flex size-full flex-col overflow-hidden rounded-4xl bg-popover p-1 text-popover-foreground **:data-[slot=input-group]:border-border **:data-[slot=input-group]:bg-background" cmdk-root=""><label cmdk-label="" for="radix-_R_gkluiv5tiiv5bH2_" id="radix-_R_gkluiv5tiiv5bH1_" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border-width:0"></label><div data-slot="command-input-wrapper" class="p-1 pb-0"><div data-slot="input
```

**Base styles (from design tokens):**

```css
.border {
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

### **:[[Cmdk Group Heading]]:Font Medium

**Instances found:** 3

**CSS classes:** `.**:[[cmdk-group-heading]]:font-medium` `.**:[[cmdk-group-heading]]:px-3` `.**:[[cmdk-group-heading]]:py-2` `.**:[[cmdk-group-heading]]:text-muted-foreground` `.**:[[cmdk-group-heading]]:text-xs` `.overflow-hidden`

**HTML structure:**

```html
<div data-slot="command-group" class="overflow-hidden p-1.5 text-foreground **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground" cmdk-group="" role="presentation" data-value="undefined"><div cmdk-group-items="" role="group"><div data-slot="command-item" class="group/command-item relative flex cursor-default items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium outline-hidden select-none in-data-[slot=dialog-content]:rounded-3xl data-[disabled=true]:pointer-ev
```

**Base styles (from design tokens):**

```css
.**:[[cmdk-group-heading]]:font-medium {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#27272a` for all dividers within components
- Use `#00a544` for all interactive/active states

