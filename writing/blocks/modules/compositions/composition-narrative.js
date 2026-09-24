// ══════════════════════════════════════════════
//  modules/composition-narrative.js — Narrative Composition
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;

  ['eng_narrative_composition', 'eng_narrative_orientation',
   'eng_narrative_complication', 'eng_narrative_resolution',
   'eng_narrative_coda'].forEach(t => delete Blockly.Blocks[t]);

  // Container
  Blockly.Blocks['eng_narrative_composition'] = {
    init: function() {
      this.appendDummyInput().appendField('Narrative Text');
      this.appendStatementInput('ELEMENTS')
          .setCheck(['NARRATIVE_ELEMENT', 'COMP_PARAGRAPH']);
      this.setColour('#0055FF');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('A story: orientation → complication → resolution → (coda).');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('ELEMENTS')) {
        this.setWarningText('Add at least an orientation, complication, and resolution inside.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  Blockly.Blocks['eng_narrative_orientation'] = {
    init: function() {
      this.appendDummyInput().appendField('Orientation');
      this.appendStatementInput('CONTENT')
          .setCheck(null);  // accept any sentence blocks
      this.setColour('#4FC3F7');
      this.setPreviousStatement(true, ['NARRATIVE_ELEMENT']);
      this.setNextStatement(true, ['NARRATIVE_ELEMENT']);
      this.setTooltip('Who? When? Where? Sets the scene.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText('Add sentences describing the setting and characters.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  Blockly.Blocks['eng_narrative_complication'] = {
    init: function() {
      this.appendDummyInput().appendField('Complication');
      this.appendStatementInput('CONTENT');
      this.setColour('#FF7043');
      this.setPreviousStatement(true, ['NARRATIVE_ELEMENT']);
      this.setNextStatement(true, ['NARRATIVE_ELEMENT']);
      this.setTooltip('The problem or conflict that arises.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText('Describe the problem or challenge.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  Blockly.Blocks['eng_narrative_resolution'] = {
    init: function() {
      this.appendDummyInput().appendField('Resolution');
      this.appendStatementInput('CONTENT');
      this.setColour('#66BB6A');
      this.setPreviousStatement(true, ['NARRATIVE_ELEMENT']);
      this.setNextStatement(true, ['NARRATIVE_ELEMENT']);
      this.setTooltip('How the problem is solved.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText('Show how the conflict is resolved.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  Blockly.Blocks['eng_narrative_coda'] = {
    init: function() {
      this.appendDummyInput().appendField('Coda (ending)');
      this.appendStatementInput('CONTENT');
      this.setColour('#B0BEC5');
      this.setPreviousStatement(true, ['NARRATIVE_ELEMENT']);
      this.setNextStatement(true, ['NARRATIVE_ELEMENT']);
      this.setTooltip('Optional: final reflection or moral.');
    }
  };
})();