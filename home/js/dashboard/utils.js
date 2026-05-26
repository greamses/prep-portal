export const setText = (el, v) => {
  if (el) el.textContent = v;
};
export const pct = (v, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fb;
};
export const firstName = (u) =>
  (u?.displayName || u?.email?.split("@")[0] || "there").split(" ")[0];
export const initial = (name = "U") => String(name).charAt(0).toUpperCase();
export const PERSON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`;

export const fmtDate = (d) => {
  if (!d) return "—";
  const dt = d?.toDate ? d.toDate() : new Date(d);
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export const scoreColor = (s) =>
  s >= 80 ? "fill-green" : s >= 60 ? "fill-blue" : "fill-red";
export const pillColor = (s) =>
  s >= 80 ? "pill-green" : s >= 60 ? "pill-blue" : "pill-red";
export const avatarColor = (role) =>
  role === "teacher"
    ? "background:var(--accent-success);color:#fff"
    : role === "parent"
      ? "background:var(--accent-secondary);color:var(--text-on-accent)"
      : role === "admin"
        ? "background:var(--accent-danger);color:#fff"
        : "background:var(--accent-primary);color:var(--ink)";
