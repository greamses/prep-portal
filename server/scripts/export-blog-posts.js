/**
 * export-blog-posts.js — materialise published blog posts as STATIC,
 * crawlable HTML pages (data/cbt's pattern, applied to /blogs).
 *
 * WHY: /blogs/index.html is a client-rendered shell — Firebase fetches posts
 * and opens them in an in-page modal keyed by Firestore doc id, so Google
 * never sees individual article URLs or their content. This script fixes
 * that by giving every published post its own real, indexable page.
 *
 * Output:
 *   blogs/<subjectKey>/<slug>/index.html — a real crawlable article page
 *       (title, meta description, OG/Twitter tags, canonical, Article
 *       JSON-LD, full lesson HTML) styled with the site's own blog CSS.
 *   data/blogs/<subjectKey>.js           — static feed data (mirrors
 *       data/cbt/*.js), one slim record per post.
 *   sitemap-blogs.xml                    — every post URL + lastmod, kept
 *       separate from the hand-maintained sitemap.xml.
 *
 * Each post also gets a stable `slug` field written back to Firestore (only
 * once — re-running never changes an already-assigned slug, so published
 * URLs never break), which blogs/js/blog.js reads to link feed cards to
 * these pages.
 *
 * Resilient: on any failure it logs and exits 0 WITHOUT touching existing
 * output, so a flaky run never ships a half-written batch or breaks a build.
 *
 *   node server/scripts/export-blog-posts.js
 */

const fs = require("fs");
const path = require("path");

const SITE = "https://www.prepportal.com.ng";
const ROOT = path.join(__dirname, "..", "..");
const DATA_OUT_DIR = path.join(ROOT, "data", "blogs");
const SITEMAP_OUT = path.join(ROOT, "sitemap-blogs.xml");

// Mirrors blogs/js/data.js SUBJECTS — keep both in sync when adding a subject.
const SUBJECTS = [
  {
    key: "plants",
    collectionName: "plantfacts-posts",
    name: "Plant Facts",
    labels: { plantfacts: "Plant Facts", botany: "Botany", horticulture: "Horticulture" },
  },
  {
    key: "animals",
    collectionName: "animalfacts-posts",
    name: "Animal Facts",
    labels: { animalfacts: "Animal Facts", zoology: "Zoology", wildlife: "Wildlife" },
  },
];
const CLASS_LABELS = {
  primary: (n) => `P${n}`,
  jss: (n) => `JSS ${n}`,
  ss: (n) => `SS ${n}`,
};
const CLASS_STYLES = { primary: "cls-primary", jss: "cls-jss", ss: "cls-ss" };

// ── small text helpers (ported from blogs/js/blog.js, DOM-free) ───────────
const escHtml = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]
  );

const stripHtml = (h) =>
  String(h || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function markdownToHtml(text) {
  if (!text) return text;
  const tagCount = (text.match(/<(h[1-6]|p|ul|ol|li|blockquote|table|pre|div)\b/gi) || []).length;
  if (tagCount >= 6) return text;
  let html = text;
  html = html.replace(/```[\w]*\n?/g, "").replace(/```/g, "");
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^[-*_]{3,}\s*$/gm, "<hr>");
  html = html.replace(/\*\*\*(.+?)\*\*\*/gs, "<strong><em>$1</em></strong>");
  html = html.replace(/___(.+?)___/gs, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/gs, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/gs, "<em>$1</em>");
  html = html.replace(/_(.+?)_/gs, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^[-*+]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[^]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<oli>$1</oli>");
  html = html.replace(
    /(<oli>[^]*?<\/oli>\n?)+/g,
    (m) => "<ol>" + m.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>") + "</ol>"
  );
  html = html.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>");
  const BLOCK = /^<(h[1-6]|p|ul|ol|blockquote|hr|table|pre|div|figure)/i;
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (BLOCK.test(block)) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
  return html;
}

const calcReadTime = (c) =>
  Math.max(1, Math.ceil(stripHtml(c).split(/\s+/).filter(Boolean).length / 200));

const getClassLabel = (classLevel) => {
  if (!classLevel) return "";
  const [type, num] = classLevel.split("-");
  return CLASS_LABELS[type] ? CLASS_LABELS[type](num) : classLevel;
};
const getClassStyle = (classLevel) => {
  if (!classLevel) return CLASS_STYLES.primary;
  if (classLevel.startsWith("primary")) return CLASS_STYLES.primary;
  if (classLevel.startsWith("jss")) return CLASS_STYLES.jss;
  return CLASS_STYLES.ss;
};

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "") || "lesson";

function metaDescription(post) {
  const src = post.excerpt && post.excerpt.trim() ? post.excerpt : stripHtml(post.content);
  if (src.length <= 155) return src;
  return src.slice(0, 155).replace(/\s+\S*$/, "") + "…";
}

function ms(x) {
  if (!x) return 0;
  if (typeof x.toMillis === "function") return x.toMillis();
  if (typeof x === "number") return x;
  return 0;
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function renderPostPage({ subject, post, slug }) {
  const subjLbl = subject.labels[post.subject] || subject.name;
  const clsLbl = getClassLabel(post.classLevel);
  const clsCls = getClassStyle(post.classLevel);
  const url = `${SITE}/blogs/${subject.key}/${slug}/`;
  const desc = metaDescription(post);
  const image = post.featuredImage || `${SITE}/og-image.png`;
  const publishedIso = post.publishedAt ? new Date(ms(post.publishedAt)).toISOString() : null;
  const dateLabel = publishedIso
    ? new Date(publishedIso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const rt = calcReadTime(post.content);
  const bodyHtml = markdownToHtml(post.content || "");
  const readerUrl = `/blogs/?s=${encodeURIComponent(subject.key)}#${post.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: desc,
    image: [image],
    datePublished: publishedIso || undefined,
    author: { "@type": "Organization", name: "Prep Portal" },
    publisher: {
      "@type": "Organization",
      name: "Prep Portal",
      logo: { "@type": "ImageObject", url: `${SITE}/logo/logo-light.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escHtml(post.title)} — ${escHtml(subjLbl)} | Prep Portal</title>
    <meta name="description" content="${escHtml(desc)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />

    <link rel="icon" type="image/svg+xml" href="/logo/logo-light.svg" />

    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escHtml(post.title)}" />
    <meta property="og:description" content="${escHtml(desc)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${escHtml(image)}" />
    <meta property="og:site_name" content="Prep Portal" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escHtml(post.title)}" />
    <meta name="twitter:description" content="${escHtml(desc)}" />
    <meta name="twitter:image" content="${escHtml(image)}" />

    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

    <link rel="stylesheet" href="/blogs/css/render.css" />
    <link rel="stylesheet" href="/blogs/css/blog.css" />
    <link rel="stylesheet" href="/utils/components/nav.css" />
    <link rel="stylesheet" href="/utils/theme/theme.css" />

    <script type="importmap">
      {
        "imports": {
          "firebase/app": "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js",
          "firebase/auth": "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js",
          "firebase/firestore": "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js"
        }
      }
    </script>
  </head>

  <body>
    <nav class="site-nav" data-nav="main"></nav>

    <div class="single-post-content">
      <h1 class="post-title">${escHtml(post.title)}</h1>
      <div class="post-badges">
        <span class="sci-badge sci-${escHtml(post.subject || "default")}">${escHtml(subjLbl)}</span>
        ${clsLbl ? `<span class="cls-badge ${clsCls}">${escHtml(clsLbl)}</span>` : ""}
      </div>
      <div class="post-meta">
        ${dateLabel ? `<span>${escHtml(dateLabel)}</span>` : ""}
        <span>${rt} min read</span>
      </div>

      ${post.featuredImage ? `<img class="post-featured-img" src="${escHtml(post.featuredImage)}" alt="${escHtml(post.title)}" loading="lazy" />` : ""}

      <div class="single-post-body">${bodyHtml}</div>

      <p style="margin-top:2rem;padding-top:1.5rem;border-top:var(--border-subtle,1px solid rgba(0,0,0,.1))">
        <a href="${readerUrl}">Open in the interactive reader</a> to like, comment, or explore videos and practice links for this lesson.
      </p>
      <p><a href="/blogs/?s=${encodeURIComponent(subject.key)}">&larr; More ${escHtml(subject.name)} lessons</a></p>
    </div>

    <script src="/utils/components/nav-builder.js" type="module"></script>
  </body>
</html>
`;
}

(async () => {
  const admin = require("firebase-admin");
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  else credential = admin.credential.cert(require("../serviceAccountKey.json"));
  if (!admin.apps.length) admin.initializeApp({ credential });
  const db = admin.firestore();

  const sitemapUrls = [];
  let totalPosts = 0;

  for (const subject of SUBJECTS) {
    const snap = await db.collection(subject.collectionName).get();
    const usedSlugs = new Set();
    const feedRecords = [];

    // Stable ordering so re-runs are deterministic and slug collisions resolve
    // the same way every time (oldest post keeps the plain slug).
    const docs = snap.docs
      .map((d) => ({ id: d.id, ref: d.ref, data: d.data() }))
      .filter((d) => !d.data.status || d.data.status === "published")
      .sort((a, b) => ms(a.data.publishedAt) - ms(b.data.publishedAt));

    for (const { id, ref, data } of docs) {
      const post = { id, ...data };
      let slug = post.slug;
      if (!slug) {
        let base = slugify(post.title);
        slug = base;
        let n = 2;
        while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
        await ref.update({ slug });
      }
      usedSlugs.add(slug);

      const html = renderPostPage({ subject, post, slug });
      writeFile(path.join(ROOT, "blogs", subject.key, slug, "index.html"), html);

      const lastmod = post.publishedAt ? new Date(ms(post.publishedAt)).toISOString().slice(0, 10) : null;
      sitemapUrls.push({ loc: `${SITE}/blogs/${subject.key}/${slug}/`, lastmod });

      feedRecords.push({
        id: post.id,
        slug,
        title: post.title,
        excerpt: post.excerpt || null,
        content: post.content || "",
        subject: post.subject || null,
        classLevel: post.classLevel || null,
        featuredImage: post.featuredImage || null,
        videoLink: post.videoLink || null,
        practiceLink: post.practiceLink || null,
        publishedAt: ms(post.publishedAt),
        modelUsed: post.modelUsed || null,
      });
    }

    feedRecords.sort((a, b) => b.publishedAt - a.publishedAt);
    writeFile(
      path.join(DATA_OUT_DIR, `${subject.key}.js`),
      `// AUTO-GENERATED by server/scripts/export-blog-posts.js — do not edit by hand.\nexport const POSTS = ${JSON.stringify(feedRecords)};\n`
    );
    totalPosts += feedRecords.length;
    console.log(`${subject.key}: exported ${feedRecords.length} post page(s)`);
  }

  const sitemapXml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemapUrls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n` +
          (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : "") +
          `    <changefreq>monthly</changefreq>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;
  writeFile(SITEMAP_OUT, sitemapXml);

  console.log(`Exported ${totalPosts} post page(s) across ${SUBJECTS.length} subject(s) → blogs/<subject>/<slug>/`);
  console.log(`Wrote sitemap-blogs.xml with ${sitemapUrls.length} URL(s).`);
  process.exit(0);
})().catch((e) => {
  console.error("export-blog-posts failed (keeping existing files):", e.message);
  process.exit(0); // never fail the build
});
