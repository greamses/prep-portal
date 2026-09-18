/**
 * pp-select.js — progressive-enhancement wrapper that swaps a native <select>
 * for the app's custom .pp-select dropdown (styles in select.css), while keeping
 * the native element as the source of truth.
 *
 * Existing code can keep reading/writing `select.value` and replacing
 * `select.innerHTML`; the custom dropdown stays in sync via three hooks:
 *   1. a MutationObserver on the <select>'s children  → catches innerHTML swaps,
 *   2. a patched `value` setter                       → catches `sel.value = …`,
 *   3. the native `change` event                      → catches everything else.
 * Item clicks set the native value and dispatch a real `change`, so any
 * `select.onchange` / addEventListener("change") handlers fire unchanged.
 *
 *   import { enhanceSelect, enhanceSelects } from "/utils/components/pp-select.js";
 *   enhanceSelect(document.getElementById("ed-class"), { className: "pp-select--sm" });
 *   enhanceSelects(containerEl, { className: "pp-select--sm" }); // every <select> within
 */

const CHEVRON = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="pp-select-chevron"><g transform="rotate(90 12 12)"><path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="var(--accent-secondary)"/></g></svg>`;
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const VALUE_DESC = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");

let _docWired = false;
function wireDoc() {
  if (_docWired) return;
  _docWired = true;
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".pp-select.open").forEach((d) => {
      if (!d.contains(e.target)) d.classList.remove("open");
    });
  });
}

/** Enhance a single <select>. Idempotent; returns the .pp-select element. */
export function enhanceSelect(sel, opts = {}) {
  if (!sel || sel.dataset.ppEnhanced) return null;
  sel.dataset.ppEnhanced = "1";
  wireDoc();

  const root = document.createElement("div");
  root.className = ("pp-select " + (opts.className || "")).trim();
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "pp-select-trigger";
  const span = document.createElement("span");
  trigger.appendChild(span);
  trigger.insertAdjacentHTML("beforeend", CHEVRON);
  /* The open list is a RECEIPT — the one .pp-receipt component, in its two
     parts: the wrapper casts the shadow, the paper carries the torn edge and the
     punched holes (a shadow under a mask on the same element is clipped away,
     which is why they cannot share one). The choices sit in a third element
     that does the scrolling, so the holes stay put when the list is long. */
  const menu = document.createElement("div");
  menu.className = "pp-select-menu pp-receipt";
  const paper = document.createElement("div");
  paper.className = "pp-select-paper pp-receipt__paper";
  const list = document.createElement("div");
  list.className = "pp-select-list";
  paper.appendChild(list);
  menu.appendChild(paper);
  root.appendChild(trigger);
  root.appendChild(menu);

  sel.style.display = "none";
  sel.setAttribute("tabindex", "-1");
  sel.parentNode.insertBefore(root, sel.nextSibling);

  function refresh() {
    const cur = VALUE_DESC.get.call(sel);
    const chosen = sel.selectedOptions[0];
    span.textContent = chosen ? chosen.textContent.trim() : "";
    /* a long choice is cut short in the trigger, so its whole name is the
       tooltip (the site's one tooltip, utils/components/tooltip.js) */
    if (chosen) trigger.dataset.tip = chosen.textContent.trim(); else delete trigger.dataset.tip;
    root.classList.toggle("has-value", cur !== "" && cur != null);
    list.innerHTML = [...sel.options]
      .map((o) => `<div class="pp-select-item ${o.value === cur ? "active" : ""}" data-value="${esc(o.value)}">${esc(o.textContent.trim())}</div>`)
      .join("");
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (sel.disabled) return;
    const willOpen = !root.classList.contains("open");
    document.querySelectorAll(".pp-select.open").forEach((d) => d !== root && d.classList.remove("open"));
    root.classList.toggle("open", willOpen);
  });
  menu.addEventListener("click", (e) => {
    const item = e.target.closest(".pp-select-item");
    if (!item) return;
    root.classList.remove("open");
    if (item.dataset.value === VALUE_DESC.get.call(sel)) return;
    VALUE_DESC.set.call(sel, item.dataset.value);
    refresh();
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Keep the dropdown in sync with programmatic `sel.value = …`.
  Object.defineProperty(sel, "value", {
    configurable: true,
    get() { return VALUE_DESC.get.call(sel); },
    set(v) { VALUE_DESC.set.call(sel, v); refresh(); },
  });

  new MutationObserver(refresh).observe(sel, { childList: true, subtree: true });
  sel.addEventListener("change", refresh);

  refresh();
  return root;
}

/** Enhance every <select> within `root` (defaults to the whole document). */
export function enhanceSelects(root = document, opts = {}) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll("select").forEach((s) => enhanceSelect(s, opts));
}
