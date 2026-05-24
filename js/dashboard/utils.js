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
    ? "background:var(--green);color:#fff"
    : role === "parent"
      ? "background:var(--blue);color:#fff"
      : role === "admin"
        ? "background:var(--red);color:#fff"
        : "background:var(--yellow);color:var(--ink)";
