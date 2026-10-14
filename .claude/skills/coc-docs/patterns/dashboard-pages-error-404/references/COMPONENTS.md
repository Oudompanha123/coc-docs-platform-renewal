# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Border 1** | unknown | 100× | `.border-1`, `.border-primary/30` |

## Other Components

### Border 1

**Instances found:** 100

**CSS classes:** `.border-1` `.border-primary/30`

**HTML structure:**

```html
<div class="border-primary/30 border-1" style="opacity:0.5780813477641739"></div>
```

**Base styles (from design tokens):**

```css
.border-1 {
  background: #000000;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#262626` for all dividers within components
- Use `#ff667f` for all interactive/active states

