/* ============================================================================
   The English workbooks — the bench they all stand on
   ----------------------------------------------------------------------------
   Five workbooks that differ only in what is on the paper. The maths ones each
   wire their own builder because each has dials of its own — a base to count
   in, a number of places after the point, a paper size that matters. These
   five have exactly two dials between them (how hard, how much help), so the
   wiring is written once here and each workbook passes its exercises in.

   A workbook's own js/main.js is then four lines long, which is the right
   length for a file whose job is to say WHICH workbook this is.

       import { mountEnglishBook } from "../../shared/book.js";
       import { GROUPS, EXERCISES } from "./exercises.js";
       mountEnglishBook({ id: "spelling-workbook", … });

   Everything else — the paper, the pagination, the seed, the answer key, the
   print pass, the marking — is the shared engine in
   /utils/components/workbook/, the same one the maths workbooks use.
   ========================================================================== */

import { mountBuilder } from "/utils/components/workbook/rail.js";
import { onAdmin } from "/utils/components/workbook/admin.js";
import { ICON as BASE } from "/utils/components/workbook/icons.js";
import { LEVELS, HELP, levelOf, helpOf } from "./levels.js";

const $ = (id) => document.getElementById(id);

function fillMenu(id, table) {
  const sel = $(id);
  if (!sel) return;
  sel.innerHTML = "";
  Object.values(table).forEach((v) => {
    const o = document.createElement("option");
    o.value = v.id;
    o.textContent = v.label;
    sel.appendChild(o);
  });
}

/**
 * Build one of the English workbooks.
 *
 *   id          the folder name, which is also the print-pass and feature part
 *   label       what it is called
 *   subjectLine the eyebrow over the title: "English · Spelling · …"
 *   exercises   the registry (EXERCISES)
 *   groups      the sections, in the order they go in the rail
 *   glyphs      { groupId: svg } — what each section is drawn as
 *   starter     { exerciseId: howMany } for a first visit
 *   chapters    { n: "Chapter n: …" } and chapterOf(ex), when there are chapters
 */
export function mountEnglishBook({
  id, label, subjectLine, exercises, groups, glyphs = {}, starter = {},
  icons = BASE, chapters = null, chapterOf = null, subtitle = null,
}) {
  fillMenu("en-level", LEVELS);
  fillMenu("en-help", HELP);

  const chaptersOn = (o) => (!chapters || !chapterOf ? [] : [...new Set((o.chosen || [])
    .map((c) => exercises.find((e) => e.id === c.id))
    .filter(Boolean)
    .map(chapterOf))].sort((a, b) => a - b));

  const SUBJECT = {
    eyebrow: (o) => {
      const list = chaptersOn(o);
      if (!list.length) return `${subjectLine} · Something to print`;
      if (list.length === 1) return `${subjectLine} · ${chapters[list[0]]}`;
      return `${subjectLine} · Chapters ${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
    },
    /* what the dials are set to, said in words rather than in their names */
    subtitle: subtitle || ((o) => {
      const L = levelOf(o), H = helpOf(o);
      return [
        L.id === "gentle" ? "short words, short sentences"
          : L.id === "middle" ? "longer words, the common exceptions"
            : "the awkward ones, where two rules meet",
        H.id === "show" ? "one done for you" : H.id === "help" ? "no examples" : "nothing named",
      ].join(" · ");
    }),
    exercises,
    /** Why an exercise cannot run under these settings, or null. */
    unavailable: (ex, o) => {
      if (ex.minLevel === "middle" && (o.level || "gentle") === "gentle") return "needs Middle or Stretch";
      if (ex.minLevel === "stretch" && o.level !== "stretch") return "needs Stretch";
      return null;
    },
    /* What opens a section: PrepBot's film, where the section has one, and
       the worked example until the learner turns it off.
       THE FILM PRINTS AT EVERY LEVEL OF HELP. It is not a scaffold to be
       faded — it is the lesson, and a child who has turned the examples off
       because they no longer need them has not stopped needing to be taught
       something new. (The maths workbooks do the same: see their
       subject.js.) */
    sectionHead: (section, o) => {
      const video = section.ex.video ? section.ex.video(section.opts) : "";
      if (helpOf(o).id !== "show" || !section.ex.worked) return video;
      return video + section.ex.worked(section.opts);
    },
  };

  mountBuilder({
    subject: SUBJECT,
    /* printing needs a subscription — /utils/components/workbook/print-pass.js */
    print: { workbook: id, label },
    interactive: {},
    store: `${id}-v1`,
    groups,
    glyphs,
    icons,
    title: label,
    starter,
    extra: {
      read: () => ({
        level: $("en-level").value,
        help: $("en-help").value,
        watermark: $("en-watermark")?.checked !== false,
      }),
      write: (saved) => {
        $("en-level").value = saved.level ?? "gentle";
        $("en-help").value = saved.help ?? "show";
        /* On for everyone. Only the switch that turns it off is held back,
           and only until the admin is known to be signed in. */
        if ($("en-watermark")) $("en-watermark").checked = saved.watermark !== false;
      },
    },
  });

  onAdmin(() => { const row = $("en-watermark-row"); if (row) row.hidden = false; });
}
