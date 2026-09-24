// ══════════════════════════════════════════════
//  modules/paragraphs/paragraph-core.js — Generic paragraph blocks
// ══════════════════════════════════════════════
(function () {
  if (typeof Blockly === 'undefined') return;

  ['eng_paragraph', 'eng_topic_sentence', 'eng_supporting', 'eng_closing',
   'eng_transition', 'eng_completed_sentence'].forEach(t => delete Blockly.Blocks[t]);

  // ═══════════ GENERIC PARAGRAPH CONTAINER ═══════════
  Blockly.Blocks['eng_paragraph'] = {
    init: function () {
      this.appendDummyInput().appendField('Paragraph');
      this.appendStatementInput('SENTENCES')
          .setCheck([
            'PARAGRAPH_ELEMENT',
            'NARRATIVE_SENTENCE',
            'DESCRIPTIVE_SENTENCE',
            'PERSUASIVE_SENTENCE',
            'EXPOSITORY_SENTENCE',
            'ENG_SENTENCE_BLOCK'    // accepts transferred sentence blocks directly
          ]);
      this.setColour('#0055FF');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('A generic paragraph container. Add topic, supporting, and closing sentences.');
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('SENTENCES')) {
        this.setWarningText('Add at least a topic sentence, some supporting details, and a closing sentence.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ TOPIC SENTENCE (generic) ═══════════
  Blockly.Blocks['eng_topic_sentence'] = {
    init: function () {
      this.appendDummyInput().appendField('Topic Sentence');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setInputsInline(true);
      this.setColour('#FFB800');
      this.setPreviousStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE'
      ]);
      this.setNextStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE'
      ]);
      this.setTooltip('The main idea of the paragraph. Fits any paragraph type.');
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText('Add at least one complete sentence inside.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ SUPPORTING SENTENCE (generic) ═══════════
  Blockly.Blocks['eng_supporting'] = {
    init: function () {
      this.appendDummyInput()
          .appendField('Supporting')
          .appendField(new Blockly.FieldDropdown([['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']]), 'NUM');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setInputsInline(true);
      this.setColour('#2E7D32');
      this.setPreviousStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE'
      ]);
      this.setNextStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE'
      ]);
      this.setTooltip('A supporting detail or example. Fits any paragraph type.');
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText('Add the supporting information.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ CLOSING SENTENCE (generic) ═══════════
  Blockly.Blocks['eng_closing'] = {
    init: function () {
      this.appendDummyInput().appendField('Closing Sentence');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setInputsInline(true);
      this.setColour('#C62828');
      this.setPreviousStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE'
      ]);
      this.setNextStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE'
      ]);
      this.setTooltip('Summarises or wraps up. Fits any paragraph type.');
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText('Add a concluding sentence.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ TRANSITION (generic) ═══════════
  Blockly.Blocks['eng_transition'] = {
    init: function () {
      this.appendDummyInput()
          .appendField('Transition')
          .appendField(new Blockly.FieldDropdown([
            ['First,', 'First,'], ['Second,', 'Second,'], ['Third,', 'Third,'],
            ['Finally,', 'Finally,'], ['In addition,', 'In addition,'],
            ['Furthermore,', 'Furthermore,'], ['However,', 'However,'],
            ['Therefore,', 'Therefore,'], ['In conclusion,', 'In conclusion,'],
            ['For example,', 'For example,']
          ]), 'PHRASE');
      this.setInputsInline(true);
      this.setColour('#AD1457');
      this.setPreviousStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE'
      ]);
      this.setNextStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE'
      ]);
      this.setTooltip('A linking word/phrase. Can be inserted between any sentences.');
    }
  };

  // ═══════════ COMPLETED SENTENCE PILL (generic) ═══════════
  Blockly.Blocks['eng_completed_sentence'] = {
    init: function () {
      this.appendDummyInput()
          .appendField('Sentence:')
          .appendField(new Blockly.FieldTextInput("..."), 'TEXT');
      this.setColour('#3949AB');
      this.setPreviousStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE',
        'ENG_SENTENCE_BLOCK'
      ]);
      this.setNextStatement(true, [
        'PARAGRAPH_ELEMENT',
        'NARRATIVE_SENTENCE',
        'DESCRIPTIVE_SENTENCE',
        'PERSUASIVE_SENTENCE',
        'EXPOSITORY_SENTENCE',
        'ENG_SENTENCE_BLOCK'
      ]);
      this.setTooltip('A whole sentence as a single block (generated automatically).');
    }
  };
})();