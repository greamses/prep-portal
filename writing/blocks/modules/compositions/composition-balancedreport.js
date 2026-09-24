// ══════════════════════════════════════════════
//  modules/composition-balancedreport.js — Balanced Report / Discussion
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;

  ['eng_balanced_composition', 'eng_balanced_intro',
   'eng_balanced_for', 'eng_balanced_against',
   'eng_balanced_conclusion']
    .forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_balanced_composition'] = {
    init: function() {
      this.appendDummyInput().appendField('Balanced Report');
      this.appendStatementInput('ELEMENTS')
          .setCheck(['BALANCED_ELEMENT', 'COMP_PARAGRAPH']);
      this.setColour('#5E35B1');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Present both sides of an issue fairly before concluding.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('ELEMENTS')) this.setWarningText('Add an introduction, arguments for/against, and a conclusion.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_balanced_intro'] = {
    init: function() {
      this.appendDummyInput().appendField('Introduction');
      this.appendStatementInput('CONTENT');
      this.setColour('#7E57C2');
      this.setPreviousStatement(true, ['BALANCED_ELEMENT']);
      this.setNextStatement(true, ['BALANCED_ELEMENT']);
      this.setTooltip('Introduce the issue without bias.');
    }
  };

  Blockly.Blocks['eng_balanced_for'] = {
    init: function() {
      this.appendDummyInput().appendField('Arguments For');
      this.appendStatementInput('CONTENT');
      this.setColour('#9575CD');
      this.setPreviousStatement(true, ['BALANCED_ELEMENT']);
      this.setNextStatement(true, ['BALANCED_ELEMENT']);
      this.setTooltip('Points in favour of the topic.');
    }
  };

  Blockly.Blocks['eng_balanced_against'] = {
    init: function() {
      this.appendDummyInput().appendField('Arguments Against');
      this.appendStatementInput('CONTENT');
      this.setColour('#B39DDB');
      this.setPreviousStatement(true, ['BALANCED_ELEMENT']);
      this.setNextStatement(true, ['BALANCED_ELEMENT']);
      this.setTooltip('Points opposing the topic.');
    }
  };

  Blockly.Blocks['eng_balanced_conclusion'] = {
    init: function() {
      this.appendDummyInput().appendField('Conclusion');
      this.appendStatementInput('CONTENT');
      this.setColour('#D1C4E9');
      this.setPreviousStatement(true, ['BALANCED_ELEMENT']);
      this.setNextStatement(true, ['BALANCED_ELEMENT']);
      this.setTooltip('Summarise and state your position, based on the evidence.');
    }
  };
})();