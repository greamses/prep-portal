/* ============================================================================
   ALGEBRA MOVES - the shell the workspace is built into
   ----------------------------------------------------------------------------
   The markup lives here and not in index.html because the workspace is mounted
   in two places now: its own page, and a panel in the printable workbooks'
   sidebar. One template, so the two can never drift apart.
   ========================================================================== */

import { UI } from "/utils/components/ui-icons.js";
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
                  title="Put a problem on the canvas" aria-label="Put a problem on the canvas">
            ${UI.plus(17)}
            <em>New</em>
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-pinkey" hidden
                  title="Pin a sticky note on the canvas" aria-label="Pin a sticky note on the canvas">
            <em>Pin a note</em>
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-book" hidden
                  title="The formula book" aria-label="The formula book">
            <em>Formulas</em>
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--do" type="button" id="am-work"
                  title="How many steps are left?" aria-label="How many steps are left?">
            ${UI.steps(17)}
            <em>Steps left</em>
          </button>
        </div>

        <div class="am-rail__group">
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-zoom-out" title="Zoom out" aria-label="Zoom out">
            ${UI.zoomOut(17)}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-zoom-in" title="Zoom in" aria-label="Zoom in">
            ${UI.zoomIn(17)}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-zoom-reset" title="Back to the middle" aria-label="Back to the middle">
            ${UI.recentre(17)}
          </button>
          <button class="pp-sticky pp-note-btn am-tool am-tool--plain" type="button" id="am-full" aria-pressed="false"
                  title="Fill the screen" aria-label="Fill the screen">
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

            <div class="am-starters" id="am-starters"></div>
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
