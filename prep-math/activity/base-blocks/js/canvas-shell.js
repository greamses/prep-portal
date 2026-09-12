/* ============================================================================
   MANIPULATIVES — the shell the canvas is built into
   ----------------------------------------------------------------------------
   The markup lives here and not in index.html because the canvas is mounted in
   two places now: its own page, and a panel in the printable workbooks'
   sidebar — one template, so the two can never drift apart. The same split
   Algebra Moves made when it went into a panel.

   NOT shell.js: that name was already taken here, by the builders for the
   entry shelf, the canvas view and the dock.
   ========================================================================== */

/** Everything inside the canvas view: stage, rail, flyouts and board. */
export function canvasShellHTML() {
  return `
      <div class="bb-frame">
        <div class="bb-stage" data-game-stage>
          <canvas id="bb-canvas" touch-action="none"></canvas>
          <div class="bb-marquee" id="bb-marquee" hidden></div>

          <!-- ── the running total, and nothing else ──────────────────── -->
          <div class="bb-top pp-sticky pp-sticky--c3">
            <div class="bb-count">
              <b id="bb-count-n">0</b>
              <span id="bb-count-sub">units on the canvas</span>
            </div>
          </div>

          <!-- ── tools ─────────────────────────────────────────────────────
               ONE rail: every control on the canvas is a key in it. Keys are
               icons and name themselves on hover or focus; a key with a corner
               arrow has more behind it, and opens a panel beside the rail. -->
          <div class="bb-rail" role="toolbar" aria-label="Tools">
            <div class="pp-receipt__paper bb-paper bb-rail__paper">
              <!-- PUT ON: the two ways something new gets onto the paper. Add
                   opens the shelf of tools and pieces; Note is DRAGGED out. -->
              <div class="bb-kit" role="group" aria-label="Put something on the canvas">
                <span class="bb-kit__label">Put on</span>
                <div class="bb-kit__grid">
                  <button class="bb-tool bb-tool--menu" type="button" data-menu="add"
                          aria-haspopup="true" aria-expanded="false"
                          aria-label="Add a tool or a piece to the canvas" title="Add">
                    <span data-icon="plus"></span><em>Add</em>
                  </button>
                  <button class="bb-tool bb-tool--drag" type="button" id="bb-note-btn"
                          aria-label="Drag a sticky note onto the canvas and type on it"
                          title="Drag a note onto the canvas">
                    <span data-icon="note"></span><em>Note</em>
                  </button>
                  <button class="bb-tool bb-tool--menu" type="button" data-menu="paint"
                          aria-haspopup="true" aria-expanded="false"
                          aria-label="Highlight the picked things" title="Highlight">
                    <span data-icon="brush"></span><em>Highlight</em>
                  </button>
                </div>
              </div>

              <div class="bb-kit" role="group" aria-label="Change the blocks">
                <span class="bb-kit__label">Blocks</span>
                <div class="bb-kit__grid">
                  <button class="bb-tool" type="button" data-act="regroup"
                          aria-label="Regroup the picked blocks into the best grouping for this base (R)"
                          title="Regroup — best grouping for this base (R)">
                    <span data-icon="regroup"></span><em>Regroup</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="split"
                          aria-label="Split the picked blocks (S)" title="Split (S)">
                    <span data-icon="split"></span><em>Split</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="merge"
                          aria-label="Merge the picked blocks (M)" title="Merge (M)">
                    <span data-icon="merge"></span><em>Merge</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="break"
                          aria-label="Break the picked blocks into unit cubes (B)" title="Break to units (B)">
                    <span data-icon="crumbs"></span><em>To units</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="match"
                          aria-label="Pick every block the same size as this one" title="Match every block this size">
                    <span data-icon="match"></span><em>Match</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="lasso" aria-pressed="false"
                          aria-label="Box pick: drag on the paper to sweep up blocks" title="Box pick">
                    <span data-icon="lasso"></span><em>Box pick</em>
                  </button>
                </div>
              </div>


              <!-- MOVE: where a piece is and which way up it is — including the
                   third dimension, which is the only part of this canvas the flat
                   view cannot show you — and how it lands when you let go. -->
              <div class="bb-kit" role="group" aria-label="Move the picked things">
                <span class="bb-kit__label">Move</span>
                <div class="bb-kit__grid">
                  <button class="bb-tool" type="button" data-act="turn"
                          aria-label="Turn the picked things a quarter turn on the paper (Q)"
                          title="Turn a quarter turn on the paper (Q)">
                    <span data-icon="turn"></span><em>Turn</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="tip"
                          aria-label="Tip the picked things a quarter turn onto another face (E)"
                          title="Tip onto another face (E)">
                    <span data-icon="tip"></span><em>Tip</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="lift"
                          aria-label="Lift the picked things a unit off the paper (U)"
                          title="Lift it off the paper (U)">
                    <span data-icon="lift"></span><em>Lift</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="lower"
                          aria-label="Let the picked things down a unit (D)"
                          title="Let it down (D)">
                    <span data-icon="lower"></span><em>Down</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="snapGrid"
                          aria-pressed="false"
                          aria-label="Snap to the squares of the paper (G)"
                          title="Snap to the squares (G)">
                    <span data-icon="grid"></span><em>Squares</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="snapSide"
                          aria-pressed="true"
                          aria-label="Snap flush against the piece beside it (F)"
                          title="Snap flush to a side (F)">
                    <span data-icon="flush"></span><em>Flush</em>
                  </button>
                </div>
              </div>

              <!-- CANVAS: what happens to the whole sheet, including leaving it -->
              <div class="bb-kit" role="group" aria-label="The canvas">
                <span class="bb-kit__label">Canvas</span>
                <div class="bb-kit__grid">
                  <button class="bb-tool" type="button" data-act="tidy"
                          aria-label="Tidy the canvas into rows (T)" title="Tidy up (T)">
                    <span data-icon="rows"></span><em>Tidy</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="undo"
                          aria-label="Undo the last change (Ctrl+Z)" title="Undo (Ctrl+Z)">
                    <span data-icon="undo"></span><em>Undo</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="redo"
                          aria-label="Step forward again (Ctrl+Y)" title="Redo (Ctrl+Y)">
                    <span data-icon="redo"></span><em>Redo</em>
                  </button>
                  <button class="bb-tool bb-tool--danger" type="button" data-act="delete"
                          aria-label="Remove the picked things (Delete)" title="Remove (Del)">
                    <span data-icon="trash"></span><em>Remove</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="quiet"
                        aria-pressed="false"
                        aria-label="Turn the pop-ups off: no messages, no offers to trade"
                        title="Quiet: no pop-ups">
                  <span data-icon="quiet"></span><em>Quiet</em>
                </button>
                <button class="bb-tool" type="button" data-act="pick"
                        aria-pressed="false"
                        aria-label="The pick tool: move, resize or close a card (P)"
                        title="Pick: handle the cards themselves (P)">
                  <span data-icon="pick"></span><em>Pick</em>
                </button>
                <button class="bb-tool bb-tool--menu" type="button" data-menu="keys"
                          aria-haspopup="dialog" aria-expanded="false"
                          aria-label="Every shortcut on this canvas (?)"
                          title="The keys (?)">
                    <span data-icon="keys"></span><em>Keys</em>
                  </button>
                  <button class="bb-tool" type="button" data-act="back"
                          aria-label="Back to the shelf" title="Back to the shelf">
                    <span data-icon="back"></span><em>Shelf</em>
                  </button>
                </div>
              </div>

              <div class="bb-kit" role="group" aria-label="The number">
                <span class="bb-kit__label">Number</span>
                <div class="bb-kit__grid">
                  <button class="bb-tool bb-tool--menu" type="button" id="bb-base-btn"
                          data-menu="base" aria-haspopup="dialog" aria-expanded="false"
                          title="Working base">
                    <span data-icon="base"></span>
                    <b class="bb-tool__badge" id="bb-base-label">10</b>
                    <em>Base</em>
                  </button>
                  <button class="bb-tool" type="button" id="bb-board-btn" data-act="read"
                          aria-expanded="false" aria-controls="bb-board"
                          aria-label="Read the canvas as a number"
                          title="Read the canvas as a number">
                    <span data-icon="reading"></span><em>Reading</em>
                  </button>
                  <button class="bb-tool" type="button" id="bb-sync-btn" data-act="sync"
                          aria-pressed="false"
                          aria-label="Sync the tools: change one and the rest show the same number"
                          title="Sync — change one tool and the rest show the same number (Y)">
                    <span data-icon="sync"></span><em>Sync</em>
                  </button>
                  <button class="bb-tool bb-tool--menu" type="button" data-menu="type"
                          aria-haspopup="dialog" aria-expanded="false"
                          aria-label="Type a number and see it on every tool"
                          title="Type a number and see it built">
                    <span data-icon="keyin"></span><em>Type it</em>
                  </button>
                </div>
              </div>

              <!-- VIEW: how you are looking at the paper. 2D belongs here and not
                   with the Number keys — it is a camera, not a reading. The rest
                   of this grid is filled in by js/main.js, which owns the camera. -->
              <div class="bb-kit" role="group" aria-label="Where you are looking">
                <span class="bb-kit__label">View</span>
                <div class="bb-kit__grid" id="bb-kit-view">
                  <button class="bb-tool" type="button" id="bb-view-btn" data-act="view"
                          aria-pressed="false" title="Flat 2D view (V)">
                    <span data-icon="flat"></span>
                    <em id="bb-view-label">2D</em>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── what the rail's arrows open, beside the rail ─────────── -->
          <div class="bb-fly" id="bb-fly-add" role="menu" aria-label="What to add" hidden>
            <div class="pp-receipt__paper bb-paper bb-fly__paper">
              <div class="bb-fly__tabs" id="bb-dock-tabs" role="tablist" aria-label="Which family"></div>
              <div class="bb-fly__panel" id="bb-dock-panel"></div>
            </div>
          </div>

          <div class="bb-fly bb-fly--pad" id="bb-fly-paint" role="menu" aria-label="Highlight" hidden>
            <div class="pp-receipt__paper bb-paper bb-fly__paper">
              <span class="bb-fly__label">Highlight</span>
              <span class="bb-tagdots" id="bb-tagdots"></span>
              <button class="bb-tagclear" type="button" data-tag="none" title="Clear highlight">
                <span data-icon="eraser"></span>
              </button>
            </div>
          </div>

          <!-- ── type a number and watch it get built ─────────────────── -->
          <div class="bb-fly" id="bb-fly-type" role="dialog" aria-label="Type a number" hidden>
            <div class="pp-receipt__paper bb-paper bb-fly__paper">
              <form class="bb-keyin" id="bb-keyin">
                <label class="bb-fly__label" for="bb-keyin-n">Show me</label>
                <input
                  class="bb-keyin__box"
                  id="bb-keyin-n"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="1234"
                  aria-describedby="bb-keyin-note"
                />
                <button class="pp-btn bb-keyin__go" type="submit"
                        aria-label="Build it" title="Build it">
                  <span data-icon="bricks"></span>
                </button>
              </form>
              <p class="bb-keyin__note" id="bb-keyin-note"></p>
              <!-- the same number, worked on to a frame instead of built. The
                   signs are signs, not icons: no key on this canvas may share a
                   glyph with another, and + already belongs to Add. -->
              <div class="bb-sums" id="bb-sums">
                <span class="bb-fly__label">Work it out on the frame</span>
                <div class="bb-sums__keys">
                  <button class="bb-sum" type="button" data-sum="1"
                          aria-label="Add it to the frame, bead by bead"
                          title="Add it, bead by bead">+</button>
                  <button class="bb-sum" type="button" data-sum="-1"
                          aria-label="Take it off the frame, bead by bead"
                          title="Take it off, bead by bead">−</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── every key on the canvas, written out of js/keys.js ────── -->
          <div class="bb-fly bb-fly--keys" id="bb-fly-keys" role="dialog"
               aria-label="Keyboard shortcuts" hidden>
            <div class="pp-receipt__paper bb-paper bb-fly__paper">
              <div class="bb-pop__head">
                <span class="bb-eyebrow">The keys</span>
                <button class="bb-pop__x" type="button" data-close><span data-icon="close"></span></button>
              </div>
              <div id="bb-keys-body"></div>
            </div>
          </div>

          <!-- ── the base panel, opened from the rail ──────────────────── -->
          <div class="bb-pop bb-fly--anchored" id="bb-pop-base" role="dialog" aria-label="Working base" hidden>
            <div class="pp-receipt__paper bb-paper bb-pop__paper">
              <div class="bb-pop__head">
                <span class="bb-eyebrow">Working base</span>
                <button class="bb-pop__x" type="button" data-close><span data-icon="close"></span></button>
              </div>
              <!-- the two explanations are tooltips: they are read once and then
                   they are furniture, and this panel opens beside the rail -->
              <div class="bb-bases" id="bb-bases"></div>
              <label class="bb-switch" id="bb-strict-row">
                <input type="checkbox" id="bb-strict" checked />
                <span><b>Trade rules</b> <em id="bb-strict-n">10</em></span>
              </label>
            </div>
          </div>

          <!-- ── own-size popover ─────────────────────────────────────── -->
          <div class="bb-pop bb-pop--own" id="bb-pop-own" role="dialog" aria-label="Build your own block" hidden>
            <div class="pp-receipt__paper bb-paper bb-pop__paper">
              <div class="bb-pop__head">
                <span class="bb-eyebrow">Build your own block</span>
                <button class="bb-pop__x" type="button" data-close><span data-icon="close"></span></button>
              </div>
              <div class="bb-dims">
                <label class="bb-dim">
                  <span>Length</span>
                  <span class="bb-step">
                    <button type="button" data-step="-1" data-dim="l" aria-label="Shorter">–</button>
                    <input type="number" id="bb-dim-l" min="1" max="20" value="3" inputmode="numeric" />
                    <button type="button" data-step="1" data-dim="l" aria-label="Longer">+</button>
                  </span>
                </label>
                <label class="bb-dim">
                  <span>Width</span>
                  <span class="bb-step">
                    <button type="button" data-step="-1" data-dim="w" aria-label="Narrower">–</button>
                    <input type="number" id="bb-dim-w" min="1" max="20" value="2" inputmode="numeric" />
                    <button type="button" data-step="1" data-dim="w" aria-label="Wider">+</button>
                  </span>
                </label>
                <label class="bb-dim">
                  <span>Height</span>
                  <span class="bb-step">
                    <button type="button" data-step="-1" data-dim="h" aria-label="Lower">–</button>
                    <input type="number" id="bb-dim-h" min="1" max="20" value="2" inputmode="numeric" />
                    <button type="button" data-step="1" data-dim="h" aria-label="Taller">+</button>
                  </span>
                </label>
              </div>
              <p class="bb-dims__out" id="bb-dims-out"></p>
              <button class="pp-btn" type="button" id="bb-add-own">
                Put it on the canvas <span data-icon="check"></span>
              </button>
            </div>
          </div>

          <!-- ── place-value board ────────────────────────────────────── -->
          <aside class="bb-board" id="bb-board" aria-label="Place-value board" hidden>
            <div class="pp-receipt__paper bb-paper bb-board__paper">
              <div class="bb-board__head">
                <span class="bb-eyebrow">The canvas, read as a number</span>
                <button class="bb-pop__x" type="button" data-close-board>
                  <span data-icon="close"></span>
                </button>
              </div>
              <div id="bb-board-body"></div>
            </div>
          </aside>

          <p class="bb-toast pp-sticky pp-sticky--c0" id="bb-toast" role="status" aria-live="polite"></p>
        </div>
      </div>
`;
}
