/* ============================================================================
   A SCIENTIFIC CALCULATOR, for the workbook rail and anywhere else that needs
   one (the Toy Shop's till, for a start).
   ----------------------------------------------------------------------------
   IT SHOWS ITS WORKING. A calculator that shows nothing but the answer teaches
   a child to trust a number they cannot check, which is the opposite of what
   every page it sits on is for. So this one keeps the expression on the top
   line as it is typed, puts the answer underneath, and keeps the last several
   sums in a tape above — the way a real scientific calculator does, and the
   way a person checks whether they pressed what they meant to press.

   IT IS NOT A PARSER OF ANYTHING AND EVERYTHING. The grammar is small and
   stated below, and anything outside it is refused rather than guessed at. A
   calculator that quietly reads 2+ as 2 is worse than one that says it cannot.

     number     12   3.5   .5   1e3
     operator   + - x / ^        (x and * both multiply, / divides)
     brackets   ( )
     prefix     sin cos tan asin acos atan log ln sqrt abs
     postfix    ! %              (factorial, and percent-of-the-left)
     constant   pi e
     answer     Ans              the last answer, as a value

   DEGREES OR RADIANS is a switch, and it is on the face rather than buried,
   because the commonest wrong answer in school trigonometry is a right sum in
   the wrong mode.
   ========================================================================== */

/* ── the grammar ──────────────────────────────────────────────────────────
   A hand-written recursive-descent parser over a token list. Small enough to
   read in one sitting, which is the point: it can be checked.
   ------------------------------------------------------------------------*/

const FN1 = {
  sin: (x, deg) => Math.sin(deg ? (x * Math.PI) / 180 : x),
  cos: (x, deg) => Math.cos(deg ? (x * Math.PI) / 180 : x),
  tan: (x, deg) => Math.tan(deg ? (x * Math.PI) / 180 : x),
  asin: (x, deg) => (deg ? (Math.asin(x) * 180) / Math.PI : Math.asin(x)),
  acos: (x, deg) => (deg ? (Math.acos(x) * 180) / Math.PI : Math.acos(x)),
  atan: (x, deg) => (deg ? (Math.atan(x) * 180) / Math.PI : Math.atan(x)),
  log: (x) => Math.log10(x),
  ln: (x) => Math.log(x),
  sqrt: (x) => Math.sqrt(x),
  abs: (x) => Math.abs(x),
};

const NAMES = Object.keys(FN1).concat(["pi", "e", "Ans"]);

/** Break the written sum into tokens, or throw at the first thing that is not one. */
export function tokenise(src) {
  const out = [];
  let i = 0;
  const s = String(src ?? "").replace(/×/g, "x").replace(/÷/g, "/").replace(/−/g, "-");
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === ",") { i += 1; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d*(e[+-]?\d+)?/i.exec(s.slice(i));
      const text = m[0];
      if (!/\d/.test(text)) throw new Error(`that point is not a number`);
      out.push({ t: "num", v: Number(text) });
      i += text.length;
      continue;
    }
    if (/[a-z]/i.test(c)) {
      const m = /^[a-z]+/i.exec(s.slice(i));
      const word = m[0];
      /* a lone x is the multiplication sign people actually type, and it has to
         be caught here: the letter branch is reached first, so without this it
         is read as the start of a word and refused */
      if (word.toLowerCase() === "x") { out.push({ t: "x" }); i += 1; continue; }
      const name = NAMES.find((n) => n.toLowerCase() === word.toLowerCase());
      if (!name) throw new Error(`"${word}" is not one of its words`);
      out.push({ t: "name", v: name });
      i += word.length;
      continue;
    }
    if ("+-x*/^()!%".includes(c)) { out.push({ t: c === "*" ? "x" : c }); i += 1; continue; }
    throw new Error(`"${c}" is not a sign it knows`);
  }
  return out;
}

/**
 * Work the tokens out.
 *
 *   deg   whether sin/cos/tan are in degrees
 *   ans   what Ans stands for
 */
export function evaluate(tokens, { deg = true, ans = 0 } = {}) {
  let at = 0;
  const peek = () => tokens[at];
  const take = () => tokens[at++];

  /* lowest binding first: + and -, then x and /, then ^, then a prefix
     function or a sign, then the atom and whatever is stuck on its right */
  function sum() {
    let v = product();
    for (;;) {
      const t = peek();
      if (!t || (t.t !== "+" && t.t !== "-")) return v;
      take();
      v = t.t === "+" ? v + product() : v - product();
    }
  }
  function product() {
    let v = power();
    for (;;) {
      const t = peek();
      if (!t) return v;
      if (t.t === "x" || t.t === "/") {
        take();
        const r = power();
        if (t.t === "/" && r === 0) throw new Error("nothing divides by nought");
        v = t.t === "x" ? v * r : v / r;
        continue;
      }
      /* 2(3+4) and 2pi multiply without being told to, as they do on paper */
      if (t.t === "(" || t.t === "name") { v *= power(); continue; }
      return v;
    }
  }
  /* A SIGN BINDS LOOSER THAN AN EXPONENT: -3^2 is -(3^2), which is -9, and
     not (-3)^2. Taking the sign first gave 9 — the wrong answer to the one
     sum people use to check a calculator. And ^ is right-associative, so
     2^3^2 is 2^(3^2); the exponent is parsed by this same function. */
  function power() {
    const t = peek();
    if (t && (t.t === "-" || t.t === "+")) {
      take();
      const v = power();
      return t.t === "-" ? -v : v;
    }
    const base = postfix();
    const n = peek();
    if (n && n.t === "^") { take(); return base ** power(); }
    return base;
  }
  function postfix() {
    let v = atom();
    for (;;) {
      const t = peek();
      if (t && t.t === "!") {
        take();
        if (v < 0 || !Number.isInteger(v) || v > 170) throw new Error("! wants a whole number from 0 to 170");
        let f = 1;
        for (let k = 2; k <= v; k += 1) f *= k;
        v = f;
        continue;
      }
      if (t && t.t === "%") { take(); v /= 100; continue; }
      return v;
    }
  }
  function atom() {
    const t = take();
    if (!t) throw new Error("the sum stops in the middle");
    if (t.t === "num") return t.v;
    if (t.t === "(") {
      const v = sum();
      const close = take();
      if (!close || close.t !== ")") throw new Error("a bracket is left open");
      return v;
    }
    if (t.t === "name") {
      if (t.v === "pi") return Math.PI;
      if (t.v === "e") return Math.E;
      if (t.v === "Ans") return ans;
      /* a function takes what follows it, bracketed or not: sin30 and sin(30) */
      return FN1[t.v](power(), deg);
    }
    throw new Error("the sum stops in the middle");
  }

  const v = sum();
  if (at < tokens.length) throw new Error("there is more here than one sum");
  if (!Number.isFinite(v)) throw new Error("that does not come to a number");
  return v;
}

/** Work out a written sum in one call. */
export const compute = (src, opts) => evaluate(tokenise(src), opts);

/** An answer written for a display: full enough to be exact, short enough to read. */
export function writeAnswer(v) {
  if (Object.is(v, -0)) return "0";
  const r = Number(v.toPrecision(12));
  if (Math.abs(r) >= 1e12 || (r !== 0 && Math.abs(r) < 1e-9)) return r.toExponential(6).replace("e", " e");
  return String(r);
}

/* ── the face ─────────────────────────────────────────────────────────────*/

const KEYS = [
  /* [what it says, what it types, which kind] — "" types nothing and is acted on */
  [["sin", "sin("], ["cos", "cos("], ["tan", "tan("], ["(", "("], [")", ")"], ["DEL", "", "act"]],
  [["ln", "ln("], ["log", "log("], ["√", "sqrt("], ["x²", "^2"], ["xʸ", "^"], ["AC", "", "act"]],
  [["π", "pi"], ["e", "e"], ["Ans", "Ans"], ["7", "7", "num"], ["8", "8", "num"], ["9", "9", "num"]],
  [["n!", "!"], ["%", "%"], ["÷", "/", "op"], ["4", "4", "num"], ["5", "5", "num"], ["6", "6", "num"]],
  [["abs", "abs("], ["^", "^", "op"], ["×", "x", "op"], ["1", "1", "num"], ["2", "2", "num"], ["3", "3", "num"]],
  [["DEG", "", "act"], ["−", "-", "op"], ["+", "+", "op"], ["0", "0", "num"], [".", ".", "num"], ["=", "", "go"]],
];

/**
 * Put a calculator in `host`.
 *
 *   saved     { src, deg, tape } from last time
 *   onChange  told whenever any of that changes, so a page can keep it
 * → { el, value(), destroy() }
 */
export function mountCalculator(host, { saved = null, onChange = null } = {}) {
  const el = document.createElement("div");
  el.className = "wb-calc";
  el.innerHTML = `
    <div class="wb-calc__screen">
      <ol class="wb-calc__tape" data-tape aria-label="The sums before this one"></ol>
      <input class="wb-calc__src" type="text" inputmode="text" autocomplete="off" spellcheck="false"
             aria-label="The sum" placeholder="type a sum, or use the keys">
      <p class="wb-calc__out" data-out aria-live="polite">0</p>
    </div>
    <div class="wb-calc__pad">
      ${KEYS.map((row) => row.map(([face, types, kind = "fn"]) =>
        `<button type="button" class="wb-calc__key wb-calc__key--${kind}" data-k="${face}"`
        + ` data-types="${types}">${face}</button>`).join("")).join("")}
    </div>`;
  host.appendChild(el);

  const src = el.querySelector(".wb-calc__src");
  const out = el.querySelector("[data-out]");
  const tapeEl = el.querySelector("[data-tape]");
  const degKey = el.querySelector('[data-k="DEG"]');

  let state = { src: "", deg: true, tape: [], ans: 0 };
  if (saved && typeof saved === "object") state = { ...state, ...saved };

  const keep = () => onChange && onChange({ ...state, tape: state.tape.slice() });

  const paintTape = () => {
    tapeEl.innerHTML = state.tape.slice(-4)
      .map((t) => `<li><span>${t.src}</span><b>${t.out}</b></li>`).join("");
    tapeEl.scrollTop = tapeEl.scrollHeight;
  };

  /* The answer is worked out as it is typed, but a sum that is only half
     written is not an error yet — it just has nothing to show. */
  function look() {
    state.src = src.value;
    const text = src.value.trim();
    if (!text) { out.textContent = "0"; out.className = "wb-calc__out"; return; }
    try {
      const v = evaluate(tokenise(text), { deg: state.deg, ans: state.ans });
      out.textContent = writeAnswer(v);
      out.className = "wb-calc__out";
    } catch (err) {
      out.textContent = err.message;
      out.className = "wb-calc__out is-waiting";
    }
  }

  function equals() {
    const text = src.value.trim();
    if (!text) return;
    try {
      const v = evaluate(tokenise(text), { deg: state.deg, ans: state.ans });
      state.ans = v;
      state.tape.push({ src: text, out: writeAnswer(v) });
      if (state.tape.length > 24) state.tape.shift();
      out.textContent = writeAnswer(v);
      out.className = "wb-calc__out is-done";
      paintTape();
      keep();
    } catch (err) {
      out.textContent = err.message;
      out.className = "wb-calc__out is-no";
    }
  }

  function type(text) {
    const a = src.selectionStart ?? src.value.length;
    const b = src.selectionEnd ?? a;
    src.value = src.value.slice(0, a) + text + src.value.slice(b);
    const at = a + text.length;
    src.setSelectionRange(at, at);
    src.focus();
    look();
    keep();
  }

  el.querySelector(".wb-calc__pad").addEventListener("click", (e) => {
    const k = e.target.closest("[data-k]");
    if (!k) return;
    const name = k.dataset.k;
    if (name === "AC") {
      src.value = "";
      out.textContent = "0";
      out.className = "wb-calc__out";
      look(); keep(); src.focus();
      return;
    }
    if (name === "DEL") {
      const a = src.selectionStart ?? src.value.length;
      const b = src.selectionEnd ?? a;
      if (a === b && a > 0) { src.value = src.value.slice(0, a - 1) + src.value.slice(a); src.setSelectionRange(a - 1, a - 1); }
      else { src.value = src.value.slice(0, a) + src.value.slice(b); src.setSelectionRange(a, a); }
      src.focus(); look(); keep();
      return;
    }
    if (name === "DEG") {
      state.deg = !state.deg;
      dressDeg();
      look(); keep();
      return;
    }
    if (name === "=") { equals(); return; }
    type(k.dataset.types);
  });

  function dressDeg() {
    degKey.textContent = state.deg ? "DEG" : "RAD";
    degKey.setAttribute("aria-label", state.deg
      ? "Angles in degrees. Tap for radians"
      : "Angles in radians. Tap for degrees");
    el.classList.toggle("is-rad", !state.deg);
  }

  src.addEventListener("input", () => { look(); keep(); });
  src.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    equals();
  });

  src.value = state.src;
  dressDeg();
  paintTape();
  look();

  return {
    el,
    /** The number on the screen now, or null if it is not showing one. */
    value() {
      try { return evaluate(tokenise(src.value), { deg: state.deg, ans: state.ans }); } catch { return null; }
    },
    destroy() { el.remove(); },
  };
}
