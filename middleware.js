/**
 * Vercel Edge Middleware — server-side login gate (cryptographically verified).
 *
 * SELF-CONTAINED: verifies the Firebase **session cookie**'s RS256 signature
 * with the Web Crypto API (`crypto.subtle`) — there is **no external npm
 * dependency**. An earlier version imported `jose`; because that package was
 * never bundled into the deployed Edge function, importing it threw and every
 * request died with MIDDLEWARE_INVOCATION_FAILED (the whole site 500'd).
 * Relying only on Web-standard APIs (crypto.subtle / atob / TextEncoder) means
 * there is nothing left that can fail to install or bundle.
 *
 * Session cookies are RS256 JWTs signed by Google:
 *   iss = https://session.firebase.google.com/<projectId>
 *   aud = <projectId>
 *   signed with the X.509 certs at the identitytoolkit publicKeys endpoint.
 *
 * Only top-level HTML navigations are gated — assets (js/css/img/fonts), /api,
 * and the public pages (home, blogs, editorials, privacy, terms, subscribe,
 * auth) always pass through. On ANY unexpected error the request is allowed
 * through (fail-open) so the gate can never take the site down again; only a
 * cleanly-evaluated "no valid session" results in the login redirect.
 */

export const config = {
  // Skip /api, Vercel internals, and anything with a static-asset extension.
  matcher: [
    "/((?!api/|_vercel/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:js|mjs|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|otf|eot|map|json|txt|xml|mp3|mp4|webm|wasm|pdf|csv|glb|gltf|bin)).*)",
  ],
};

const PROJECT_ID = "prep-portal-2026";
const ISSUER = `https://session.firebase.google.com/${PROJECT_ID}`;
const CERT_URL =
  "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";

const PUBLIC_EXACT = new Set([
  "/", "/index.html", "/privacy.html", "/terms.html", "/subscribe.html",
]);
const PUBLIC_PREFIXES = [
  "/blogs", "/editorials", "/utils/auth",
  // SEO: these are marketing/landing + listing pages that should be crawlable
  // and browsable without an account. Any actual paid AI action inside them
  // (theory grading, writing grading) is separately enforced server-side in
  // server/routes/ai.js (isPremiumUser → 402), so opening the page itself up
  // to anonymous visitors doesn't bypass the premium gate.
  "/exam-archive", "/theory-page", "/writing", "/prep-math",
];

function isPublic(path) {
  if (PUBLIC_EXACT.has(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const m = header.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

// ── base64 / base64url → bytes (Edge runtime has atob) ─────────────────────
function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return b64ToBytes(s);
}
function b64urlToString(s) {
  return new TextDecoder().decode(b64urlToBytes(s));
}

// ── X.509 cert (PEM) → SubjectPublicKeyInfo DER ────────────────────────────
// crypto.subtle can't import a whole X.509 cert, only the SPKI public key. The
// identitytoolkit endpoint serves certs (PEM), so we extract the SPKI from the
// DER: find the rsaEncryption AlgorithmIdentifier, take the BIT STRING that
// follows, and wrap both in a fresh SEQUENCE — a valid SPKI to import.
function pemToDer(pem) {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/, "")
    .replace(/-----END CERTIFICATE-----/, "")
    .replace(/\s+/g, "");
  return b64ToBytes(b64);
}
// SEQUENCE { OID 1.2.840.113549.1.1.1 (rsaEncryption), NULL }
const RSA_ALGID = [
  0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86,
  0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
];
function encodeLen(n) {
  if (n < 0x80) return [n];
  if (n < 0x100) return [0x81, n];
  return [0x82, (n >> 8) & 0xff, n & 0xff];
}
function indexOfSeq(hay, needle) {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}
function certDerToSpki(der) {
  const i = indexOfSeq(der, RSA_ALGID);
  if (i < 0) throw new Error("no rsa algid");
  const bsStart = i + RSA_ALGID.length;
  if (der[bsStart] !== 0x03) throw new Error("no bitstring"); // BIT STRING tag
  let p = bsStart + 1;
  let len, lenBytes;
  const first = der[p];
  if (first < 0x80) { len = first; lenBytes = 1; }
  else {
    const nb = first & 0x7f;
    len = 0;
    for (let k = 1; k <= nb; k++) len = (len << 8) | der[p + k];
    lenBytes = nb + 1;
  }
  const bitStrTotal = 1 + lenBytes + len; // tag + length octets + content
  const bitStr = der.slice(bsStart, bsStart + bitStrTotal);
  const body = new Uint8Array(RSA_ALGID.length + bitStr.length);
  body.set(RSA_ALGID, 0);
  body.set(bitStr, RSA_ALGID.length);
  const lenEnc = encodeLen(body.length);
  const spki = new Uint8Array(1 + lenEnc.length + body.length);
  spki[0] = 0x30; // SEQUENCE
  spki.set(lenEnc, 1);
  spki.set(body, 1 + lenEnc.length);
  return spki;
}

// Cache the imported CryptoKeys (a { kid: CryptoKey } map) per the certs' max-age.
let keyCache = { keys: null, exp: 0 };
async function getKeys() {
  const now = Date.now();
  if (keyCache.keys && now < keyCache.exp) return keyCache.keys;
  const res = await fetch(CERT_URL);
  if (!res.ok) throw new Error("cert fetch " + res.status);
  const pems = await res.json(); // { kid: "-----BEGIN CERTIFICATE-----…" }
  const keys = {};
  for (const kid of Object.keys(pems)) {
    try {
      keys[kid] = await crypto.subtle.importKey(
        "spki",
        certDerToSpki(pemToDer(pems[kid])),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"]
      );
    } catch (_) { /* skip a cert we can't parse */ }
  }
  let maxAge = 3600;
  const cc = res.headers.get("cache-control");
  const m = cc && cc.match(/max-age=(\d+)/);
  if (m) maxAge = parseInt(m[1], 10);
  keyCache = { keys, exp: now + maxAge * 1000 };
  return keys;
}

async function verifySession(cookie) {
  const parts = cookie.split(".");
  if (parts.length !== 3) throw new Error("malformed");
  const header = JSON.parse(b64urlToString(parts[0]));
  if (header.alg !== "RS256" || !header.kid) throw new Error("bad header");

  const keys = await getKeys();
  const key = keys[header.kid];
  if (!key) throw new Error("unknown kid");

  const data = new TextEncoder().encode(parts[0] + "." + parts[1]);
  const sig = b64urlToBytes(parts[2]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data);
  if (!ok) throw new Error("bad signature");

  const payload = JSON.parse(b64urlToString(parts[1]));
  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== ISSUER) throw new Error("bad iss");
  if (payload.aud !== PROJECT_ID) throw new Error("bad aud");
  if (!payload.sub) throw new Error("no sub");
  if (typeof payload.exp !== "number" || payload.exp < now) throw new Error("expired");
  if (typeof payload.iat === "number" && payload.iat > now + 300) throw new Error("future iat");
  return payload;
}

export default async function middleware(request) {
  try {
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
  } catch (e) {
    // The gate must NEVER take the site down: on any unexpected failure, let the
    // request through (the page's own client-side auth still applies).
    return;
  }
}
