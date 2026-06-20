# Prep Portal — UI Design System (single source of truth)

> This is the authoritative design prompt for the site. Read it before writing or
> editing **any** UI (HTML/CSS/SVG, a new page, a widget, a popup). When this file
> and the `prep-portal-design` skill disagree, **this file wins** — the skill text
> still describes the old neo-brutalist look and is stale.

---

## 0. The one-paragraph brief

Prep Portal is a **soft, warm, paper-and-paint** study site for kids: cream paper
surfaces, muted kid-friendly pastels, **soft blurred** shadows (not hard offsets),
mostly square corners, two display fonts plus a handwritten font for sticky notes,
and a signature **amoeba "paint blob" background** that acts as our logo motif on
**every page**. Build new UI out of the shared components, not bespoke cards.
There is a second, separate **editorial** look used *only* inside the magazine /
yearbook flipbook — never mix the two.

---

## 1. Golden rules (read these first)

1. **Use tokens, never hardcode.** Every colour, shadow, space, radius, font and
   size is a CSS variable in `utils/components/theme.css`. Reference them; do not
   invent hex/px. New UI must work in **both** light and dark themes.
2. **Reuse the shared components.** `.pp-pill`, `.pp-sticky`, `.pp-receipt`,
   `.pp-btn` live in `utils/components/components.css`. The home "doorway" is
   `.path-card` in `home/css/main.css`. Do **not** invent a new rounded soft card
   per page — that is exactly what looks off-brand.
3. **All icons are our own inline SVGs. No emoji. Ever.** Pull glyphs from
   `home/js/dashboard/icons.js` (the `I` object) or `utils/components/nav-icons.js`.
   No party/rocket/backpack/check/sparkle glyphs as accents, no icon-font/CDN libraries.
4. **Put the paint blob background on every page** (see §6). It is our logo motif.
5. **Two fonts on the main site** (plus the handwritten sticky font). Do not add
   new fonts. The editorial fonts stay inside the flipbook.
6. **Shadows are soft and blurred** (`--shadow-sm…xl`). No hard 0-blur offset
   shadows on the main site — that was the old style.

---

## 2. Where everything lives

| Concern | File |
| --- | --- |
| Tokens + base type + light/dark themes | `utils/components/theme.css` |
| Shared components (pill, sticky, receipt, button) | `utils/components/components.css` |
| Global home layout + `.path-card` receipt doorways | `home/css/main.css` |
| Navigation | `utils/components/nav.css`, `nav-builder.js`, `nav-config.js` |
| **Blob paint generator** (`heroPaint`, `paintLayer`, `paintBlob`, amoeba) | `utils/components/nav-icons.js` |
| Dashboard/UI SVG icon set (the `I` object) | `home/js/dashboard/icons.js` |
| Pre-paint loader (also `@import`s theme + components) | `utils/components/loader.js` |
| Editorial sub-system (separate world) | `home/css/flipbook.css`, `home/js/flipbook*.js` |

---

## 3. Themes & tokens

Light is `:root` / `[data-theme="light"]`; dark is `[data-theme="dark"]`. The
loader restores the saved theme before first paint (localStorage `pp-theme`).

**Palette (light):**
`--bg #faf7f1`, `--app-bg #f0ece3`, `--ink #2a2723`, `--surface-primary #fffdf8`,
`--surface-secondary #f4f0e8`, `--text-secondary #6b655c`, `--text-tertiary #9a948a`.
Accents: `--accent-primary #f4c95d` (yellow), `--accent-secondary #6fb7e8` (blue),
`--accent-success #7cc47c` (green), `--accent-danger #f07a7a` (red),
`--accent-warning #f0a868` (orange).
On a coloured fill use `--text-on-accent` for the label (it flips in dark — don't
hardcode `--ink`, which also flips).

**Sticky-note / badge pastels:** `--badge-subject-1…6-bg` (e.g. `#fff3a8`,
`#e8c8ff`, `#c8f0c0`, `#bfe3ff`, `#ffd7a3`, `#b8ece2`). Sticky notes are *paper*:
they keep a fixed light pastel + dark ink in both themes.

**Borders:** `--border` (= `2px solid --ink`), `--border-subtle`
(`1px solid rgba(42,39,35,.12)`). Square corners by default
(`--radius-none: 0`); `--radius-sm` only when a soft corner is truly wanted.

**Shadows (soft, warm, blurred):** driven by `--shadow-color` RGB triplet —
`--shadow-sm` (2px), `--shadow-md` (4px), `--shadow-lg` (9px), `--shadow-xl`
(18px); `--shadow-cta` / `--shadow-cta-hover` for the yellow key. **No 0-blur
offset shadows.**

**Spacing / radius / motion:** `--padding-xs…xl` (clamp), `--gap-xs…2xl`,
`--transition-fast/base/smooth`, `--transition-bounce`
(`0.5s cubic-bezier(.16,1,.3,1)`). Z-index: `--z-nav 200`, `--z-mobile-nav 199`.

**Type scale:** weights `--weight-regular/semibold/bold/black` (400/600/700/900);
leading `--leading-tight 1.05 … --leading-relaxed 1.7`; sizes
`--text-hero`, `--text-h1…h3`, `--text-body*`, `--text-mono-xs…xl`, `--text-stat`,
`--text-cta`. Prefer these over literal `rem`.

---

## 4. Typography — three fonts, fixed roles

- `--font-display` → **Unbounded** (700/900) — headings, titles, prices, big numbers.
- `--font-mono` → **JetBrains Mono** (400/600) — labels, eyebrows, meta, table
  headers, small-caps. Uppercase + letter-spacing for eyebrows/labels.
- **Shantell Sans** (handwritten, 600) → **only** for sticky notes / `.pp-sticky`
  / `.path-note`. Never for body copy.
- `--font-serif` aliases display. **Do not add new fonts to the main site.**

---

## 5. Components (reuse these)

All examples assume `theme.css` + `components.css` are loaded (the loader
`@import`s both; standalone pages should `<link>` them).

### Pill — `.pp-pill`
Mono uppercase chip with a tinted border. Tint via `--tile`. Status modifiers:
`.pp-pill--ok` / `--warn` / `--danger`; `.pp-pill--static` for a non-clickable tag.
```html
<span class="pp-pill pp-pill--ok pp-pill--static">Free referral code</span>
```

### Sticky note — `.pp-sticky`
Real paper: fixed pastel + dark ink, Shantell Sans, slight tilt. Colour with
`.pp-sticky--c0…c5`, tilt with `--pp-note-tilt`, add tape with `.pp-sticky--tape`.
```html
<span class="pp-sticky pp-sticky--c2 pp-sticky--tape" style="--pp-note-tilt:-3deg">Partner</span>
```

### Receipt card — `.pp-receipt` + `.pp-receipt__paper`
The torn-paper "receipt" with serrated top/bottom + side perforation rails.
**Two elements on purpose:** the wrapper carries the soft drop-shadow, the inner
`__paper` carries the mask (a `filter` under a `mask` gets clipped). Tint the
paper with `--pp-paper`.
```html
<div class="pp-receipt">
  <!-- anything that must poke OUTSIDE the torn edge (sticky tag, close button)
       goes here, as a SIBLING of __paper — the mask clips descendants -->
  <span class="pp-sticky pp-sticky--c2 pp-sticky--tape" style="position:absolute;top:-14px;left:18px">10%</span>
  <div class="pp-receipt__paper">…card content…</div>
</div>
```

### Button — `.pp-btn`
Yellow "key" CTA with the soft lift. `.pp-btn--ghost` for the secondary paper
variant. Icons go inside as inline SVG.
```html
<a class="pp-btn" href="/partner.html">Get my code <svg …></svg></a>
```

### Home doorway — `.path-card` (the original receipt)
The landing-page entry cards (`.path-card` → `.path-card__paper` + `.path-note`
sticky tag). Same receipt technique as `.pp-receipt`; rotates a 4-colour set.

### Loader
`utils/components/loader.js` injects a full-screen branded loader (with the paint
motif) before first paint and restores the theme. Pages that import it get the
blob + theme for free.

---

## 6. Signature motif — the amoeba "paint blob" background

This **is our logo** and belongs on **every page**. Seeded amoeba blobs in the
accent palette, kept low-opacity behind content. Generated by `heroPaint()` (and
friends `paintLayer`, `paintBlob`) in `utils/components/nav-icons.js`.

**Add it to a page:**
```html
<div class="xx-paint" aria-hidden="true"></div>   <!-- first child of <body> -->
```
```css
.xx-paint { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; opacity: .26; }
.xx-paint svg { width: 100%; height: 100%; display: block; }
[data-theme="dark"] .xx-paint { opacity: .15; }
.xx-wrap { position: relative; z-index: 1; }   /* content sits above the wash */
```
```js
import { heroPaint } from "/utils/components/nav-icons.js";
document.querySelector(".xx-paint").innerHTML = heroPaint();
```
On the home page the same generator already backs `.hero-paint`, `.faq-paint`,
`.paths-paint`, `.footer-paint` (filled in `home/js/hero.js`). Keep opacity in the
~0.15–0.42 range; lower it in dark.

---

## 7. The NEGATIVES — do **not** do these

- **No emoji anywhere.** Not in copy, buttons, headings, toasts or tags — not
  even a check/party/rocket glyph. Use our inline SVGs (`icons.js`, `nav-icons.js`). *(This is a
  standing, explicit user rule.)*
- **No hard 0-blur offset shadows / neo-brutalist look.** That is the old
  style. Use the soft `--shadow-*` tokens.
- **No bespoke rounded soft cards per page.** Reuse `.pp-receipt` / `.pp-pill`
  / `.pp-sticky` / `.pp-btn`. If something is missing, add it to `components.css`,
  don't fork it inline.
- **No hardcoded colours/px/hex.** Use tokens so dark mode and re-theming work.
- **No new fonts** on the main site. Three fonts only; Shantell Sans is sticky-
  notes-only.
- **No default rounded corners.** Square unless a soft corner is intended.
- **Don't drop the paint blob background.** Every page gets it.
- **Don't mix the editorial flipbook** fonts/tokens (`--fb-*`, Bodoni Moda, EB
  Garamond) into the main site, or vice-versa.
- **Don't put `clip-path` and `filter: drop-shadow` on the same element**
  (clip runs after the filter and eats the shadow) — split them onto parent/child.
- **Don't put content that overflows a masked element inside it.** Sticky tags
  / close buttons on a `.pp-receipt` must be **siblings** of `.pp-receipt__paper`,
  because a CSS `mask` clips descendants.
- **Don't ship light-only.** Verify both themes (`<html data-theme="dark">`).

---

## 8. Pre-flight checklist for any UI change

- [ ] theme.css + components.css available; tokens used (no hardcoded values)
- [ ] Built from shared components, not a one-off card
- [ ] All icons are our inline SVGs — **zero emoji**
- [ ] Paint blob background present on the page
- [ ] Soft `--shadow-*`, square corners, correct fonts
- [ ] Looks right in **light and dark**
- [ ] Masked/overflow + clip-path/drop-shadow gotchas respected
