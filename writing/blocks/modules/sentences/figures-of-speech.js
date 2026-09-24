// ══════════════════════════════════════════════
//  modules/figures-of-speech.js — simile, metaphor,
//  personification, hyperbole, idiom, alliteration
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;
  
  // ═══════════ SIMILE ═══════════
  Blockly.Blocks['eng_simile'] = {
    init: function() {
      this.appendDummyInput().appendField('Simile');
      this.appendValueInput('LEFT').setCheck('ENG_WORD').appendField('thing');
      this.appendDummyInput().appendField('like/as');
      this.appendValueInput('RIGHT').setCheck('ENG_WORD').appendField('comparison');
      this.setColour('#D81B60');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I am a Simile! I compare two different things using 'like' or 'as'.");
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('LEFT') || !this.getInputTargetBlock('RIGHT')) {
        this.setWarningText("A simile needs both the thing being described and its comparison.");
      } else {
        this.setWarningText(null);
      }
    }
  };
  
  // ═══════════ METAPHOR ═══════════
  Blockly.Blocks['eng_metaphor'] = {
    init: function() {
      this.appendDummyInput().appendField('Metaphor');
      this.appendValueInput('LEFT').setCheck('ENG_WORD').appendField('subject');
      this.appendValueInput('RIGHT').setCheck('ENG_WORD').appendField('meaning');
      this.setColour('#AD1457');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I am a Metaphor! I state that one thing IS another to make a vivid comparison.");
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('LEFT') || !this.getInputTargetBlock('RIGHT')) {
        this.setWarningText("A metaphor needs both a subject and its figurative meaning.");
      } else {
        this.setWarningText(null);
      }
    }
  };
  
  // ═══════════ PERSONIFICATION ═══════════
  Blockly.Blocks['eng_personification'] = {
    init: function() {
      this.appendDummyInput().appendField('Personification');
      this.appendValueInput('THING').setCheck('ENG_WORD').appendField('object');
      this.appendStatementInput('ACTION').appendField('human action');
      this.setColour('#C2185B');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I am Personification! I give human qualities or actions to non-human things.");
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('THING')) {
        this.setWarningText("Please attach a non-human object.");
      } else if (!this.getInputTargetBlock('ACTION')) {
        this.setWarningText("Please add human action blocks to describe the object!");
      } else {
        this.setWarningText(null);
      }
    }
  };
  
  // ═══════════ HYPERBOLE ═══════════
  Blockly.Blocks['eng_hyperbole'] = {
    init: function() {
      this.appendDummyInput().appendField('Hyperbole');
      this.appendStatementInput('CONTENT').appendField('exaggeration');
      this.setColour('#EC407A');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I am Hyperbole! I am a massive exaggeration used to emphasize a point!");
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText("Add the exaggeration content inside this hyperbole.");
      } else {
        this.setWarningText(null);
      }
    }
  };
  
  // ═══════════ IDIOM ═══════════
  Blockly.Blocks['eng_idiom'] = {
    init: function() {
      this.appendDummyInput().appendField('Idiom');
      this.appendValueInput('WORDS').setCheck('ENG_WORD');
      this.appendDummyInput()
        .appendField('meaning')
        .appendField(new Blockly.FieldTextInput('meaning'), 'MEANING');
      this.setColour('#F06292');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I am an Idiom! I am a phrase that means something completely different from my literal words.");
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('WORDS')) {
        this.setWarningText("Attach the phrase that acts as the idiom.");
      } else if (this.getFieldValue('MEANING') === 'meaning' || this.getFieldValue('MEANING').trim() === '') {
        this.setWarningText("Please explain what this idiom actually means.");
      } else {
        this.setWarningText(null);
      }
    }
  };
  
  // ═══════════ ALLITERATION ═══════════
  Blockly.Blocks['eng_alliteration'] = {
    init: function() {
      this.appendDummyInput().appendField('Alliteration');
      this.appendStatementInput('CONTENT').appendField('repeated sounds');
      this.setColour('#E91E63');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I am Alliteration! I repeat the same starting consonant sounds for a fun rhythmic effect.");
    },
    onchange: function() {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText("Add your repeating consonant phrases inside!");
      } else {
        this.setWarningText(null);
      }
    }
  };
})();