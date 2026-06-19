/**
 * Vercel Edge Middleware — server-side login gate.
 *
 * Edge-safe (no Node dependencies, so it can't crash the runtime): it does the
 * server-side REDIRECT for protected pages based on the presence of the
 * httpOnly `__session` cookie. That cookie is only ever issued by
 * /api/auth/session AFTER the server verifies a real Firebase ID token, so it
 * can't be obtained without logging in. Actual data/feature access is still
 * verified per request by the API (Firebase token checks), so the redirect is
 * the access boundary for pages and the API is the boundary for data.
 *
 * Only top-level HTML navigations are gated — assets (js/css/img/fonts), /api,
 * and the public pages (home, blogs, editorials, privacy, terms, subscribe,
 * auth) always pass through.
 */

export const config = {
  // Skip /api, Vercel internals, and anything with a static-asset extension.
  matcher: [
    "/((?!api/|_vercel/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:js|mjs|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|otf|eot|map|json|txt|xml|mp3|mp4|webm|wasm|pdf|csv)).*)",
  ],
};

const PUBLIC_EXACT = new Set([
  "/", "/index.html", "/privacy.html", "/terms.html", "/subscribe.html",
]);
const PUBLIC_PREFIXES = ["/blogs", "/editorials", "/utils/auth"];

function isPublic(path) {
  if (PUBLIC_EXACT.has(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function hasSession(request) {
  const header = request.headers.get("cookie") || "";
  return /(?:^|; )__session=[^;]+/.test(header);
}

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only gate real page navigations, never asset/data fetches.
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) return;

  if (isPublic(path) || hasSession(request)) return;

  const dest = new URL("/index.html", request.url);
  dest.searchParams.set("login", "1");
  dest.searchParams.set("next", path + url.search);
  return Response.redirect(dest, 302);
}
