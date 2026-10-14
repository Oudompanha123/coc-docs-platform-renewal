# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Aria Invalid:Border Destructive** | form-field | 4× | `.aria-invalid:border-destructive`, `.aria-invalid:ring-3`, `.aria-invalid:ring-destructive/20` |

## Form Fields

### Aria Invalid:Border Destructive

**Instances found:** 4

**CSS classes:** `.aria-invalid:border-destructive` `.aria-invalid:ring-3` `.aria-invalid:ring-destructive/20` `.bg-transparent` `.border` `.border-input`

**HTML structure:**

```html
<input type="text" data-slot="input" class="h-8 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:b
```

**Base styles (from design tokens):**

```css
.aria-invalid:border-destructive {
  background: #fef2f2;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#262626` for all dividers within components
- Use `#ff6568` for all interactive/active states

