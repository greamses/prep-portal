/* ═══════════════════════════════════════════════════════
   RECALL PRESS — GENERATOR ENTRY POINT
   The topic picker + press (print flow). The deck shelf and
   review session live on the separate library page.
═══════════════════════════════════════════════════════ */
import { enhanceSelects } from '/utils/components/pp-select.js';
import { initTopicPicker } from './topic-picker.js';
import { initPress } from './press.js';

initTopicPicker({});
initPress({});
enhanceSelects(document.querySelector('.press-form'));
