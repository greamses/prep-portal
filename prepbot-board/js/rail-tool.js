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

const LOAD_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="13" height="16" fill="#fffdf6" stroke="#6fb7e8" stroke-width="1.6"/><path d="M6 7.5h7M6 11h7M6 14.5h4" stroke="#9aa6b2" stroke-width="1.6"/><path d="M14.5 12.5h6.5m-2.6-2.8 2.8 2.8-2.8 2.8" fill="none" stroke="#d9534f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * The rail key for a page that shows ONE question at a time (the CBT question page):
 * the board with a "Load question" button over it, which lays the question on screen
 * on a fresh board and has PrepBot explain it. `getQuestion()` → { text, name } | null.
 */
export function questionBoardTool(getQuestion) {
  return {
    ...boardTool,
    open(body) {
      body.classList.add("wb-panel__body--bare");
      body.style.display = "flex";
      body.style.flexDirection = "column";
      const bar = document.createElement("div");
      bar.style.cssText = "display:flex;align-items:center;gap:10px;padding:6px 10px;border-bottom:1px solid rgba(0,0,0,.08);background:#fbf7ee";
      bar.innerHTML = `<button type="button" class="pb-loadq" data-tip="Put this question on the board and have PrepBot explain it">${LOAD_ICON}<span>Load question</span></button><span class="pb-loadq-note" style="font-size:12px;opacity:.65"></span>`;
      body.appendChild(bar);
      const host = document.createElement("div");
      host.style.cssText = "flex:1;min-height:0;display:flex";
      body.appendChild(host);
      const undo = frameInto(host, "");
      const f = host.querySelector("iframe");
      f.style.flex = "1";
      const note = bar.querySelector(".pb-loadq-note");
      let ready = false, pending = null;
      const send = (q) => f.contentWindow?.postMessage({ type: "pp-board-question", text: q.text, name: q.name }, location.origin);
      const onMsg = (e) => {
        if (e.source !== f.contentWindow || e.data?.type !== "pp-board-ready") return;
        ready = true;
        if (pending) { send(pending); pending = null; }
      };
      window.addEventListener("message", onMsg);
      bar.querySelector(".pb-loadq").addEventListener("click", () => {
        const q = getQuestion();
        if (!q || !q.text) { note.textContent = "No question on screen yet."; return; }
        note.textContent = `${q.name} is on the board.`;
        if (ready) send(q); else pending = q;
      });
      return () => { window.removeEventListener("message", onMsg); undo(); bar.remove(); host.remove(); };
    },
  };
}

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
