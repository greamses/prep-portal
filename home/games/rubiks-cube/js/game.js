/* =====================================================================
   RUBIK'S CUBE — entry point.

   The realistic 3D cube, keyboard + on-screen keypad, practice modes, the
   Algo Lab and the webcam scanner now live in focused modules under js/.
   This file just wires them together:

     constants ─ helpers ─ state ─ dom ─ gsap   (leaf data / utilities)
        moves ─ scene ─ engine                  (cube + move execution)
        carton · thumbs · ui                    (presentation)
        practice · algo-lab · scan-play         (modes)
        game-flow · render · modal              (orchestration)
        input                                   (all event wiring)

   Importing `input.js` pulls in the whole graph (event listeners attach as
   each module evaluates); we then drop the printed "carton" box over the
   solved cube so it's ready for the first scramble.
   ===================================================================== */
import { injectIcons } from "./icons.js";
import "./input.js";
import { build3DPlaneCarton } from "./carton.js";

injectIcons();
build3DPlaneCarton();
