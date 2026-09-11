/* ============================================================================
   ALGEBRA MOVES — the page
   ----------------------------------------------------------------------------
   The tool itself is workspace.js, because it is mounted in two places: here,
   filling the window under the nav, and in a panel in the printable workbooks'
   sidebar. This file is only the half that belongs to this page.
   ========================================================================== */

import { mountAlgebraMoves } from "./workspace.js";

mountAlgebraMoves(document.getElementById("am-frame"));
