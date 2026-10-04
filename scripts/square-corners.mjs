/* Square every rounded corner on the site, and leave the circles.
   node scripts/square-corners.mjs            dry run (the report goes to the temp folder)
   node scripts/square-corners.mjs --write    do it

   A corner radius is KEPT when the thing is a circle:
     - the value is a percentage of 50 or more (50%, 100%, "50% 50% 46% 46%"), or
     - the value is a big "pill" number (999px …) AND the same rule makes the
       box square (width and height the same, or aspect-ratio 1) — then it is
       rewritten as 50%, which is what it meant, or
     - the rule is named for a round thing (dot, avatar, knob, node, led …).
   Everything else becomes 0. Pills are not circles: they are squared.
   SVG drawings (rx=, canvas roundRect) are not touched at all. */
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const WRITE = process.argv.includes("--write");
const ROOT = process.cwd();
const files = execSync("git ls-files -- *.css *.js *.mjs *.html", { cwd: ROOT, maxBuffer: 1 << 26 }).toString().split("\n")
  .filter((f) => f && !/node_modules|\.min\.|vendor\/|^scratch|package-lock/.test(f));

const ROUND_NAME = /(^|[-_.\s#])(dot|dots|avatar|circle|circ|round|knob|bullet|radio|orb|ball|pip|pips|led|bulb|spinner|ring|node|bead|coin|pin|blob|bubble-dot|eye|pupil|moon|sun|planet|badge-dot|swatch-dot)s?([-_\s,:.{[]|$)/i;
const BIG = /^(?:9{2,}|[1-9]\d{2,})(?:px)?$|^(?:\d+(?:\.\d+)?)(?:em|rem)$/;      // 99px, 999px, 100px, 50em …

const report = { kept: 0, tocircle: [], squared: 0, pills: [], byName: [], tokens: [], files: 0 };

/** The declarations around position i: back to the opening brace or quote, on to the closing one. */
function around(text, i) {
  let a = i, b = i;
  for (let k = 0; k < 900 && a > 0; k++, a--) { const c = text[a - 1]; if (c === "{" || c === "}" ) break; }
  for (let k = 0; k < 900 && b < text.length; k++, b++) { const c = text[b]; if (c === "}" || c === "{") break; }
  /* the selector: back from the brace to the previous closing brace */
  let s = a - 1;
  for (let k = 0; k < 400 && s > 0; k++, s--) { const c = text[s - 1]; if (c === "}" || c === ";" || c === ">") break; }
  return { body: text.slice(a, b), selector: text.slice(s, a) };
}
const isSquareBox = (body) => {
  if (/aspect-ratio\s*:\s*1(\s*\/\s*1)?\s*[;}"'`]/.test(body + ";")) return true;
  const w = /(?:^|[;{\s"'`])(?:width|inline-size)\s*:\s*([^;}"'`]+)/.exec(body);
  const h = /(?:^|[;{\s"'`])(?:height|block-size)\s*:\s*([^;}"'`]+)/.exec(body);
  return !!(w && h && w[1].trim() === h[1].trim() && !/auto|100%|%$/.test(w[1].trim()));
};

function decide(value, ctx) {
  const v = value.trim().replace(/\s*!important/, "");
  const imp = /!important/.test(value) ? " !important" : "";
  if (/^(0|0px|0mm|0rem|0em|none)$/.test(v) || /^(inherit|initial|unset|revert)$/.test(v)) return null;
  if (/\$\{/.test(v)) return null;                       // computed in JS: left alone
  const pcts = [...v.matchAll(/(\d+(?:\.\d+)?)%/g)].map((m) => Number(m[1]));
  if (pcts.length && Math.max(...pcts) >= 46) { report.kept++; return null; }
  if (/^var\(--radius-(full|circle|round)/.test(v)) { report.kept++; return null; }
  if (/^var\(/.test(v) || /^calc\(.*var\(/.test(v)) {
    /* a token: the token is what gets set to 0 (below), the use is left */
    if (isSquareBox(ctx.body) && /radius-(pill|full)/.test(v)) { report.tocircle.push(ctx.where); return "50%" + imp; }
    return null;
  }
  const first = v.split(/[\s/]+/)[0];
  if (BIG.test(first) || /^(?:\d+(?:\.\d+)?)mm$/.test(first)) {
    if (isSquareBox(ctx.body)) { report.tocircle.push(ctx.where); return "50%" + imp; }
  }
  /* named for a round thing AND rounded all the way (a pill value, or millimetres of at least 3): a circle whose size is set somewhere else */
  const fully = BIG.test(first) || (/^(\d+(?:\.\d+)?)mm$/.test(first) && parseFloat(first) >= 3);
  if (fully && ROUND_NAME.test(ctx.selector) && !/scrollbar|track/.test(ctx.selector)) { report.byName.push(`${ctx.where}  ${ctx.selector.trim().slice(-60)}  ${v}`); return null; }
  if (BIG.test(first)) report.pills.push(`${ctx.where}  ${ctx.selector.trim().slice(-70)}`);
  report.squared++;
  return "0" + imp;
}

for (const f of files) {
  const p = path.join(ROOT, f);
  let text = fs.readFileSync(p, "utf8");
  const before = text;
  const lineOf = (i) => text.slice(0, i).split("\n").length;

  /* 1 · declarations in CSS (and CSS written inside JS and HTML) */
  text = text.replace(/(border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius\s*:\s*)([^;}"'`\n]+)/g, (m, head, value, i) => {
    const out = decide(value, { ...around(before, i), where: `${f}:${before.slice(0, i).split("\n").length}` });
    return out == null ? m : head + out + (/\s$/.test(value) ? " " : "");
  });

  /* 2 · style set from JS: el.style.borderRadius = "8px"  /  borderRadius: "8px" */
  text = text.replace(/(borderRadius\s*[:=]\s*)(["'`])([^"'`]+)\2/g, (m, head, q, value, i) => {
    const out = decide(value, { body: before.slice(Math.max(0, i - 300), i + 300), selector: "", where: `${f}:${before.slice(0, i).split("\n").length}` });
    return out == null ? m : `${head}${q}${out.trim()}${q}`;
  });

  /* 3 · the tokens: a custom property that IS a corner radius */
  text = text.replace(/(--(?:radius(?!-(?:full|circle|round|none))[\w-]*|[\w-]*-radius|_r(?:-\w+)?|r)\s*:\s*)([^;}\n]+)/g, (m, head, value, i) => {
    const v = value.trim();
    if (/^(0|0px)$/.test(v) || /%/.test(v) && Number((/(\d+)%/.exec(v) || [])[1]) >= 46 && !/min\(|max\(|clamp\(/.test(v)) return m;
    if (/^\d|^min\(|^max\(|^clamp\(|^calc\(|^var\(/.test(v)) { report.tokens.push(`${f}:${before.slice(0, i).split("\n").length}  ${head.trim()} ${v}`); return head + "0"; }
    return m;
  });

  if (text !== before) {
    report.files++;
    if (WRITE) fs.writeFileSync(p, text);
  }
  void lineOf;
}

console.log(`${WRITE ? "WROTE" : "DRY RUN"}: ${report.files} files · squared ${report.squared} · kept as circles (percent) ${report.kept} · pill-value made 50% on a square box ${report.tocircle.length} · kept by name ${report.byName.length} · tokens zeroed ${report.tokens.length}`);
fs.writeFileSync(path.join(os.tmpdir(), "square-corners-report.txt"),
  ["== TOKENS", ...report.tokens, "", "== KEPT BY NAME", ...report.byName, "", "== PILL VALUE -> 50% (square box)", ...report.tocircle, "", "== PILL VALUES SQUARED", ...report.pills].join("\n"));
