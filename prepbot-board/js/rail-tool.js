/* ============================================================================
   PrepBoard, from anywhere
   ----------------------------------------------------------------------------
   The board is its own page (/prepbot-board/), with its own sign-in check,
   voice and stream. Everywhere else reaches it through this file:

   • boardTool — a key for the side rails (workbook/toolbar.js mountTools, and
     the workbook's own rail in interactive.js): the real board, in a panel,
     in a frame — the same bargain the Chemistry Bench key makes.
   • openBoard(question) — PrepBot's chat "/explainer <question>": the board in
     a panel, already explaining that question.
   • boardAllowed() — whether this learner may use it (feature "whiteboard"),
     so a key nobody can use is not put on their rail.
   ========================================================================== */

export const BOARD_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="2.4" y="3.4" width="19.2" height="13.4" fill="#fffdf6" stroke="#6fb7e8" stroke-width="1.6"/><path d="M5.2 13.4c2-4.6 4.2-6.6 6.4-6.6s3.6 2.2 6.6 1.2" fill="none" stroke="#d9534f" stroke-width="1.8" stroke-linecap="round"/><rect x="11" y="16.8" width="2" height="4.2" fill="#6fb7e8"/><rect x="7.4" y="20" width="9.2" height="1.8" rx="0.9" fill="#6fb7e8"/></svg>`;

const src = (question = "") => {
  const p = new URLSearchParams({ embed: "1" });
  if (question) p.set("q", question.slice(0, 400));
  return `/prepbot-board/?${p}`;
};

function frameInto(body, question) {
  body.classList.add("wb-panel__body--bare");
  const f = document.createElement("iframe");
  f.src = src(question);
  f.title = "PrepBoard";
  f.setAttribute("allow", "autoplay; microphone; fullscreen");
  f.style.cssText = "display:block;width:100%;height:100%;min-height:420px;border:0;background:#fbf7ee";
  body.appendChild(f);
  return () => f.remove();
}

/** The rail key: { label, size, icon, open(body) } as mountTools and the workbook rail expect. */
export const boardTool = {
  label: "PrepBoard",
  size: { w: 980, h: 640 },
  icon: BOARD_ICON,
  open: (body) => frameInto(body, ""),
};

/** Open the board in a panel on this page, explaining `question`. */
export async function openBoard(question = "") {
  const { openPanel, needCss } = await import("/utils/components/workbook/panels.js");
  needCss("/utils/components/workbook.css");
  const panel = openPanel({ title: "PrepBoard", size: boardTool.size, icon: BOARD_ICON });
  panel.undo = frameInto(panel.body, question);
  return panel;
}

let verdict = null;
/** May this learner use the board? (cached for the page) */
export function boardAllowed() {
  if (verdict) return verdict;
  verdict = (async () => {
    try {
      const [{ auth }, { resolveUserAccess }, { getProfile }] = await Promise.all([
        import("/firebase-init.js"),
        import("/utils/features.js"),
        import("/utils/data-service.js"),
      ]);
      if (auth.authStateReady) await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) return false;
      const profile = await getProfile(user.uid).catch(() => null);
      const v = await resolveUserAccess({ featureId: "whiteboard", profile: profile || {}, email: user.email });
      return !!v.allowed;
    } catch {
      return false;
    }
  })();
  return verdict;
}
