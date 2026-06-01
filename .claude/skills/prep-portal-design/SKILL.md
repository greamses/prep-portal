---
name: prep-portal-design
description: Design-system reference for the Prep Portal site. Use whenever creating or editing UI — CSS/HTML/SVG, components, colours, fonts, borders, shadows, spacing, or layout — so new work matches the existing neo-brutalist look (and the separate editorial flipbook/yearbook sub-style). Trigger on any visual/styling task in this repo.
---

# Prep Portal design system

The site is **neo-brutalist**: high contrast, flat fills, bold solid ink borders,
hard offset shadows (no blur), and a small playful accent palette. There is a
second, deliberately different **editorial** style used only inside the digital
magazine / yearbook flipbook. Keep the two worlds separate.

## 1. Always use tokens — never hardcode

All design tokens live in **`utils/components/theme.css`** (`:root` = light,
`[data-theme="dark"]` = dark). Reference the variables; never re-declare colours
or invent hex/px values. New components must work in both themes.

**Palette:** `--ink` (#0a0a0a), `--bg`, `--app-bg` (#f0ece3), `--surface-primary`,
`--surface-secondary`, `--text-secondary`, `--text-tertiary`, and accents
`--accent-primary` (yellow #ffe500), `--accent-secondary` (blue #0055ff),
`--accent-danger` (red), `--accent-success` (green), `--accent-warning`.

**Borders & shadows (the neo-brutalist core):** `--border` (= `2.5px solid --ink`),
`--border-subtle`; hard offset shadows `--shadow-sm/md/lg/xl` (3/5/6/9px, **0 blur**,
ink). CTAs use `--shadow-cta`.

**Spacing / radius / motion:** `--padding-xs…xl` (clamp-based), `--gap-xs…2xl`,
radius is usually **0** (`--radius-none`; `--radius-sm` only when needed),
`--transition-base/smooth/bounce`, z-index `--z-nav` / `--z-mobile-nav`.

## 2. Type — exactly two fonts

- `--font-display` → **Unbounded** (headings, weights 700/900).
- `--font-mono` → **JetBrains Mono** (labels, meta, eyebrows, small caps; 400/600).
- `--font-serif` aliases display. **Don't add new fonts to the main site.**

## 3. Neo-brutalist conventions

- Solid `var(--border)` outlines + hard offset shadow; **never** soft/blurred shadows on main-site UI.
- Interactive lift: `:hover { transform: translate(-2px,-2px) }`, `:active { transform: translate(2px,2px) }`, and grow the shadow on hover.
- Card groups rotate a 4-colour set — `theme-yellow / theme-blue / theme-green / theme-red` (see `utils/components/nav-builder.js`).
- Default to **square corners**; only round when explicitly asked.

## 4. Editorial sub-system (flipbook / magazine / yearbook only)

A separate magazine aesthetic — **do not** bring it into the main site or vice versa.
- Fonts: **Bodoni Moda** (display) + **EB Garamond** (serif), loaded per editorial page.
- Tokens are `--fb-*` in **`home/css/flipbook.css`**; per-year accents `--yb-accent` / `--yb-accent-2`.
- Sizing uses **container-query units** (`cqw`/`cqh`) so type & spacing scale with the page; `.fb-page__inner` clips overflow (overlong copy is cut — keep content within the page).
- **Gotcha:** never put `clip-path` and `filter: drop-shadow` on the same element — `clip-path` is applied *after* the filter and eats the shadow. Split them: shadow on the parent, clip on a child (see `.yb-card--beneath` / `.yb-card__body`).

## 5. Where things live

- Tokens / base type: `utils/components/theme.css`
- Global layout & components: `home/css/main.css`
- Navigation: `utils/components/nav.css`, `nav-builder.js`, `nav-config.js`
- Editorial: `home/css/flipbook.css`, `home/js/flipbook.js`, `home/js/flipbook-assets.js`

## Do / Don't

- **Do** use tokens, match the border + hard-shadow + lift pattern, keep the two-font rule, and verify in both light and dark themes.
- **Don't** hardcode colours or blurred shadows, add default rounded corners, or mix the editorial fonts/tokens with the main site.
