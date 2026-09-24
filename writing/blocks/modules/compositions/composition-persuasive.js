// ══════════════════════════════════════════════
//  modules/composition-persuasive.js — Persuasive Composition
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;

  ['eng_persuasive_composition', 'eng_persuasive_intro',
   'eng_persuasive_argument', 'eng_persuasive_counter',
   'eng_persuasive_conclusion']
    .forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_persuasive_composition'] = {
    init: function() {
      this.appendDummyInput().appendField('Persuasive Text');
      this.appendStatementInput('ELEMENTS')
          .setCheck(['PERSUASIVE_ELEMENT', 'COMP_PARAGRAPH']);
      this.setColour('#D32F2F');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Convince the reader of your viewpoint with arguments and evidence.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('ELEMENTS')) this.setWarningText('Add an introduction, arguments, and a conclusion.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_persuasive_intro'] = {
    init: function() {
      this.appendDummyInput().appendField('Introduction');
      this.appendStatementInput('CONTENT');
      this.setColour('#E53935');
      this.setPreviousStatement(true, ['PERSUASIVE_ELEMENT']);
      this.setNextStatement(true, ['PERSUASIVE_ELEMENT']);
      this.setTooltip('State your opinion clearly.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) this.setWarningText('Introduce your topic and opinion.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_persuasive_argument'] = {
    init: function() {
      this.appendDummyInput().appendField('Argument');
      this.appendStatementInput('CONTENT');
      this.setColour('#EF5350');
      this.setPreviousStatement(true, ['PERSUASIVE_ELEMENT']);
      this.setNextStatement(true, ['PERSUASIVE_ELEMENT']);
      this.setTooltip('One reason with supporting evidence.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) this.setWarningText('Provide a reason and evidence.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_persuasive_counter'] = {
    init: function() {
      this.appendDummyInput().appendField('Counter‑argument');
      this.appendStatementInput('CONTENT');
      this.setColour('#FFCDD2');
      this.setPreviousStatement(true, ['PERSUASIVE_ELEMENT']);
      this.setNextStatement(true, ['PERSUASIVE_ELEMENT']);
      this.setTooltip('Address an opposing view and rebut it.');
    }
  };

  Blockly.Blocks['eng_persuasive_conclusion'] = {
    init: function() {
      this.appendDummyInput().appendField('Conclusion');
      this.appendStatementInput('CONTENT');
      this.setColour('#C62828');
      this.setPreviousStatement(true, ['PERSUASIVE_ELEMENT']);
      this.setNextStatement(true, ['PERSUASIVE_ELEMENT']);
      this.setTooltip('Restate opinion and summarise key arguments.');
    }
  };
})();