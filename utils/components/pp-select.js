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

const CHEVRON = `<svg class="pp-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
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
  const menu = document.createElement("div");
  menu.className = "pp-select-menu";
  root.appendChild(trigger);
  root.appendChild(menu);

  sel.style.display = "none";
  sel.setAttribute("tabindex", "-1");
  sel.parentNode.insertBefore(root, sel.nextSibling);

  function refresh() {
    const cur = VALUE_DESC.get.call(sel);
    const chosen = sel.selectedOptions[0];
    span.textContent = chosen ? chosen.textContent.trim() : "";
    root.classList.toggle("has-value", cur !== "" && cur != null);
    menu.innerHTML = [...sel.options]
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
