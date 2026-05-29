/**
 * Regenerates the offline mirror of the Grammar Police book.
 *
 *   node scripts/gen-book-fallback.js
 *
 * The API (GET /api/grammar/book) is canonical; this snapshot is only loaded
 * by the browser when the backend is unreachable (e.g. Live Server with no
 * server running). Run this after editing server/content/grammarBook.js.
 */
const fs = require("fs");
const path = require("path");

const book = require("../server/content/grammarBook");
const out = path.join(
  __dirname,
  "..",
  "writing",
  "activity",
  "grammar-police",
  "js",
  "data",
  "book.fallback.js"
);

const header =
  "// AUTO-GENERATED offline mirror of server/content/grammarBook.js\n" +
  "// Used by book-service.js ONLY when /api/grammar/book is unreachable\n" +
  "// (e.g. Live Server with no backend). The API copy is canonical.\n" +
  "// Regenerate: node scripts/gen-book-fallback.js\n\nexport default ";

fs.writeFileSync(out, header + JSON.stringify(book, null, 2) + ";\n");
console.log("wrote", path.relative(process.cwd(), out));
