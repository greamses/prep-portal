// ══════════════════════════════════════════════
//  modules/paragraphs/paragraph-persuasive.js — Persuasive paragraph
// ══════════════════════════════════════════════
(function () {
  if (typeof Blockly === 'undefined') return;

  ['eng_persuasive_paragraph', 'eng_persuasive_argument',
   'eng_persuasive_evidence', 'eng_persuasive_rebuttal'].forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_persuasive_paragraph'] = {
    init: function () {
      this.appendDummyInput().appendField('Persuasive Paragraph');
      this.appendStatementInput('SENTENCES')
          .setCheck(['PARAGRAPH_ELEMENT', 'PERSUASIVE_SENTENCE', 'ENG_SENTENCE_BLOCK']);
      this.setColour('#D32F2F');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Convince the reader. Mix generic sentences with arguments and evidence.');
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('SENTENCES')) {
        this.setWarningText('Add a topic sentence, arguments, and a strong closing sentence.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ ARGUMENT ═══════════
  Blockly.Blocks['eng_persuasive_argument'] = {
    init: function () {
      this.appendDummyInput().appendField('Argument');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setColour('#EF5350');
      this.setPreviousStatement(true, 'PERSUASIVE_SENTENCE');
      this.setNextStatement(true, 'PERSUASIVE_SENTENCE');
      this.setTooltip('State your reason or point of view.');
    }
  };

  // ═══════════ EVIDENCE ═══════════
  Blockly.Blocks['eng_persuasive_evidence'] = {
    init: function () {
      this.appendDummyInput().appendField('Evidence / Example');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setColour('#FFCDD2');
      this.setPreviousStatement(true, 'PERSUASIVE_SENTENCE');
      this.setNextStatement(true, 'PERSUASIVE_SENTENCE');
      this.setTooltip('Support your argument with a fact, statistic, or anecdote.');
    }
  };

  // ═══════════ REBUTTAL ═══════════
  Blockly.Blocks['eng_persuasive_rebuttal'] = {
    init: function () {
      this.appendDummyInput().appendField('Counter‑argument & Rebuttal');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setColour('#C62828');
      this.setPreviousStatement(true, 'PERSUASIVE_SENTENCE');
      this.setNextStatement(true, 'PERSUASIVE_SENTENCE');
      this.setTooltip('Address an opposing view and explain why your position is stronger.');
    }
  };
})();