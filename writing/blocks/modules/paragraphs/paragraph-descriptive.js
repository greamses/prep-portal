// ══════════════════════════════════════════════
//  modules/paragraphs/paragraph-descriptive.js — Descriptive paragraph
// ══════════════════════════════════════════════
(function () {
  if (typeof Blockly === 'undefined') return;

  ['eng_descriptive_paragraph', 'eng_descriptive_sensory',
   'eng_descriptive_spatial'].forEach(t => delete Blockly.Blocks[t]);

  Blockly.Blocks['eng_descriptive_paragraph'] = {
    init: function () {
      this.appendDummyInput().appendField('Descriptive Paragraph');
      this.appendStatementInput('SENTENCES')
          .setCheck(['PARAGRAPH_ELEMENT', 'DESCRIPTIVE_SENTENCE', 'ENG_SENTENCE_BLOCK']);
      this.setColour('#8E24AA');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Paint a picture with words. Use sensory details and spatial descriptions.');
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('SENTENCES')) {
        this.setWarningText('Add a topic sentence, sensory details, and a closing sentence.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ SENSORY DETAIL ═══════════
  Blockly.Blocks['eng_descriptive_sensory'] = {
    init: function () {
      this.appendDummyInput()
          .appendField('Sensory Detail')
          .appendField(new Blockly.FieldDropdown([
            ['sight', 'sight'], ['sound', 'sound'], ['smell', 'smell'],
            ['taste', 'taste'], ['touch', 'touch']
          ]), 'SENSE');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setColour('#CE93D8');
      this.setPreviousStatement(true, 'DESCRIPTIVE_SENTENCE');
      this.setNextStatement(true, 'DESCRIPTIVE_SENTENCE');
      this.setTooltip('Describe what you see, hear, smell, taste or feel.');
    }
  };

  // ═══════════ SPATIAL DESCRIPTION ═══════════
  Blockly.Blocks['eng_descriptive_spatial'] = {
    init: function () {
      this.appendDummyInput()
          .appendField('Spatial Detail')
          .appendField(new Blockly.FieldDropdown([
            ['left', 'left'], ['right', 'right'], ['above', 'above'],
            ['below', 'below'], ['nearby', 'nearby'], ['in the distance', 'distance']
          ]), 'PLACE');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setColour('#BA68C8');
      this.setPreviousStatement(true, 'DESCRIPTIVE_SENTENCE');
      this.setNextStatement(true, 'DESCRIPTIVE_SENTENCE');
      this.setTooltip('Describe what is located where.');
    }
  };
})();