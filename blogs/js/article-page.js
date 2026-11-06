/* Entry for the pre-rendered article pages (blogs/<subject>/<slug>/index.html). */
import { mountPaint, dressArticle } from "/blogs/js/dress.js";

mountPaint();
dressArticle();

// Static pages skip the loader, so restore the saved theme here.
try {
  const t = localStorage.getItem("pp-theme");
  if (t) document.documentElement.setAttribute("data-theme", t);
} catch {}
