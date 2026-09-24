// ══════════════════════════════════════════════
//  modules/composition-explanation.js — Explanation Composition
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;

  ['eng_explanation_composition', 'eng_explanation_intro',
   'eng_explanation_sequence', 'eng_explanation_conclusion']
    .forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_explanation_composition'] = {
    init: function() {
      this.appendDummyInput().appendField('Explanation Text');
      this.appendStatementInput('ELEMENTS')
          .setCheck(['EXPLANATION_ELEMENT', 'COMP_PARAGRAPH']);
      this.setColour('#558B2F');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Explain how or why something happens.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('ELEMENTS')) this.setWarningText('Add an introduction, explanation steps, and a conclusion.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_explanation_intro'] = {
    init: function() {
      this.appendDummyInput().appendField('Introduction');
      this.appendStatementInput('CONTENT');
      this.setColour('#7CB342');
      this.setPreviousStatement(true, ['EXPLANATION_ELEMENT']);
      this.setNextStatement(true, ['EXPLANATION_ELEMENT']);
      this.setTooltip('State the phenomenon to be explained.');
    }
  };

  Blockly.Blocks['eng_explanation_sequence'] = {
    init: function() {
      this.appendDummyInput().appendField('Explanation Step');
      this.appendDummyInput()
          .appendField(new Blockly.FieldTextInput('cause'), 'CAUSE');
      this.appendStatementInput('CONTENT');
      this.setColour('#9CCC65');
      this.setPreviousStatement(true, ['EXPLANATION_ELEMENT']);
      this.setNextStatement(true, ['EXPLANATION_ELEMENT']);
      this.setTooltip('One cause‑effect link in the chain.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) this.setWarningText('Explain what happens and why.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_explanation_conclusion'] = {
    init: function() {
      this.appendDummyInput().appendField('Conclusion');
      this.appendStatementInput('CONTENT');
      this.setColour('#AED581');
      this.setPreviousStatement(true, ['EXPLANATION_ELEMENT']);
      this.setNextStatement(true, ['EXPLANATION_ELEMENT']);
      this.setTooltip('Summarise the explanation.');
    }
  };
})();