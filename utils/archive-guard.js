/*
 * archive-guard.js — gates the verbatim past-paper archive pages.
 *
 * Include as the FIRST script in <head> of any archive page. It hides the page,
 * asks the server whether the archive is enabled (config/site.archiveEnabled,
 * default OFF), and either reveals the page or replaces it with a friendly
 * "unavailable" notice. Fails CLOSED — if it can't confirm, it stays hidden.
 */
(function () {
  var API = location.port === "5500" ? "http://127.0.0.1:5000" : "";

  // Our own AI-generated CBT is always allowed (it isn't past-paper content):
  // the exam builder page and any viewer launched with source=cbt. Only the
  // verbatim/third-party modes (aloc / competition / SAT / Cambridge) are gated.
  try {
    var qp = new URLSearchParams(location.search);
    if (qp.get("source") === "cbt" || /\/exams(\/|$)/.test(location.pathname) ||
        /national\/exams/.test(location.pathname)) {
      return;
    }
  } catch (_) {}

  var hide = document.createElement("style");
  hide.id = "ag-hide";
  hide.textContent = "body{visibility:hidden!important}";
  (document.head || document.documentElement).appendChild(hide);

  function reveal() {
    var e = document.getElementById("ag-hide");
    if (e && e.parentNode) e.parentNode.removeChild(e);
  }

  function block() {
    function paint() {
      document.body.innerHTML =
        '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;' +
        'font-family:ui-monospace,monospace;text-align:center;color:#2a2723;background:#f0ece3">' +
        '<div style="max-width:30rem">' +
        '<h1 style="font-family:Unbounded,system-ui,sans-serif;font-size:1.4rem;margin:0 0 .6rem">This section is unavailable</h1>' +
        '<p style="font-size:.85rem;line-height:1.6;color:#6b655c;margin:0 0 1.2rem">' +
        'The past-paper archive is currently turned off. Try our original, exam-style practice instead.</p>' +
        '<a href="/theory-page/" style="display:inline-block;margin:.25rem;padding:.6rem 1.1rem;border-radius:999px;' +
        'background:#f4c95d;color:#2a2723;text-decoration:none;font-weight:700">Practice questions</a>' +
        '<a href="/" style="display:inline-block;margin:.25rem;padding:.6rem 1.1rem;border-radius:999px;' +
        'background:#fffdf8;border:2px solid rgba(42,39,35,.14);color:#2a2723;text-decoration:none;font-weight:700">Home</a>' +
        "</div></div>";
      reveal();
    }
    if (document.body) paint();
    else document.addEventListener("DOMContentLoaded", paint);
  }

  fetch(API + "/api/config")
    .then(function (r) { return r.json(); })
    .then(function (c) { if (c && c.archiveEnabled === true) reveal(); else block(); })
    .catch(function () { block(); }); // fail closed
})();
