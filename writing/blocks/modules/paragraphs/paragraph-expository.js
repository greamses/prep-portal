// ══════════════════════════════════════════════
//  modules/paragraphs/paragraph-expository.js — Expository paragraph
// ══════════════════════════════════════════════
(function () {
  if (typeof Blockly === 'undefined') return;

  ['eng_expository_paragraph', 'eng_expository_fact',
   'eng_expository_explanation'].forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_expository_paragraph'] = {
    init: function () {
      this.appendDummyInput().appendField('Expository Paragraph');
      this.appendStatementInput('SENTENCES')
          .setCheck(['PARAGRAPH_ELEMENT', 'EXPOSITORY_SENTENCE', 'ENG_SENTENCE_BLOCK']);
      this.setColour('#00897B');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Inform or explain a topic. Combine generic sentences with facts and explanations.');
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('SENTENCES')) {
        this.setWarningText('Add a topic sentence, facts, explanations, and a closing sentence.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ FACT ═══════════
  Blockly.Blocks['eng_expository_fact'] = {
    init: function () {
      this.appendDummyInput().appendField('Fact / Detail');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setColour('#26A69A');
      this.setPreviousStatement(true, 'EXPOSITORY_SENTENCE');
      this.setNextStatement(true, 'EXPOSITORY_SENTENCE');
      this.setTooltip('A true piece of information about the topic.');
    }
  };

  // ═══════════ EXPLANATION ═══════════
  Blockly.Blocks['eng_expository_explanation'] = {
    init: function () {
      this.appendDummyInput().appendField('Explanation');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setColour('#4DB6AC');
      this.setPreviousStatement(true, 'EXPOSITORY_SENTENCE');
      this.setNextStatement(true, 'EXPOSITORY_SENTENCE');
      this.setTooltip('Explain why or how something happens.');
    }
  };
})();