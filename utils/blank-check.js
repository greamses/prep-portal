/* ============================================================================
   FILL-IN-THE-BLANK, CHECKED
   ----------------------------------------------------------------------------
   A blank's key is `accept`: the answers it takes, in plain typed form
   ("15", "6ax(3x-2y)", "4:3", "5 hours 42 minutes"). The first is the one
   shown. What the learner types is checked against each, so a blank is marked
   right or wrong like an objective question, not sent off to the AI.

   The checker forgives what does not change the answer:
     • spaces, case, a leading "x =", a leading a/an/the, ₦ $ # in front;
     • a unit after a number (15 cm = 15) — only the units in UNITS below, so
       "5x" is never read as 5;
     • the same number written another way (3/5 = 0.6, 1 7/12 = 19/12), and a
       decimal rounded to 2 places or more (26.67 for 80/3);
     • the order of bracketed factors, and of the letters in front of them
       ((4x+5)(4x-5) = (4x-5)(4x+5), 6xa(3x-2y) = 6ax(3x-2y));
     • × * x between numbers, ^(−2) for ^-2, the unicode minus.
   It does NOT turn one form into another (0.0104 is not 1.04×10^-2, and an
   unfactorised answer is not a factorised one): a key that wants a FORM is
   checked as that form.

   acceptFrom(answer) makes a key from a short LaTeX answer ("\\(x = 73\\)" →
   ["x=73"]); a long worked answer gives none (it needs its own key).
   ========================================================================== */

const UNITS = "cm\\^?2|cm²|m\\^?2|m²|sq ?cm|cm|mm|km/h|kmh|km|m|kg|g|litres?|liters?|l|ml|°|degrees?|deg|%|years?|yrs?|minutes?|mins?|hours?|hrs?|h|seconds?|secs?|s|days?|weeks?|inches|inch|in|cents?|kobo|naira|dollars?|pages?|times|units?|squares?|black squares|wrong answers|people|students|pupils";
const UNIT_TAIL = new RegExp(`^(.*?\\d)\\s*(?:${UNITS})\\.?$`, "i");

/** LaTeX (inside \( \)) to what a learner would type. */
export function plainFromTex(tex) {
  let s = String(tex ?? "");
  s = s.replace(/\\\(|\\\)|\\\[|\\\]/g, "");
  s = s.replace(/(\d)\s*\\[td]?frac/g, "$1 \\frac");      // 1\frac{7}{12} is the mixed number 1 7/12
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2")
      .replace(/\\(?:text|mathrm|mathbf)\{([^{}]*)\}/g, "$1")
      .replace(/\^\{\\circ\}/g, "°")
      .replace(/\^\{([^{}]*)\}/g, "^$1")
      .replace(/_\{([^{}]*)\}/g, "_$1");
  }
  s = s.replace(/\\times/g, "×").replace(/\\pm/g, "±").replace(/\\div/g, "÷")
    .replace(/\\%/g, "%").replace(/\\\$/g, "$").replace(/\\[,;!: ]/g, " ").replace(/\\circ/g, "°")
    .replace(/\\[a-zA-Z]+/g, "").replace(/[{}]/g, "");
  return s.replace(/\s+/g, " ").trim();
}

/** A key from a short answer; [] when the answer is a worked solution. */
export function acceptFrom(answer) {
  const p = plainFromTex(answer);
  if (!p || p.length > 40 || /cannot|misprint|=.*=/i.test(p)) return [];
  // "19/12 = 1 7/12": two ways of writing the one answer, both taken
  if (p.includes("=") && !/^[a-z]{1,2}\s*=/i.test(p)) return p.split("=").map((x) => x.trim()).filter(Boolean);
  return [p];
}

/* the value of a number, fraction or mixed number, or null */
function valueOf(s) {
  s = s.trim();
  let m = s.match(/^([-+]?)(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return (m[1] === "-" ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
  s = s.replace(/\s+/g, "");
  m = s.match(/^([-+]?\d*\.?\d+)\/(\d*\.?\d+)$/);
  if (m) return Number(m[2]) ? Number(m[1]) / Number(m[2]) : null;
  if (/^[-+]?(\d+,)*\d*\.?\d+$/.test(s)) return Number(s.replace(/,/g, ""));
  return null;
}

/* decimals the learner wrote, for rounding */
const places = (s) => ((s.match(/\.(\d+)/) || [, ""])[1]).length;

function tidy(raw) {
  let s = String(raw ?? "").normalize("NFKC").toLowerCase()
    .replace(/[−–—]/g, "-").replace(/[“”"']/g, "").replace(/\s+/g, " ").trim()
    .replace(/[.;]$/, "");
  s = s.replace(/^[a-z]{1,2}\s*=\s*(?=\S)/, "");          // "x = 6" → "6"  (one assignment only)
  s = s.replace(/^(?:a|an|the)\s+(?=[a-z])/, "");
  s = s.replace(/^[₦$#]\s*/, "");
  return s;
}

/* the number in "15 cm", "75%", "$7040", or null when it is not a bare amount */
function amount(s) {
  const m = s.match(UNIT_TAIL);
  const core = m ? m[1] : s;
  return valueOf(core);
}

function form(s) {
  s = s.replace(/\s+/g, "")
    .replace(/[×*]/g, "x").replace(/(\d)x(?=10\^)/g, "$1x")
    .replace(/\^\(([^()]*)\)/g, "^$1").replace(/²/g, "^2").replace(/³/g, "^3")
    .replace(/hours?|hrs?/g, "h").replace(/minutes?|mins?/g, "m").replace(/and/g, "")
    .replace(/\+-|-\+/g, "±");
  // a product of bracketed factors, with letters (and a number) in front
  const m = s.match(/^([-+]?\d*)([a-z]*)((?:\([^()]+\))+)$/);
  if (m) {
    const lead = m[1] + [...m[2]].sort().join("");
    const factors = m[3].match(/\([^()]+\)/g).sort();
    s = lead + factors.join("");
  }
  return s;
}

/** Is `input` one of the answers in `accept`? */
export function checkBlank(input, accept) {
  const keys = (Array.isArray(accept) ? accept : [accept]).filter((k) => k != null && String(k).trim());
  if (!keys.length) return null;
  const u = tidy(input);
  if (!u) return false;
  const uNum = amount(u);
  const uForm = form(u);
  for (const k0 of keys) {
    const k = tidy(k0);
    const kNum = amount(k);
    if (kNum != null && uNum != null) {
      if (Math.abs(uNum - kNum) < 1e-9) return true;
      const dp = places(u);
      if (dp >= 2 && Math.abs(uNum - kNum) <= 0.5 * 10 ** -dp + 1e-12) return true;
      continue;
    }
    if (form(k) === uForm) return true;
  }
  return false;
}
