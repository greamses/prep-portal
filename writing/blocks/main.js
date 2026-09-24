// ══════════════════════════════════════════════
//  main.js — Blockly initialisation, auto‑transfers & boot
// ══════════════════════════════════════════════

// The studio opens on the blocks. (It used to open on a map of locked
// lessons; the map is gone, and the workbench is what a person came for.)

// ══════════════════════════════════════════════
//  PATCH: wrap tooltips, comments & warnings
// ══════════════════════════════════════════════

function patchBlocklyBubbles() {
  if (typeof Blockly === 'undefined') return;
  
  // 1. Inject global CSS for HTML-based tooltips and editable textareas
  if (!document.getElementById('blockly-bubble-wrap-style')) {
    const style = document.createElement('style');
    style.id = 'blockly-bubble-wrap-style';
    style.textContent = `
      .blocklyTooltipDiv {
        max-width: 280px !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        line-height: 1.5 !important;
      }
      .blocklyCommentTextarea {
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Utility: SVG <text> elements ignore CSS, so we strictly inject newlines (\n)
  function wrapText(text, maxChars = 40) {
    if (!text || typeof text !== 'string') return text;
    return text.split('\n').map(line => {
      const words = line.split(' ');
      let currentLine = '';
      let wrapped = '';
      for (const word of words) {
        if ((currentLine + word).length > maxChars) {
          if (currentLine === '') {
            wrapped += word + '\n';
            currentLine = '';
          } else {
            wrapped += currentLine.trim() + '\n';
            currentLine = word + ' ';
          }
        } else {
          currentLine += word + ' ';
        }
      }
      wrapped += currentLine.trim();
      return wrapped;
    }).join('\n');
  }
  
  // 2. Patch Tooltips (HTML)
  try {
    const tooltipProto = Blockly.Tooltip && Blockly.Tooltip.prototype;
    if (tooltipProto && tooltipProto.show) {
      const origShow = tooltipProto.show;
      tooltipProto.show = function(content, position) {
        const wrappedContent = (typeof content === 'string') ? wrapText(content, 50) : content;
        // USE .call(this) so we don't break the context
        origShow.call(this, wrappedContent, position);
      };
    }
  } catch (e) { console.warn('Tooltip patch failed:', e); }
  
  // 3. Patch Warning Bubbles (SVG Text)
  try {
    const warnProto = Blockly.Warning && Blockly.Warning.prototype;
    if (warnProto && warnProto.setText) {
      const origSetText = warnProto.setText;
      warnProto.setText = function(text, id) {
        origSetText.call(this, wrapText(text, 40), id);
      };
    }
  } catch (e) { console.warn('Warning patch failed:', e); }
  
  // 4. Patch Comment Bubbles (SVG / Textarea)
  try {
    const commentProto = Blockly.Comment && Blockly.Comment.prototype;
    if (commentProto && commentProto.setText) {
      const origSetText = commentProto.setText;
      commentProto.setText = function(text) {
        origSetText.call(this, wrapText(text, 40));
      };
    }
  } catch (e) { console.warn('Comment patch failed:', e); }
  
  // 5. Modern Icon Patches (Blockly v10+)
  try {
    if (Blockly.icons) {
      const warnIconProto = Blockly.icons.WarningIcon && Blockly.icons.WarningIcon.prototype;
      if (warnIconProto && warnIconProto.setText) {
        const origWarnSetText = warnIconProto.setText;
        warnIconProto.setText = function(text) {
          origWarnSetText.call(this, wrapText(text, 40));
        };
      }
      
      const commentIconProto = Blockly.icons.CommentIcon && Blockly.icons.CommentIcon.prototype;
      if (commentIconProto && commentIconProto.setText) {
        const origCommentSetText = commentIconProto.setText;
        commentIconProto.setText = function(text) {
          origCommentSetText.call(this, wrapText(text, 40));
        };
      }
    }
  } catch (e) { console.warn('Modern icon patches failed:', e); }
}

function applyTooltipStyles(div) {
  if (!div) return;
  div.style.maxWidth = '280px';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.lineHeight = '1.5';
  div.style.padding = '10px 14px';
  div.style.fontSize = '13px';
}

// ══════════════════════════════════════════════
//  BLOCKLY SETUP
// ══════════════════════════════════════════════

function initBlockly() {
  patchBlocklyBubbles();
  
  const mkToolbox = (cats, catConfig) => ({
    kind: 'categoryToolbox',
    contents: Object.keys(cats).map((cat, i) => ({
      kind: 'category',
      name: catConfig[i]?.label || '\u200B'.repeat(i + 1),
      colour: catConfig[i]?.color || '#888',
      contents: cats[cat].map(type => ({ kind: 'block', type }))
    }))
  });
  
  /* The canvas, the flyout and the scrollbars come from the site's theme
     (utils/components/blockstudio-theme.js), so the studio follows the page
     into dark mode. It used to name a charcoal of its own here. */
  const baseConfig = {
    ...BlockStudioTheme.options(),
    scrollbars: true,
    trashcan: true,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.9,
      maxScale: 2,
      minScale: 0.3,
      scaleSpeed: 1.2
    },
    move: { scrollbars: true, drag: true, wheel: false }
  };
  
  workspaceSentences = Blockly.inject('blocklyDiv-sentences', {
    toolbox: mkToolbox(SENTENCE_TOOLBOX, SENTENCE_CATS),
    ...baseConfig
  });
  workspaceParagraphs = Blockly.inject('blocklyDiv-paragraphs', {
    toolbox: mkToolbox(PARAGRAPH_TOOLBOX, PARAGRAPH_CATS),
    ...baseConfig
  });
  workspaceComposition = Blockly.inject('blocklyDiv-composition', {
    toolbox: mkToolbox(COMPOSITION_TOOLBOX, COMPOSITION_CATS),
    ...baseConfig
  });
  
  const onChange = () => {
    if (activeTab === 'preview') updatePreview();
    if (activeTab === 'code') updateCode();
  };
  
  workspaceSentences.addChangeListener(onChange);
  workspaceParagraphs.addChangeListener(onChange);
  workspaceComposition.addChangeListener(onChange);
  
  buildSidebar();
}

// ══════════════════════════════════════════════
//  AUTO TRANSFER LOGIC (Single Blocks)
// ══════════════════════════════════════════════

const COMPOSITION_CONTAINERS = [
  'eng_narrative_composition',
  'eng_descriptive_composition',
  'eng_persuasive_composition',
  'eng_nonchron_composition',
  'eng_balanced_composition',
  'eng_recount_composition',
  'eng_procedure_composition',
  'eng_explanation_composition',
  'eng_composition'
];

function getOrCreateTargetBlock(ws, type) {
  let block = ws.getTopBlocks(false).find(b => b.type === type);
  if (block) return block;
  block = ws.newBlock(type);
  block.initSvg();
  block.render();
  block.moveBy(80, 80);
  return block;
}

function syncSentenceToParagraph(sentenceBlock) {
  if (!sentenceBlock) return;
  const plainText = blockToEngPlain(sentenceBlock).trim();
  if (!plainText) return;
  
  if (sentenceBlock.__transferredId) {
    const target = workspaceParagraphs.getBlockById(sentenceBlock.__transferredId);
    if (target) {
      if (target.getFieldValue('TEXT') !== plainText)
        target.setFieldValue(plainText, 'TEXT');
      return;
    }
  }
  
  const pBlock = workspaceParagraphs.newBlock('eng_completed_sentence');
  pBlock.initSvg();
  pBlock.render();
  pBlock.setFieldValue(plainText, 'TEXT');
  sentenceBlock.__transferredId = pBlock.id;
  
  const paragraph = getOrCreateTargetBlock(workspaceParagraphs, 'eng_paragraph');
  let targetNode = paragraph.getInputTargetBlock('SENTENCES');
  if (!targetNode) {
    paragraph.getInput('SENTENCES').connection.connect(pBlock.previousConnection);
  } else {
    while (targetNode.getNextBlock()) targetNode = targetNode.getNextBlock();
    if (targetNode.nextConnection && pBlock.previousConnection)
      targetNode.nextConnection.connect(pBlock.previousConnection);
  }
}

function syncParagraphToComposition(paragraphBlock) {
  if (!paragraphBlock) return;
  const plainText = blockToEngPlain(paragraphBlock).trim();
  if (!plainText) return;
  
  if (paragraphBlock.__transferredId) {
    const target = workspaceComposition.getBlockById(paragraphBlock.__transferredId);
    if (target) {
      if (target.getFieldValue('TEXT') !== plainText)
        target.setFieldValue(plainText, 'TEXT');
      return;
    }
  }
  
  const cBlock = workspaceComposition.newBlock('eng_completed_paragraph');
  cBlock.initSvg();
  cBlock.render();
  cBlock.setFieldValue(plainText, 'TEXT');
  paragraphBlock.__transferredId = cBlock.id;
  
  let comp = null;
  for (const containerType of COMPOSITION_CONTAINERS) {
    comp = workspaceComposition.getTopBlocks(false).find(b => b.type === containerType);
    if (comp) break;
  }
  
  if (!comp) {
    comp = workspaceComposition.newBlock('eng_narrative_composition');
    comp.initSvg();
    comp.render();
    comp.moveBy(80, 80);
  }
  
  const inputName = comp.getInput('ELEMENTS') ? 'ELEMENTS' :
    comp.getInput('PARAGRAPHS') ? 'PARAGRAPHS' : null;
  
  if (!inputName) return;
  
  let targetNode = comp.getInputTargetBlock(inputName);
  if (!targetNode) {
    comp.getInput(inputName).connection.connect(cBlock.previousConnection);
  } else {
    while (targetNode.getNextBlock()) targetNode = targetNode.getNextBlock();
    if (targetNode.nextConnection && cBlock.previousConnection)
      targetNode.nextConnection.connect(cBlock.previousConnection);
  }
}

function setupAutoTransfers() {
  workspaceSentences.addChangeListener(event => {
    if ([Blockly.Events.BLOCK_MOVE, Blockly.Events.BLOCK_CHANGE].includes(event.type)) {
      workspaceSentences.getTopBlocks(false).forEach(block => {
        if (block.type === 'eng_sentence') syncSentenceToParagraph(block);
      });
    }
  });
  
  workspaceParagraphs.addChangeListener(event => {
    if ([Blockly.Events.BLOCK_MOVE, Blockly.Events.BLOCK_CHANGE].includes(event.type)) {
      workspaceParagraphs.getTopBlocks(false).forEach(block => {
        if (block.type === 'eng_paragraph') syncParagraphToComposition(block);
      });
    }
  });
}

// ══════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  if (!workspaceSentences) {
    initBlockly();
    setLangMode('sentences');
    setupAutoTransfers();
  }
});