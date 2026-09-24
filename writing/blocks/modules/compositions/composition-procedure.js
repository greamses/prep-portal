// ══════════════════════════════════════════════
//  modules/composition-procedure.js — Procedure / Instructional
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;

  ['eng_procedure_composition', 'eng_procedure_goal',
   'eng_procedure_materials', 'eng_procedure_step',
   'eng_procedure_conclusion']
    .forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_procedure_composition'] = {
    init: function() {
      this.appendDummyInput().appendField('Procedure / Instructions');
      this.appendStatementInput('ELEMENTS')
          .setCheck(['PROCEDURE_ELEMENT', 'COMP_PARAGRAPH']);
      this.setColour('#F57C00');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('A step‑by‑step guide or recipe.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('ELEMENTS')) this.setWarningText('Add a goal, materials, steps, and a conclusion.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_procedure_goal'] = {
    init: function() {
      this.appendDummyInput().appendField('Goal / Aim');
      this.appendStatementInput('CONTENT');
      this.setColour('#FB8C00');
      this.setPreviousStatement(true, ['PROCEDURE_ELEMENT']);
      this.setNextStatement(true, ['PROCEDURE_ELEMENT']);
      this.setTooltip('What you are making or doing.');
    }
  };

  Blockly.Blocks['eng_procedure_materials'] = {
    init: function() {
      this.appendDummyInput().appendField('Materials / Ingredients');
      this.appendStatementInput('CONTENT');
      this.setColour('#FFA726');
      this.setPreviousStatement(true, ['PROCEDURE_ELEMENT']);
      this.setNextStatement(true, ['PROCEDURE_ELEMENT']);
      this.setTooltip('List everything you need.');
    }
  };

  Blockly.Blocks['eng_procedure_step'] = {
    init: function() {
      this.appendDummyInput().appendField('Step');
      this.appendStatementInput('CONTENT');
      this.setColour('#FFB74D');
      this.setPreviousStatement(true, ['PROCEDURE_ELEMENT']);
      this.setNextStatement(true, ['PROCEDURE_ELEMENT']);
      this.setTooltip('One single action in the sequence.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) this.setWarningText('Add the instruction for this step.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_procedure_conclusion'] = {
    init: function() {
      this.appendDummyInput().appendField('Conclusion');
      this.appendStatementInput('CONTENT');
      this.setColour('#FFCC80');
      this.setPreviousStatement(true, ['PROCEDURE_ELEMENT']);
      this.setNextStatement(true, ['PROCEDURE_ELEMENT']);
      this.setTooltip('Final result or serving suggestion.');
    }
  };
})();