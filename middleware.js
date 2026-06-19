/**
 * Vercel Middleware — server-side login gate.
 *
 * Runs before any page is served. On a protected page it verifies the Firebase
 * session cookie (minted by /api/auth/session); if it's missing or invalid the
 * request is redirected to the home page with the login modal open and a `next`
 * param so the learner returns to where they were after signing in.
 *
 * Only top-level HTML navigations are gated — assets (js/css/img/fonts), /api,
 * and the public pages (home, blogs, editorials, privacy, terms, subscribe,
 * auth) always pass through.
 */
import admin from "firebase-admin";

export const config = {
  runtime: "nodejs",
  // Skip /api, Vercel internals, and anything with a static-asset extension.
  matcher: [
    "/((?!api/|_vercel/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:js|mjs|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2|ttf|otf|eot|map|json|txt|xml|mp3|mp4|webm|wasm|pdf|csv)).*)",
  ],
};

let app;
function ensureAdmin() {
  if (!app) {
    app = admin.apps && admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
          ),
        });
  }
  return app;
}

const PUBLIC_EXACT = new Set([
  "/", "/index.html", "/privacy.html", "/terms.html", "/subscribe.html",
]);
const PUBLIC_PREFIXES = ["/blogs", "/editorials", "/utils/auth"];

function isPublic(path) {
  if (PUBLIC_EXACT.has(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function readCookie(req, name) {
  const header = req.headers.get("cookie") || "";
  const m = header.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
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
      ensureAdmin();
      await admin.auth().verifySessionCookie(cookie, false);
      return; // valid session → allow
    } catch (e) {
      // invalid/expired → fall through to the login redirect
    }
  }

  const dest = new URL("/index.html", request.url);
  dest.searchParams.set("login", "1");
  dest.searchParams.set("next", path + url.search);
  return Response.redirect(dest, 302);
}
