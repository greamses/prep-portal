// ══════════════════════════════════════════════
//  modules/composition-expository.js — Expository / Non‑Chronological Report
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;

  ['eng_nonchron_composition', 'eng_nonchron_intro',
   'eng_nonchron_paragraph', 'eng_nonchron_conclusion']
    .forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_nonchron_composition'] = {
    init: function() {
      this.appendDummyInput().appendField('Non‑Chronological Report');
      this.appendStatementInput('ELEMENTS')
          .setCheck(['NONCHRON_ELEMENT', 'COMP_PARAGRAPH']);
      this.setColour('#00897B');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Informational report organised by topic, not time.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('ELEMENTS')) this.setWarningText('Add an introduction, paragraphs, and a conclusion.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_nonchron_intro'] = {
    init: function() {
      this.appendDummyInput().appendField('Introduction');
      this.appendStatementInput('CONTENT');
      this.setColour('#26A69A');
      this.setPreviousStatement(true, ['NONCHRON_ELEMENT']);
      this.setNextStatement(true, ['NONCHRON_ELEMENT']);
      this.setTooltip('Introduce the subject and what the reader will learn.');
    }
  };

  Blockly.Blocks['eng_nonchron_paragraph'] = {
    init: function() {
      this.appendDummyInput().appendField('Topic Paragraph');
      this.appendDummyInput()
          .appendField(new Blockly.FieldTextInput('topic'), 'TOPIC');
      this.appendStatementInput('CONTENT');
      this.setColour('#4DB6AC');
      this.setPreviousStatement(true, ['NONCHRON_ELEMENT']);
      this.setNextStatement(true, ['NONCHRON_ELEMENT']);
      this.setTooltip('One subtopic with details.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) this.setWarningText('Add sentences about this subtopic.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_nonchron_conclusion'] = {
    init: function() {
      this.appendDummyInput().appendField('Conclusion');
      this.appendStatementInput('CONTENT');
      this.setColour('#80CBC4');
      this.setPreviousStatement(true, ['NONCHRON_ELEMENT']);
      this.setNextStatement(true, ['NONCHRON_ELEMENT']);
      this.setTooltip('Summarise key points.');
    }
  };
})();