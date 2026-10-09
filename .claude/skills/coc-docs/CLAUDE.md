# coc-docs Design System

This folder is the **coc-docs** design system. It is general-purpose and does not belong to any one project.

## How to use

Read `SKILL.md` in this directory for the full design system reference before writing any UI code.

Key files:
- `SKILL.md` — master design reference (read this first)
- `references/DESIGN.md` — extended tokens and component specs
- `references/ANIMATIONS.md` — motion and keyframe specs
- `references/LAYOUT.md` — grid and layout containers
- `references/COMPONENTS.md` — DOM component patterns
- `references/INTERACTIONS.md` — hover and focus states
- `tokens/` — colors, typography and spacing as JSON
- `patterns/<slug>/` — 214 references for specific kinds of pages and blocks (dashboards, apps, auth, pricing, blog, marketing and e-commerce blocks). Each has its own `SKILL.md`, `DESIGN.md`, tokens and references. Listed by group in `patterns/INDEX.md`.

When building any UI, always read SKILL.md first and match colors, fonts, spacing, and motion exactly.

When building something that matches a pattern (a dashboard, a chat app, a pricing page), also read `patterns/<slug>/SKILL.md`. Dashboard patterns use their own fonts and tokens, which differ from the root system.

