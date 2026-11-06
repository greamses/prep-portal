/* Dresses a blog article in the site's paper look.
   - mountPaint(host): the amoeba paint-blob wash behind the page (our logo motif).
   - dressArticle(root): wraps each lesson note in the shared receipt
     (.pp-receipt wrapper = soft shadow, .pp-receipt__paper = torn edge + rails),
     so the article is built from the component, never a copy of its mask. */
import { heroPaint } from "/utils/components/nav-icons.js";

export function mountPaint(host = document.body) {
  if (host.querySelector(":scope > .blog-paint")) return;
  const paint = document.createElement("div");
  paint.className = "blog-paint";
  paint.setAttribute("aria-hidden", "true");
  paint.innerHTML = heroPaint();
  host.prepend(paint);
}

export function dressArticle(root = document) {
  root.querySelectorAll(".single-post-body .lesson-note").forEach((note) => {
    if (note.parentElement.classList.contains("pp-receipt")) return;
    const wrap = document.createElement("div");
    wrap.className = "pp-receipt lesson-receipt";
    note.before(wrap);
    note.classList.add("pp-receipt__paper");
    wrap.append(note);
  });
}
