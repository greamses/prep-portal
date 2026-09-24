// ══════════════════════════════════════════════
//  modules/composition-recount.js — Recount Composition
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;

  ['eng_recount_composition', 'eng_recount_orientation',
   'eng_recount_event', 'eng_recount_reorientation']
    .forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_recount_composition'] = {
    init: function() {
      this.appendDummyInput().appendField('Recount');
      this.appendStatementInput('ELEMENTS')
          .setCheck(['RECOUNT_ELEMENT', 'COMP_PARAGRAPH']);
      this.setColour('#0277BD');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Retell events in chronological order.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('ELEMENTS')) this.setWarningText('Add an orientation, events, and a reorientation.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_recount_orientation'] = {
    init: function() {
      this.appendDummyInput().appendField('Orientation');
      this.appendStatementInput('CONTENT');
      this.setColour('#0288D1');
      this.setPreviousStatement(true, ['RECOUNT_ELEMENT']);
      this.setNextStatement(true, ['RECOUNT_ELEMENT']);
      this.setTooltip('Who, what, when, where.');
    }
  };

  Blockly.Blocks['eng_recount_event'] = {
    init: function() {
      this.appendDummyInput().appendField('Event');
      this.appendStatementInput('CONTENT');
      this.setColour('#039BE5');
      this.setPreviousStatement(true, ['RECOUNT_ELEMENT']);
      this.setNextStatement(true, ['RECOUNT_ELEMENT']);
      this.setTooltip('One step in the sequence.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) this.setWarningText('Add sentences describing this event.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_recount_reorientation'] = {
    init: function() {
      this.appendDummyInput().appendField('Reorientation');
      this.appendStatementInput('CONTENT');
      this.setColour('#4FC3F7');
      this.setPreviousStatement(true, ['RECOUNT_ELEMENT']);
      this.setNextStatement(true, ['RECOUNT_ELEMENT']);
      this.setTooltip('Closing personal comment or reflection.');
    }
  };
})();