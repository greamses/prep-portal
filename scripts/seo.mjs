#!/usr/bin/env node
/**
 * seo.mjs — everything a search engine reads, generated from ONE registry
 * (scripts/seo/pages.mjs).
 *
 *   node scripts/seo.mjs           write
 *   node scripts/seo.mjs --check   write nothing; exit 1 if anything is stale
 *
 * What it writes
 *   1. Into every page listed in PAGES
 *        <!-- seo:head --> … <!-- /seo:head -->     title, description,
 *            canonical, robots, Open Graph, Twitter card, JSON-LD
 *        <!-- seo:about --> … <!-- /seo:about -->   a real, readable section:
 *            what the page is, what you do there, links to its neighbours.
 *      On a page behind a guard the section is `hidden` and the guard shows it
 *      to a signed-out visitor INSTEAD of bouncing them to the home page (see
 *      utils/auth/login-guard.js). A crawler is a signed-out visitor, so it
 *      reads exactly what a person reads — that is what makes the URL
 *      indexable without opening up the activity itself.
 *   2. Into every OTHER page: <meta name="robots" content="noindex…">.
 *   3. sitemap.xml — every indexable URL, lastmod taken from git.
 *   4. middleware.js — the table of gated routes, between its seo:routes
 *      markers. A page that is not public is gated; a path that is no page at
 *      all falls through to a real 404 instead of a redirect to the login.
 *   5. index.html — the footer's static list of links to every section, so the
 *      home page links to everything without waiting for the nav script.
 *
 * Idempotent: running it twice changes nothing the second time.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, BRAND, SECTIONS, PAGES, MANUAL, OPEN_NOINDEX } from "./seo/pages.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const OG_IMAGE = `${SITE}/og-image.png`;

// Files are worked on with LF line ends and written back with whatever they
// had (the tree is a mix of LF and CRLF), so a run never rewrites a whole file.
const eol = new Map();
function read(f) {
  const raw = readFileSync(join(ROOT, f), "utf8");
  eol.set(f, raw.includes("\r\n") ? "\r\n" : "\n");
  return raw.replace(/\r\n/g, "\n");
}
const stale = [];
function write(f, next) {
  let prev = null;
  try { prev = read(f); } catch (_) {}
  if (prev === next) return;
  stale.push(f);
  if (CHECK) return;
  const nl = eol.get(f) || "\n";
  writeFileSync(join(ROOT, f), nl === "\n" ? next : next.replace(/\n/g, nl));
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** File path → the one public URL path for it (directory index → trailing slash). */
function urlPath(file) {
  if (file === "index.html") return "/";
  if (file.endsWith("/index.html")) return "/" + file.slice(0, -"index.html".length);
  return "/" + file;
}
/** The form the middleware compares: no trailing slash, no /index.html. */
function routeKey(file) {
  const p = urlPath(file).replace(/\/+$/, "");
  return p || "/";
}

function lastmod(file) {
  // An app page is its whole folder (the HTML rarely changes; its code does).
  const target = file.endsWith("/index.html") ? dirname(file) : file;
  try {
    const d = execSync(`git log -1 --format=%cs -- "${target}"`, { cwd: ROOT }).toString().trim();
    if (d) return d;
  } catch (_) {}
  return new Date().toISOString().slice(0, 10);
}

/* ── which pages exist ──────────────────────────────────────────────────── */
const allHtml = execSync('git ls-files -co --exclude-standard "*.html"', { cwd: ROOT })
  .toString().trim().split("\n").filter(Boolean)
  .filter((f) => !f.startsWith("node_modules/") && !f.startsWith(".claude/"));

const byFile = new Map(PAGES.map((p) => [p.file, p]));
const manual = new Set(MANUAL.map((m) => m.file));
const openNoindex = new Set(OPEN_NOINDEX);
const isBlogPost = (f) => /^blogs\/[^/]+\/[^/]+\/index\.html$/.test(f) && f !== "blogs/auto/index.html";
const isVerification = (f) => /^google[0-9a-f]+\.html$/.test(f);

for (const p of PAGES) if (!allHtml.includes(p.file)) throw new Error(`seo: no such page: ${p.file}`);
for (const p of PAGES) {
  if (p.desc.length > 185) console.warn(`seo: description is ${p.desc.length} chars (aim ≤ 160): ${p.file}`);
  if (!SECTIONS[p.section]) throw new Error(`seo: unknown section "${p.section}" on ${p.file}`);
}

function accessOf(page, html) {
  if (page.access) return page.access;
  if (html.includes("premium-guard.js")) return "premium";
  if (html.includes("login-guard.js")) return "login";
  return "free";
}

/* ── the head block ─────────────────────────────────────────────────────── */
const HEAD_RE = /[ \t]*<!-- seo:head -->[\s\S]*?<!-- \/seo:head -->\n?/;
const ABOUT_RE = /[ \t]*<!-- seo:about -->[\s\S]*?<!-- \/seo:about -->\n?/;

// Tags the block owns. Anything hand-written with the same job is removed so
// a page never carries two titles or two descriptions.
const OWNED = [
  /[ \t]*<title[^>]*>[\s\S]*?<\/title>\n?/gi,
  /[ \t]*<meta\s+(?:name|property)=["'](?:description|keywords|robots|author|og:[^"']*|twitter:[^"']*)["'][^>]*>\n?/gi,
  /[ \t]*<link\s+rel=["']canonical["'][^>]*>\n?/gi,
];

/** Apply fn to the <head> only — the body has its own <title>s (inline SVG). */
function inHead(html, fn) {
  const end = html.search(/<\/head>/i);
  if (end < 0) throw new Error("no </head>");
  return fn(html.slice(0, end)) + html.slice(end);
}

function insertHead(html, block) {
  html = html.replace(HEAD_RE, "");
  const m = html.match(/<meta\s+charset=[^>]*>\n?/i) || html.match(/<head[^>]*>\n?/i);
  if (!m) throw new Error("no <head>");
  const at = m.index + m[0].length;
  return html.slice(0, at) + block + html.slice(at);
}

function crumbs(page) {
  const list = [{ name: "Home", file: "index.html" }];
  const sec = SECTIONS[page.section];
  if (sec.hub && sec.hub !== page.file) list.push({ name: sec.name, file: sec.hub });
  list.push({ name: page.name, file: page.file });
  return list;
}

function headBlock(page, access) {
  const url = SITE + urlPath(page.file);
  const title = `${page.title} | ${BRAND}`;
  const sec = SECTIONS[page.section];
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "LearningResource"],
        "@id": url + "#page",
        url,
        name: page.title,
        description: page.desc,
        inLanguage: "en-NG",
        isPartOf: { "@id": SITE + "/#website" },
        provider: { "@id": SITE + "/#org" },
        learningResourceType: sec.name,
        teaches: page.points,
        ...(access === "free" ? { isAccessibleForFree: true } : {}),
        audience: { "@type": "EducationalAudience", educationalRole: "student" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs(page).map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          item: SITE + urlPath(c.file),
        })),
      },
    ],
  };
  return [
    "    <!-- seo:head -->",
    "    <!-- Written by scripts/seo.mjs from scripts/seo/pages.mjs. Edit the registry, not this block. -->",
    `    <title>${esc(title)}</title>`,
    `    <meta name="description" content="${esc(page.desc)}" />`,
    `    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `    <link rel="canonical" href="${url}" />`,
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="${BRAND}" />`,
    `    <meta property="og:locale" content="en_NG" />`,
    `    <meta property="og:url" content="${url}" />`,
    `    <meta property="og:title" content="${esc(page.title)}" />`,
    `    <meta property="og:description" content="${esc(page.desc)}" />`,
    `    <meta property="og:image" content="${OG_IMAGE}" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${esc(page.title)}" />`,
    `    <meta name="twitter:description" content="${esc(page.desc)}" />`,
    `    <meta name="twitter:image" content="${OG_IMAGE}" />`,
    `    <script type="application/ld+json">${JSON.stringify(ld)}</script>`,
    `    <link rel="stylesheet" href="/utils/components/about.css" />`,
    "    <!-- /seo:head -->",
    "",
  ].join("\n");
}

function noindexBlock(follow) {
  return [
    "    <!-- seo:head -->",
    `    <meta name="robots" content="noindex, ${follow ? "follow" : "nofollow"}" />`,
    "    <!-- /seo:head -->",
    "",
  ].join("\n");
}

/* ── the about block ────────────────────────────────────────────────────── */
function aboutBlock(page, access, html) {
  const sec = SECTIONS[page.section];
  const siblings = PAGES.filter((p) => p.section === page.section && p.file !== page.file);
  // A hub lists what it holds; every other page lists its neighbours.
  const gated = access !== "free";
  // The page keeps its own <h1> when it has one and is readable signed-out.
  const hasOwnH1 = /<h1[\s>]/i.test(html.replace(ABOUT_RE, ""));
  const H = gated || !hasOwnH1 ? "h1" : "h2";
  const trail = crumbs(page);

  const L = [];
  L.push("    <!-- seo:about -->");
  L.push(`    <section id="pp-about" class="pp-about" data-access="${access}"${gated ? " hidden" : ""}>`);
  L.push(`      <nav class="pp-about-crumbs" aria-label="Breadcrumb">`);
  L.push(
    "        " +
      trail
        .map((c, i) =>
          i === trail.length - 1
            ? `<span aria-current="page">${esc(c.name)}</span>`
            : `<a href="${urlPath(c.file)}">${esc(c.name)}</a>`
        )
        .join(' <span aria-hidden="true">/</span> ')
  );
  L.push("      </nav>");
  L.push(`      <${H} class="pp-about-title">${esc(page.title)}</${H}>`);
  L.push(`      <p class="pp-about-intro">${esc(page.intro)}</p>`);
  L.push(`      <ul class="pp-about-points">`);
  for (const pt of page.points) L.push(`        <li>${esc(pt)}</li>`);
  L.push("      </ul>");
  if (gated) {
    const next = encodeURIComponent(urlPath(page.file));
    L.push(`      <p class="pp-about-note">${
      access === "premium"
        ? `${esc(page.name)} opens with a Prep Portal plan. Sign in to continue, or see what a plan includes.`
        : `${esc(page.name)} is free to use with a Prep Portal account. Sign in or create one to start.`
    }</p>`);
    L.push(`      <p class="pp-about-actions">`);
    L.push(`        <a class="pp-about-btn pp-about-btn--main" data-pp-login href="/index.html?login=1&amp;next=${next}">Sign in or create an account</a>`);
    if (access === "premium") L.push(`        <a class="pp-about-btn" href="/subscribe.html#plans">See the plans</a>`);
    L.push("      </p>");
  }
  if (siblings.length) {
    L.push(`      <h2 class="pp-about-more">More ${esc(sec.name.toLowerCase())}</h2>`);
    L.push(`      <ul class="pp-about-links">`);
    for (const s of siblings) L.push(`        <li><a href="${urlPath(s.file)}">${esc(s.name)}</a></li>`);
    L.push("      </ul>");
  }
  L.push("    </section>");
  // A game the middleware used to gate has to bring its own guard now that the
  // address itself is public.
  if (access === "login" && !/login-guard\.js|premium-guard\.js/.test(html.replace(ABOUT_RE, "")))
    L.push(`    <script type="module" src="/utils/auth/login-guard.js"></script>`);
  L.push("    <!-- /seo:about -->");
  L.push("");
  return L.join("\n");
}

function insertAbout(html, block) {
  html = html.replace(ABOUT_RE, "");
  const at = html.lastIndexOf("</body>");
  if (at < 0) throw new Error("no </body>");
  // keep the closing tag on its own line
  const before = html.slice(0, at).replace(/[ \t]*$/, "");
  return before + block + "  " + html.slice(at);
}

/* ── 1 + 2: the pages ───────────────────────────────────────────────────── */
const indexable = []; // { file, priority, changefreq }
const gatedRoutes = [];

for (const file of allHtml) {
  if (manual.has(file) || isBlogPost(file) || isVerification(file) || file === "404.html") continue;
  let html = read(file);
  const page = byFile.get(file);
  try {
    if (page) {
      const access = accessOf(page, html);
      html = inHead(html, (h) => OWNED.reduce((acc, re) => acc.replace(re, ""), h));
      html = insertHead(html, headBlock(page, access));
      html = insertAbout(html, aboutBlock(page, access, html));
      indexable.push({ file, priority: page.priority || "0.6", changefreq: "weekly" });
    } else {
      const open = openNoindex.has(file);
      html = inHead(html, (h) => h.replace(/[ \t]*<meta\s+name=["']robots["'][^>]*>\n?/gi, ""));
      html = insertHead(html, noindexBlock(open));
      if (!open) gatedRoutes.push(routeKey(file));
    }
  } catch (e) {
    throw new Error(`seo: ${file}: ${e.message}`);
  }
  write(file, html);
}

/* ── 3: sitemap.xml ─────────────────────────────────────────────────────── */
const entries = [
  ...MANUAL.map((m) => ({ ...m })),
  ...indexable.sort((a, b) => Number(b.priority) - Number(a.priority) || a.file.localeCompare(b.file)),
];
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<!-- Written by scripts/seo.mjs. Blog posts are in sitemap-blogs.xml. -->\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  entries
    .map(
      (e) =>
        `  <url>\n    <loc>${SITE}${urlPath(e.file)}</loc>\n    <lastmod>${lastmod(e.file)}</lastmod>\n` +
        `    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>\n`
    )
    .join("") +
  `</urlset>\n`;
write("sitemap.xml", sitemap);

/* ── 4: the middleware's gated-route table ──────────────────────────────── */
{
  const f = "middleware.js";
  const src = read(f);
  const re = /\/\* seo:routes \*\/[\s\S]*?\/\* \/seo:routes \*\//;
  if (!re.test(src)) throw new Error("seo: middleware.js has no seo:routes markers");
  const table =
    "/* seo:routes */\nconst GATED = new Set([\n" +
    gatedRoutes.sort().map((r) => `  ${JSON.stringify(r)},\n`).join("") +
    "]);\n/* /seo:routes */";
  write(f, src.replace(re, table));
}

/* ── 5: the home page's static link list ────────────────────────────────── */
{
  const f = "index.html";
  const src = read(f);
  const re = /[ \t]*<!-- seo:explore -->[\s\S]*?<!-- \/seo:explore -->\n?/;
  if (!re.test(src)) throw new Error("seo: index.html has no seo:explore markers");
  const L = ["        <!-- seo:explore -->", `        <nav class="footer-explore" aria-label="Everything on Prep Portal">`];
  for (const [key, sec] of Object.entries(SECTIONS)) {
    const pages = PAGES.filter((p) => p.section === key);
    if (!pages.length) continue;
    L.push(`          <div class="footer-explore-group">`);
    L.push(`            <h3>${esc(sec.name)}</h3>`);
    L.push("            <ul>");
    for (const p of pages) L.push(`              <li><a href="${urlPath(p.file)}">${esc(p.name)}</a></li>`);
    L.push("            </ul>");
    L.push("          </div>");
  }
  L.push("        </nav>", "        <!-- /seo:explore -->", "");
  write(f, src.replace(re, L.join("\n")));
}

/* ── report ─────────────────────────────────────────────────────────────── */
if (CHECK) {
  if (stale.length) {
    console.error(`seo: ${stale.length} file(s) out of date — run  node scripts/seo.mjs\n  ` + stale.join("\n  "));
    process.exit(1);
  }
  console.log("seo: up to date");
} else {
  console.log(
    `seo: ${indexable.length + MANUAL.length} indexable pages in sitemap.xml, ` +
      `${gatedRoutes.length} gated routes, ${stale.length} file(s) written`
  );
}
