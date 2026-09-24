// ══════════════════════════════════════════════
//  modules/composition-descriptive.js — Descriptive Composition
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;

  ['eng_descriptive_composition', 'eng_descriptive_intro',
   'eng_descriptive_sensory', 'eng_descriptive_conclusion']
    .forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_descriptive_composition'] = {
    init: function() {
      this.appendDummyInput().appendField('Descriptive Text');
      this.appendStatementInput('ELEMENTS')
          .setCheck(['DESCRIPTIVE_ELEMENT', 'COMP_PARAGRAPH']);
      this.setColour('#8E24AA');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Vividly describe a person, place, or thing using sensory details.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('ELEMENTS')) {
        this.setWarningText('Add an introduction, sensory details, and a conclusion.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  Blockly.Blocks['eng_descriptive_intro'] = {
    init: function() {
      this.appendDummyInput().appendField('Introduction');
      this.appendStatementInput('CONTENT');
      this.setColour('#AB47BC');
      this.setPreviousStatement(true, ['DESCRIPTIVE_ELEMENT']);
      this.setNextStatement(true, ['DESCRIPTIVE_ELEMENT']);
      this.setTooltip('Introduce what will be described.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) this.setWarningText('Add your opening sentences.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_descriptive_sensory'] = {
    init: function() {
      this.appendDummyInput().appendField('Sensory Details');
      this.appendStatementInput('CONTENT');
      this.setColour('#CE93D8');
      this.setPreviousStatement(true, ['DESCRIPTIVE_ELEMENT']);
      this.setNextStatement(true, ['DESCRIPTIVE_ELEMENT']);
      this.setTooltip('Describe using the five senses: sight, sound, smell, taste, touch.');
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) this.setWarningText('Add vivid sensory details.');
      else this.setWarningText(null);
    }
  };

  Blockly.Blocks['eng_descriptive_conclusion'] = {
    init: function() {
      this.appendDummyInput().appendField('Conclusion');
      this.appendStatementInput('CONTENT');
      this.setColour('#BA68C8');
      this.setPreviousStatement(true, ['DESCRIPTIVE_ELEMENT']);
      this.setNextStatement(true, ['DESCRIPTIVE_ELEMENT']);
      this.setTooltip('Wrap up the description with a final impression.');
    }
  };
})();