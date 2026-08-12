/* ═══════════════════════════════════════════════════════
   TOOLTIPS ON TEXT INSIDE A TEXTAREA.

   Everything this page says about a specific piece of writing — "that
   sentence is four words", "here are three better words than 'walked'" — is
   about a RANGE OF CHARACTERS, and it should be said next to those
   characters. A message in a panel underneath makes the reader find the thing
   it is about; a tooltip points at it.

   The obstacle is that a <textarea> has no selection geometry. There is no
   Range, no getClientRects, nothing to anchor to — the browser will tell you
   the character offsets and nothing else about where they are on screen.

   THE MIRROR. So we build one: an off-screen div carrying the textarea's own
   font, line-height, letter-spacing, padding and content width, filled with
   the same text, with a <span> wrapped round the characters in question. The
   span HAS geometry, and because every property that affects line breaking
   was copied, it breaks in exactly the same places the textarea does. Add the
   textarea's own position, subtract its scroll, and you have where those
   characters are.

   Two details that are the difference between this working and nearly
   working:

   • The mirror is sized to el.clientWidth MINUS its horizontal padding, with
     its own padding and border zeroed, and the padding/border are added back
     as an offset afterwards. Copying `width` wholesale instead looks right
     until a scrollbar appears, at which point every line wraps one word early
     and the tooltip drifts further down the page the further you read.

   • The mirror needs `white-space: pre-wrap` and the same `overflow-wrap`, or
     runs of spaces collapse and long words break differently.

   Positions are viewport coordinates and the tooltip is position:fixed, so it
   follows the modal's scrolling — which it must, since the sheet scrolls
   inside a dialog rather than with the page.
═══════════════════════════════════════════════════════ */

/* Everything that can change where a line breaks or how tall it is. Miss one
   and the mirror wraps differently from the field it is mirroring. */
const MIRROR_PROPS = [
  'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust',
  'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent',
  'letterSpacing', 'wordSpacing', 'tabSize', 'wordBreak', 'overflowWrap',
];

const mirrors = new WeakMap();

function mirrorFor(el) {
  let m = mirrors.get(el);
  if (!m) {
    m = document.createElement('div');
    m.setAttribute('aria-hidden', 'true');
    document.body.appendChild(m);
    mirrors.set(el, m);
  }
  const cs = getComputedStyle(el);
  MIRROR_PROPS.forEach((p) => { m.style[p] = cs[p]; });
  m.style.position = 'absolute';
  m.style.top = '0';
  m.style.left = '-9999px';
  m.style.visibility = 'hidden';
  m.style.pointerEvents = 'none';
  m.style.whiteSpace = 'pre-wrap';
  m.style.overflowWrap = cs.overflowWrap === 'normal' ? 'break-word' : cs.overflowWrap;
  m.style.boxSizing = 'content-box';
  m.style.padding = '0';
  m.style.border = '0';
  m.style.margin = '0';
  // The CONTENT width: clientWidth already excludes the border and any
  // scrollbar, so only the padding has to come off.
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  m.style.width = `${Math.max(0, el.clientWidth - padL - padR)}px`;
  return m;
}

/* Where characters [start, end) actually are, in viewport coordinates.
   Returns null when the range is scrolled out of sight of the field, so a
   caller can hide rather than point at something nobody can see. */
export function rangeRect(el, start, end) {
  if (!el || !el.isConnected) return null;
  const m = mirrorFor(el);
  const cs = getComputedStyle(el);

  m.textContent = el.value.slice(0, start);
  const span = document.createElement('span');
  // An empty span has no box. A zero-width space gives a caret-sized one.
  span.textContent = el.value.slice(start, end) || '​';
  m.appendChild(span);
  // The tail matters: without it a trailing newline collapses and the last
  // line measures at the wrong height.
  m.appendChild(document.createTextNode(`${el.value.slice(end)}​`));

  const mRect = m.getBoundingClientRect();
  const sRect = span.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  const offX = elRect.left + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0) - el.scrollLeft;
  const offY = elRect.top + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0) - el.scrollTop;

  const rect = {
    top: offY + (sRect.top - mRect.top),
    left: offX + (sRect.left - mRect.left),
    width: sRect.width,
    height: sRect.height,
  };
  rect.bottom = rect.top + rect.height;
  rect.right = rect.left + rect.width;

  // Scrolled out of the field's own viewport — pointing at it would put the
  // tooltip over the toolbar or off the top of the dialog.
  if (rect.bottom < elRect.top - 4 || rect.top > elRect.bottom + 4) return null;
  return rect;
}

/* ── The tooltip ───────────────────────────────────────
   One element, reused. Two moods: a WARNING, which says something and fades,
   and a MENU, which is clickable and waits. Both point at a range.
   ─────────────────────────────────────────────────────── */
let tip = null;
let anchor = null;      // { el, start, end }
let onDismiss = null;
let fadeTimer = null;
let interactive = false;

function ensureTip() {
  if (tip) return tip;
  tip = document.createElement('div');
  tip.className = 'pptip';
  tip.hidden = true;
  // Clicking the tooltip must not take focus off the textarea, or the
  // selection it is about to act on is gone before the handler runs.
  tip.addEventListener('mousedown', (e) => e.preventDefault());
  document.body.appendChild(tip);

  // The sheet scrolls inside the dialog, so the anchor moves without the page
  // moving. Capture catches the scroll on whichever ancestor did it.
  addEventListener('scroll', reposition, true);
  addEventListener('resize', reposition);
  return tip;
}

const GAP = 9;          // between the text and the tooltip's point
const EDGE = 10;        // never closer than this to the window edge

export function reposition() {
  if (!tip || tip.hidden || !anchor) return;
  const rect = rangeRect(anchor.el, anchor.start, anchor.end);
  if (!rect) { hideTip(); return; }

  // Measure before placing — the tooltip's height decides whether it fits
  // above the text, and its width decides how far it must be nudged inboard.
  tip.style.left = '0px';
  tip.style.top = '0px';
  const box = tip.getBoundingClientRect();

  const below = rect.bottom + GAP;
  const above = rect.top - GAP - box.height;
  // Prefer above (it does not cover the words you are about to type), but
  // only when there is genuinely room for it.
  const place = above >= EDGE ? 'above' : 'below';
  let top = place === 'above' ? above : below;
  if (top + box.height > innerHeight - EDGE) top = innerHeight - EDGE - box.height;
  // Clamped last and in both directions: a tooltip taller than the space
  // left for it would otherwise be pushed off the top by the line above.
  if (top < EDGE) top = EDGE;

  let left = rect.left;
  if (left + box.width > innerWidth - EDGE) left = innerWidth - EDGE - box.width;
  if (left < EDGE) left = EDGE;

  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
  tip.classList.toggle('is-above', place === 'above');
  tip.classList.toggle('is-below', place === 'below');

  // The point sits under the middle of the text it refers to — or as near as
  // the tooltip's own edge allows once it has been nudged inboard.
  const armX = Math.min(Math.max(rect.left + rect.width / 2 - left, 14), Math.max(14, box.width - 14));
  tip.style.setProperty('--tip-arm', `${Math.round(armX)}px`);
}

/* Show a tooltip against characters [start, end) of a field.

   `kind`  'warn' (transient, not clickable) | 'menu' (clickable, waits)
   `ms`    auto-dismiss after this long; 0 to stay until dismissed
   `onGone` called when it goes, whatever made it go */
export function showTip({ el, start, end, html, kind = 'warn', ms = 0, onGone = null }) {
  if (!el) return null;
  ensureTip();
  anchor = { el, start, end };
  onDismiss = onGone;
  interactive = kind === 'menu';

  tip.className = `pptip pptip--${kind}`;
  tip.innerHTML = html;
  tip.hidden = false;
  tip.style.pointerEvents = interactive ? 'auto' : 'none';

  clearTimeout(fadeTimer);
  if (ms) fadeTimer = setTimeout(() => hideTip(), ms);

  reposition();
  // A tooltip whose anchor is off-screen was dismissed by reposition().
  return tip.hidden ? null : tip;
}

export function hideTip() {
  clearTimeout(fadeTimer);
  if (tip) { tip.hidden = true; tip.innerHTML = ''; tip.className = 'pptip'; }
  anchor = null;
  interactive = false;
  const fn = onDismiss;
  onDismiss = null;
  if (fn) fn();
}

export const tipIsOpen = () => !!tip && !tip.hidden;
export const tipIsMenu = () => tipIsOpen() && interactive;
export const tipEl = () => tip;

// Escape closes an open menu; a click anywhere that is not the tooltip does
// too. A transient warning ignores both — it is already leaving.
addEventListener('keydown', (e) => { if (e.key === 'Escape' && tipIsMenu()) hideTip(); });
addEventListener('mousedown', (e) => {
  if (tipIsMenu() && tip && !tip.contains(e.target) && e.target !== anchor?.el) hideTip();
}, true);
