/* ============================================================================
   THE LETTERHEAD — a workbook turned into a school's own test paper
   ----------------------------------------------------------------------------
   Every workbook on this site prints with Prep Portal's name under its title,
   which is right for a child practising at home and wrong for a teacher
   setting a test. A paper that goes out to a class has the SCHOOL at the top
   of it: the name, the badge, the term, how long they have got and where the
   marks go. So the head of the sheet is made switchable.

   IT IS KEPT ONCE, NOT PER WORKBOOK. A teacher's school does not change
   between the spelling paper and the geometry paper, so the letterhead lives
   under one key and every workbook on the machine picks it up. Turning it on
   for the first time in the Algebra Workbook turns it on everywhere, which is
   what anybody setting a term's papers actually wants.

   THE LOGO IS REDRAWN BEFORE IT IS KEPT. A badge dragged off a school website
   is often a two-megabyte PNG, and localStorage gives you about five megabytes
   for everything. So an uploaded file is drawn onto a canvas at printing size
   and kept as a small PNG — which is also what stops a 4000-pixel crest
   printing as a grey smudge at 18mm wide.

   NOTHING HERE CHANGES AN ANSWER. The letterhead is cosmetic: it is in the
   COSMETIC set in print-pass.js, so changing it does not make the interactive
   sheet think it is looking at a different workbook.
   ========================================================================== */

const KEY = "wb-letterhead-v1";
/* Wide enough for a crest to print cleanly at 18mm, small enough that two of
   them and a term's workbooks still fit in localStorage. */
const LOGO_PX = 240;

export const BLANK = {
  on: false,
  school: "",
  line2: "",
  line3: "",
  logo: "",          // a data: URL, already redrawn small
  time: "",          // "1 hour 30 minutes"
  marks: false,      // a box for the score
  keepBy: false,     // keep the Prep Portal line as well
};

/** What is kept, or the blank one. */
export function loadHead() {
  try {
    const got = JSON.parse(localStorage.getItem(KEY) || "null");
    return got && typeof got === "object" ? { ...BLANK, ...got } : { ...BLANK };
  } catch { return { ...BLANK }; }
}

export function saveHead(head) {
  try { localStorage.setItem(KEY, JSON.stringify(head)); } catch { /* storage full or off */ }
}

/**
 * An uploaded file, redrawn at printing size.
 * → a data: URL, or "" if it could not be read.
 */
function shrink(file) {
  return new Promise((done) => {
    if (!file || !/^image\//.test(file.type)) { done(""); return; }
    const fr = new FileReader();
    fr.onerror = () => done("");
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => done("");
      img.onload = () => {
        const k = Math.min(1, LOGO_PX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * k));
        const h = Math.max(1, Math.round(img.height * k));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        /* PNG, because a crest usually has a transparent background and a JPEG
           would print it on a grey rectangle */
        try { done(c.toDataURL("image/png")); } catch { done(""); }
      };
      img.src = String(fr.result);
    };
    fr.readAsDataURL(file);
  });
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/**
 * Hang the letterhead controls on the rail.
 *
 *   host    where the fieldset goes
 *   onChange  called whenever anything changes, so the paper redraws
 * → { read(), write(saved) }
 */
export function mountLetterhead(host, onChange = () => {}) {
  const box = document.createElement("fieldset");
  box.className = "wb-fieldset wb-head";
  box.innerHTML = `
    <legend>Letterhead — for a school test</legend>
    <label class="wb-toggle">
      <input type="checkbox" id="wb-head-on" />
      Put a school heading on the paper
    </label>
    <div class="wb-head__body" id="wb-head-body" hidden>
      <label class="wb-field">
        <span>School or exam body</span>
        <input class="wb-input" id="wb-head-school" type="text" maxlength="64"
               autocomplete="off" placeholder="St Mary's International School" />
      </label>
      <label class="wb-field">
        <span>Second line</span>
        <input class="wb-input" id="wb-head-line2" type="text" maxlength="64"
               autocomplete="off" placeholder="First Term Examination, 2026" />
      </label>
      <label class="wb-field">
        <span>Third line</span>
        <input class="wb-input" id="wb-head-line3" type="text" maxlength="64"
               autocomplete="off" placeholder="Basic 5 · Mathematics" />
      </label>
      <label class="wb-field">
        <span>Time allowed</span>
        <input class="wb-input" id="wb-head-time" type="text" maxlength="32"
               autocomplete="off" placeholder="1 hour 30 minutes" />
      </label>
      <div class="wb-field">
        <span>Badge or logo</span>
        <div class="wb-head__logo">
          <img class="wb-head__shot" id="wb-head-shot" alt="" hidden />
          <input type="file" id="wb-head-file" accept="image/*" hidden />
          <button class="pp-btn pp-btn--ghost" id="wb-head-pick" type="button">Choose a picture</button>
          <button class="pp-btn pp-btn--ghost" id="wb-head-drop" type="button" hidden>Remove</button>
        </div>
      </div>
      <label class="wb-toggle">
        <input type="checkbox" id="wb-head-marks" />
        A box for the score
      </label>
      <label class="wb-toggle">
        <input type="checkbox" id="wb-head-keep" />
        Keep the Prep Portal line as well
      </label>
    </div>`;
  host.appendChild(box);

  const $ = (id) => box.querySelector(`#${id}`);
  const on = $("wb-head-on"), body = $("wb-head-body");
  const shot = $("wb-head-shot"), file = $("wb-head-file");
  const drop = $("wb-head-drop");
  let logo = "";

  const paint = () => {
    body.hidden = !on.checked;
    shot.hidden = !logo;
    drop.hidden = !logo;
    if (logo) shot.src = logo;
  };

  const read = () => ({
    on: on.checked,
    school: $("wb-head-school").value.trim(),
    line2: $("wb-head-line2").value.trim(),
    line3: $("wb-head-line3").value.trim(),
    time: $("wb-head-time").value.trim(),
    marks: $("wb-head-marks").checked,
    keepBy: $("wb-head-keep").checked,
    logo,
  });

  const changed = () => { paint(); saveHead(read()); onChange(); };

  box.addEventListener("input", changed);
  box.addEventListener("change", (e) => { if (e.target !== file) changed(); });
  $("wb-head-pick").addEventListener("click", () => file.click());
  drop.addEventListener("click", () => { logo = ""; file.value = ""; changed(); });
  file.addEventListener("change", async () => {
    logo = await shrink(file.files && file.files[0]);
    changed();
  });

  return {
    read,
    write(saved) {
      /* the letterhead is the TEACHER'S, not the workbook's: it comes from its
         own key, so a school set up in one workbook is already set up in the
         next one opened */
      const h = { ...loadHead(), ...(saved && typeof saved === "object" ? saved : {}) };
      on.checked = !!h.on;
      $("wb-head-school").value = h.school || "";
      $("wb-head-line2").value = h.line2 || "";
      $("wb-head-line3").value = h.line3 || "";
      $("wb-head-time").value = h.time || "";
      $("wb-head-marks").checked = !!h.marks;
      $("wb-head-keep").checked = !!h.keepBy;
      logo = h.logo || "";
      paint();
    },
  };
}

/**
 * The letterhead as it prints, or "" when it is off.
 *
 * Drawn as a band across the top of page one: the badge on the left, the
 * school's lines in the middle, the time and the marks box on the right —
 * which is where a teacher's eye goes for them, and where every exam paper
 * any of us has ever sat has put them.
 */
export function headBand(head) {
  const h = head && head.on ? head : null;
  if (!h) return "";
  const lines = [h.school, h.line2, h.line3].filter(Boolean);
  if (!lines.length && !h.logo && !h.time && !h.marks) return "";
  const right = (h.time ? `<p class="wb-head__time">Time allowed: <b>${esc(h.time)}</b></p>` : "")
    + (h.marks ? `<div class="wb-head__marks"><span>Score</span><em></em></div>` : "");
  return `<div class="wb-headband">`
    + (h.logo ? `<img class="wb-headband__logo" src="${h.logo}" alt="" />` : "")
    + `<div class="wb-headband__words">`
    + (lines[0] ? `<p class="wb-headband__school">${esc(lines[0])}</p>` : "")
    + lines.slice(1).map((l) => `<p class="wb-headband__line">${esc(l)}</p>`).join("")
    + `</div>`
    + (right ? `<div class="wb-headband__right">${right}</div>` : "")
    + `</div>`;
}

/** What goes in the running footer: the school, once it has a name. */
export const headFooter = (head) => (head && head.on && head.school ? head.school : "");
