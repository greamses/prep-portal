/**
 * Vercel Edge Middleware — server-side login gate (cryptographically verified).
 *
 * Verifies the Firebase **session cookie** at the edge with `jose` (Edge-safe,
 * uses Web Crypto) before allowing a protected page to render. So a forged or
 * tampered `__session` cookie won't even get the page shell — it's redirected
 * to the home login like any logged-out request.
 *
 * Session cookies are RS256 JWTs signed by Google:
 *   iss = https://session.firebase.google.com/<projectId>
 *   aud = <projectId>
 *   signed with the X.509 certs at the identitytoolkit publicKeys endpoint.
 *
 * Only top-level HTML navigations are gated — assets (js/css/img/fonts), /api,
 * and the public pages (home, blogs, editorials, privacy, terms, subscribe,
 * auth) always pass through.
 */
import { importX509, jwtVerify, decodeProtectedHeader } from "jose";

export const config = {
  // Skip /api, Vercel internals, and anything with a static-asset extension.
  matcher: [
    "/((?!api/|_vercel/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:js|mjs|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|otf|eot|map|json|txt|xml|mp3|mp4|webm|wasm|pdf|csv)).*)",
  ],
};

const PROJECT_ID = "prep-portal-2026";
const ISSUER = `https://session.firebase.google.com/${PROJECT_ID}`;
const CERT_URL =
  "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";

const PUBLIC_EXACT = new Set([
  "/", "/index.html", "/privacy.html", "/terms.html", "/subscribe.html",
]);
const PUBLIC_PREFIXES = ["/blogs", "/editorials", "/utils/auth"];

function isPublic(path) {
  if (PUBLIC_EXACT.has(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const m = header.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

// Cache the Google signing certs (a { kid: x509PEM } map) per their max-age.
let certCache = { keys: null, exp: 0 };
async function getCerts() {
  const now = Date.now();
  if (certCache.keys && now < certCache.exp) return certCache.keys;
  const res = await fetch(CERT_URL);
  if (!res.ok) throw new Error("cert fetch " + res.status);
  const keys = await res.json();
  let maxAge = 3600;
  const cc = res.headers.get("cache-control");
  const m = cc && cc.match(/max-age=(\d+)/);
  if (m) maxAge = parseInt(m[1], 10);
  certCache = { keys, exp: now + maxAge * 1000 };
  return keys;
}

async function verifySession(cookie) {
  const { kid } = decodeProtectedHeader(cookie);
  if (!kid) throw new Error("no kid");
  const certs = await getCerts();
  const pem = certs[kid];
  if (!pem) throw new Error("unknown kid");
  const key = await importX509(pem, "RS256");
  const { payload } = await jwtVerify(cookie, key, {
    issuer: ISSUER,
    audience: PROJECT_ID,
  });
  if (!payload.sub) throw new Error("no sub");
  return payload;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only gate real page navigations, never asset/data fetches.
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) return;

  if (isPublic(path)) return;

  const cookie = readCookie(request, "__session");
  if (cookie) {
    try {
      await verifySession(cookie);
      return; // valid, unexpired, correctly-signed session → allow
    } catch (e) {
      // invalid / expired / tampered → fall through to the login redirect
    }
  }

  const dest = new URL("/index.html", request.url);
  dest.searchParams.set("login", "1");
  dest.searchParams.set("next", path + url.search);
  return Response.redirect(dest, 302);
}
