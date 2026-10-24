/* ═══════════════════════════════════════════════════════════════════════════
   WIRES BETWEEN EQUATIONS

   Drag from the little port on the edge of one equation to another and an arrow
   wire joins them: "these go together". Linked equations are a system — and the
   wire's menu can write the whole group as a matrix (system-matrix.js).

   The wires are drawn on the canvas's own sheet (an SVG laid under the cards), so
   they pan and zoom with it, and they are redrawn whenever a card moves, grows or
   goes. A wire has a direction — it runs from the equation you started on to the
   one you dropped on — and that direction is the ORDER the equations go into the
   matrix, top row first.
   ═══════════════════════════════════════════════════════════════════════════ */

const NS = "http://www.w3.org/2000/svg";
const svgEl = (name, attrs = {}) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

export function createWires({ canvas, host, cardsOf, onAct }) {
  const layer = svgEl("svg", { class: "am-wires", width: 1, height: 1 });
  layer.innerHTML = `<defs>
    <marker id="am-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 10 5 0 10z" fill="currentColor"/></marker></defs>`;
  const paths = svgEl("g");
  layer.appendChild(paths);
  // Beneath the cards: the sheet's first child.
  canvas.world.insertBefore(layer, canvas.world.firstChild);

  let links = [];                  // { id, from, to }  (card uids)
  let seq = 0;
  let menu = null;
  const observer = new ResizeObserver(() => update());

  const byUid = (uid) => cardsOf().find((c) => c.uid === uid);
  const rectOf = (c) => {
    const x = parseFloat(c.el.style.left) || 0, y = parseFloat(c.el.style.top) || 0;
    const w = c.el.offsetWidth, h = c.el.offsetHeight;
    return { x, y, w, h, l: x, r: x + w, t: y, b: y + h, cx: x + w / 2, cy: y + h / 2 };
  };

  /** The wire's two ends and the way each leaves its card. */
  function ends(a, b) {
    const ra = rectOf(a), rb = rectOf(b);
    if (rb.l >= ra.r - 10) return [{ x: ra.r, y: ra.cy, dx: 1, dy: 0 }, { x: rb.l, y: rb.cy, dx: -1, dy: 0 }];
    if (rb.r <= ra.l + 10) return [{ x: ra.l, y: ra.cy, dx: -1, dy: 0 }, { x: rb.r, y: rb.cy, dx: 1, dy: 0 }];
    if (rb.cy >= ra.cy) return [{ x: ra.cx, y: ra.b, dx: 0, dy: 1 }, { x: rb.cx, y: rb.t, dx: 0, dy: -1 }];
    return [{ x: ra.cx, y: ra.t, dx: 0, dy: -1 }, { x: rb.cx, y: rb.b, dx: 0, dy: 1 }];
  }
  const curve = (p, q) => {
    const k = Math.max(50, Math.hypot(q.x - p.x, q.y - p.y) * 0.4);
    return `M${p.x} ${p.y} C${p.x + p.dx * k} ${p.y + p.dy * k} ${q.x + q.dx * k} ${q.y + q.dy * k} ${q.x} ${q.y}`;
  };

  function update() {
    paths.textContent = "";
    for (const link of links) {
      const a = byUid(link.from), b = byUid(link.to);
      // Its card may not have arrived yet (a live room, a reload): wait for it.
      if (!a || !b) continue;
      const [p, q] = ends(a, b);
      const d = curve(p, q);
      const g = svgEl("g", { class: "am-wire", "data-link": link.id });
      g.append(
        svgEl("path", { d, class: "am-wire__line", fill: "none", "marker-end": "url(#am-arrow)" }),
        svgEl("path", { d, class: "am-wire__hit", fill: "none" }),
      );
      const hit = g.lastChild;
      hit.addEventListener("pointerdown", (e) => e.stopPropagation());
      hit.addEventListener("click", (e) => { e.stopPropagation(); openMenu(link, e.clientX, e.clientY); });
      paths.appendChild(g);
    }
  }
  canvas.onMove(update);

  /* ── making a wire ───────────────────────────────────────────────────── */
  let drawing = null;
  function begin(card, e) {
    closeMenu();
    const temp = svgEl("path", { class: "am-wire__line am-wire__line--temp", fill: "none", "marker-end": "url(#am-arrow)" });
    paths.appendChild(temp);
    drawing = { card, temp };
    const move = (ev) => {
      const w = canvas.toWorld(ev.clientX, ev.clientY);
      const [p] = ends(card, { el: { style: { left: `${w.x}px`, top: `${w.y}px` }, offsetWidth: 0, offsetHeight: 0 } });
      temp.setAttribute("d", curve(p, { x: w.x, y: w.y, dx: -p.dx, dy: -p.dy }));
      const over = cardAt(ev.clientX, ev.clientY, card);
      for (const c of cardsOf()) c.el.classList.toggle("is-wire-target", c === over);
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      for (const c of cardsOf()) c.el.classList.remove("is-wire-target");
      const over = ev.type === "pointerup" ? cardAt(ev.clientX, ev.clientY, card) : null;
      temp.remove();
      drawing = null;
      if (over) link(card, over);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    move(e);
  }

  function cardAt(x, y, except) {
    for (const el of document.elementsFromPoint(x, y)) {
      const own = el.closest?.(".am-card");
      if (!own) continue;
      const c = cardsOf().find((k) => k.el === own);
      if (c && c !== except) return c;
    }
    return null;
  }

  function link(a, b) {
    // One wire between a pair, whichever way round: a second drag turns it round.
    links = links.filter((l) => !((l.from === a.uid && l.to === b.uid) || (l.from === b.uid && l.to === a.uid)));
    links.push({ id: ++seq, from: a.uid, to: b.uid });
    track(a); track(b);
    update();
  }

  const tracked = new Set();
  function track(card) { if (!tracked.has(card)) { tracked.add(card); observer.observe(card.el); } }

  /* ── what a wire can do ──────────────────────────────────────────────── */
  /** The cards joined to this one, directly or through others. */
  function group(card) {
    const seen = new Set([card.uid]);
    const queue = [card.uid];
    while (queue.length) {
      const u = queue.shift();
      for (const l of links) {
        const other = l.from === u ? l.to : l.to === u ? l.from : null;
        if (other && !seen.has(other)) { seen.add(other); queue.push(other); }
      }
    }
    return [...seen].map(byUid).filter(Boolean);
  }

  /** The group in the order the wires run: from whatever nothing points at,
      along the arrows; whatever a wire does not settle goes top to bottom. */
  function ordered(card) {
    const members = group(card);
    const ids = new Set(members.map((c) => c.uid));
    const inside = links.filter((l) => ids.has(l.from) && ids.has(l.to));
    const incoming = (uid) => inside.filter((l) => l.to === uid).length;
    const top = (c) => (parseFloat(c.el.style.top) || 0) * 10000 + (parseFloat(c.el.style.left) || 0);
    const out = [];
    const done = new Set();
    const visit = (c) => {
      if (done.has(c.uid)) return;
      done.add(c.uid);
      out.push(c);
      for (const l of inside.filter((k) => k.from === c.uid)) visit(byUid(l.to));
    };
    for (const c of [...members].filter((m) => !incoming(m.uid)).sort((a, b) => top(a) - top(b))) visit(c);
    for (const c of [...members].sort((a, b) => top(a) - top(b))) visit(c);
    return out;
  }

  function closeMenu() { menu?.remove(); menu = null; }
  function openMenu(link, cx, cy) {
    closeMenu();
    const a = byUid(link.from);
    if (!a) return;
    menu = document.createElement("div");
    menu.className = "am-wiremenu";
    const members = group(a);
    const say = document.createElement("p");
    say.className = "am-wiremenu__say";
    say.textContent = `${members.length} equations linked`;
    menu.appendChild(say);
    const item = (label, act, tip) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pp-sticky pp-note-btn am-wiremenu__item";
      b.textContent = label;
      if (tip) b.dataset.tip = tip;
      b.addEventListener("pointerdown", (e) => e.stopPropagation());
      b.addEventListener("click", (e) => { e.stopPropagation(); closeMenu(); onAct(act, ordered(a), link); });
      menu.appendChild(b);
    };
    item("Write as a matrix equation", "matrix", "A × the letters = the numbers, as one equation");
    item("Write as an augmented matrix", "augmented", "the numbers in front and on the right, in one matrix");
    item("Turn the wire round", "reverse", "swap which equation comes first");
    item("Take the wire off", "remove");
    host.appendChild(menu);
    const box = host.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(box.width - menu.offsetWidth - 8, cx - box.left - menu.offsetWidth / 2))}px`;
    menu.style.top = `${Math.max(8, Math.min(box.height - menu.offsetHeight - 8, cy - box.top + 12))}px`;
    menu.addEventListener("pointerdown", (e) => e.stopPropagation());
    setTimeout(() => document.addEventListener("pointerdown", closeMenu, { once: true }), 0);
  }

  return {
    begin, update, link, group, ordered, track,
    /** A card has gone off the canvas: its wires go with it. */
    removeCard(card) { links = links.filter((l) => l.from !== card.uid && l.to !== card.uid); tracked.delete(card); observer.unobserve(card.el); update(); },
    unlink(id) { links = links.filter((l) => l.id !== id); update(); },
    reverse(id) { const l = links.find((k) => k.id === id); if (l) { [l.from, l.to] = [l.to, l.from]; update(); } },
    get count() { return links.length; },
    /** The wires as plain data, for the live room and for reload. */
    list() { return links.map(({ from, to }) => ({ from, to })); },
    /** A wire that came from elsewhere (live, saved): the same as drawing it. */
    set(from, to) {
      links = links.filter((l) => !((l.from === from && l.to === to) || (l.from === to && l.to === from)));
      links.push({ id: ++seq, from, to });
      for (const uid of [from, to]) { const c = byUid(uid); if (c) track(c); }
      update();
    },
    drop(from, to) { links = links.filter((l) => !(l.from === from && l.to === to)); update(); },
    /** Cards that have just arrived get watched, so their wires follow them. */
    retrack() { for (const c of cardsOf()) track(c); update(); },
  };
}
