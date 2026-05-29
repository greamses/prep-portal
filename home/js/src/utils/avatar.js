export function avatarUrl(name, role) {
  const seed = encodeURIComponent(name.replace(/[^a-zA-Z0-9 ]/g, "").trim());
  const bg =
    role === "tutor" ? "bbf7d0" : role === "student" ? "bfdbfe" : "fde68a";
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}&backgroundColor=${bg}&radius=50&scale=110`;
}
