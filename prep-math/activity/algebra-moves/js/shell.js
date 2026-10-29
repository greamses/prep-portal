/* ============================================================================
   ALGEBRA MOVES - the shell the workspace is built into
   ----------------------------------------------------------------------------
   The markup lives here and not in index.html because the workspace is mounted
   in two places now: its own page, and a panel in the printable workbooks'
   sidebar. One template, so the two can never drift apart.
   ========================================================================== */

import { UI } from "/utils/components/ui-icons.js";
import { PIN } from "./notes.js";

/* Going live, in the house's filled icon language: a red dot sending out two
   signal arcs either side. */
const LIVE_ICON = `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">`
  + `<circle cx="12" cy="12" r="3.4" fill="var(--accent-danger,#c0453f)"/>`
  + `<path d="M7.6 7.4a6.4 6.4 0 0 0 0 9.2M16.4 7.4a6.4 6.4 0 0 1 0 9.2" fill="none" stroke="var(--accent-secondary,#6aa5d8)" stroke-width="2.2" stroke-linecap="round"/>`
  + `<path d="M4.6 4.6a10.4 10.4 0 0 0 0 14.8M19.4 4.6a10.4 10.4 0 0 1 0 14.8" fill="none" stroke="var(--accent-warning,#e0a63a)" stroke-width="2.2" stroke-linecap="round"/></svg>`;
/** Everything inside the frame: the canvas, the rail and the keypad drawer. */
export function shellHTML() {
  return `
      <div class="am-paint" aria-hidden="true"></div>

      <div class="am-canvas" id="am-canvas" touch-action="none"></div>

      <!-- ── What the tool is saying ─────────────────────────────────── -->
      <p class="am-say" id="am-say" role="status" aria-live="polite"></p>

      <!-- ── The rail ────────────────────────────────────────────────── -->
      <div class="am-rail" role="toolbar" aria-label="Canvas tools">
        <div class="am-rail__group">
          <button class="pp-sticky pp-note-btn am-tool am-tool--key" type="button" id="am-add"
                  aria-expanded="false" aria-controls="am-drawer"
                  data-tip="New: put a problem on the canvas" aria-label="Put a problem on the canvas">
            ${UI.plus(17)}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-pinkey" hidden
                  data-tip="Pin a sticky note on the canvas" aria-label="Pin a sticky note on the canvas">
            ${PIN.replace('width="14" height="14"', 'width="17" height="17"')}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-book" hidden
                  data-tip="The formula book" aria-label="The formula book">
            ${UI.book(17)}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--live" type="button" id="am-golive"
                  data-tip="Go live: send the link, and your class works on this canvas with you"
                  aria-label="Start a live lesson">
            ${LIVE_ICON}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--do" type="button" id="am-work"
                  data-tip="Steps left: how far this one has to go" aria-label="How many steps are left?">
            ${UI.steps(17)}
          </button>
        </div>

        <div class="am-rail__group">
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain am-tool--times" type="button" id="am-times"
                  data-tip="Multiplication sign: switch between a dot and ×" aria-label="Multiplication sign: switch between a dot and ×" aria-pressed="false">
            <span class="am-times__sign" aria-hidden="true">·</span>
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain am-tool--autofactor" type="button" id="am-autofactor"
                  data-tip="Factor fractions automatically: off" aria-label="Factor fractions automatically" aria-pressed="false">
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><rect x="7" y="3.4" width="10" height="5.4" rx="1" fill="var(--accent-secondary,#6aa5d8)"/><rect x="3" y="10.7" width="18" height="2.6" rx="1.3" fill="currentColor"/><rect x="5" y="15.2" width="14" height="5.4" rx="1" fill="var(--accent-warning,#e8a838)"/></svg>
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-zoom-out" data-tip="Zoom out" aria-label="Zoom out">
            ${UI.zoomOut(17)}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-zoom-in" data-tip="Zoom in" aria-label="Zoom in">
            ${UI.zoomIn(17)}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-zoom-reset" data-tip="Back to the middle" aria-label="Back to the middle">
            ${UI.recentre(17)}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-full" aria-pressed="false"
                  data-tip="Fill the screen" aria-label="Fill the screen">
            ${UI.expand(17)}
          </button>
        </div>

        <span class="am-count" id="am-count"></span>
      </div>

      <!-- ── The keypad, in a drawer ─────────────────────────────────── -->
      <section class="am-drawer" id="am-drawer" aria-label="Put a problem on the canvas" inert>
        <!-- The place you type is a receipt, like every other paper the site
             hands you. The wrapper carries the shadow, the inner paper carries
             the torn edge; the scrolling is a third element inside both, or the
             teeth get cut off the moment the content is taller than the drawer. -->
        <div class="am-drawer__paper pp-receipt">
         <div class="pp-receipt__paper">
          <div class="am-drawer__roll">
          <button class="pp-sticky pp-note-btn am-drawer__close" type="button" id="am-drawer-close" aria-label="Put the keypad away">
            ${UI.close(16)}
          </button>

          <!-- The formula book is not in here: it is a tool on the side rail,
               beside the calculator (see mountFormulaBook). -->
          <div class="am-pane" id="am-pane-type">
            <div class="am-keypad" id="am-keypad"></div>

            <p class="am-note">
              <a class="am-link" href="./api.html">see the engine</a>
            </p>
          </div>

          </div>
         </div>
        </div>
      </section>
`;
}
