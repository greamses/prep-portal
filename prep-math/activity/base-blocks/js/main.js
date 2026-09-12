/* ============================================================================
   MANIPULATIVES — the page
   ----------------------------------------------------------------------------
   The workbench itself is workspace.js, because it is mounted in two places:
   here, filling the window, and in a panel in the printable workbooks' sidebar.
   This file is only the half that belongs to this page — the shelf of entry
   cards, and the canvas view they open.
   ========================================================================== */

import { mountBaseBlocks } from "./workspace.js";

mountBaseBlocks(document.getElementById("bb-canvas-view"), {
  shelf: document.getElementById("bb-shelf"),
});
