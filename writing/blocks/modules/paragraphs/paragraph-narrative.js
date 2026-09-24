// ══════════════════════════════════════════════
//  modules/paragraphs/paragraph-narrative.js — Narrative paragraph
// ══════════════════════════════════════════════
(function () {
  if (typeof Blockly === 'undefined') return;

  ['eng_narrative_paragraph', 'eng_narrative_event', 'eng_narrative_dialogue',
   'eng_narrative_setting'].forEach(t => delete Blockly.Blocks[t]);

  // Container accepts both generic and narrative-specific blocks
  Blockly.Blocks['eng_narrative_paragraph'] = {
    init: function () {
      this.appendDummyInput().appendField('Narrative Paragraph');
      this.appendStatementInput('SENTENCES')
          .setCheck(['PARAGRAPH_ELEMENT', 'NARRATIVE_SENTENCE', 'ENG_SENTENCE_BLOCK']);
      this.setColour('#1E88E5');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('Tells a mini story. Mix generic sentences with narrative events, dialogue, etc.');
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('SENTENCES')) {
        this.setWarningText('Build your narrative paragraph: add a topic, events, and a closing sentence.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ NARRATIVE EVENT ═══════════
  Blockly.Blocks['eng_narrative_event'] = {
    init: function () {
      this.appendDummyInput().appendField('Event / Action');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setColour('#42A5F5');
      this.setPreviousStatement(true, 'NARRATIVE_SENTENCE');
      this.setNextStatement(true, 'NARRATIVE_SENTENCE');
      this.setTooltip('What happened next. Use for storytelling.');
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText('Describe the action or event.');
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ DIALOGUE ═══════════
  Blockly.Blocks['eng_narrative_dialogue'] = {
    init: function () {
      this.appendDummyInput().appendField('Dialogue');
      this.appendDummyInput()
          .appendField('Speaker:')
          .appendField(new Blockly.FieldTextInput('character'), 'SPEAKER');
      this.appendValueInput('LINE')
          .setCheck('ENG_WORD')
          .appendField('says:');
      this.setColour('#66BB6A');
      this.setPreviousStatement(true, 'NARRATIVE_SENTENCE');
      this.setNextStatement(true, 'NARRATIVE_SENTENCE');
      this.setTooltip('Add spoken words. Great for bringing a story to life.');
    }
  };

  // ═══════════ SETTING / DESCRIPTIVE DETAIL ═══════════
  Blockly.Blocks['eng_narrative_setting'] = {
    init: function () {
      this.appendDummyInput().appendField('Setting / Description');
      this.appendStatementInput('CONTENT')
          .setCheck(null);   // Accept ANY sentence stack block
      this.setColour('#AB47BC');
      this.setPreviousStatement(true, 'NARRATIVE_SENTENCE');
      this.setNextStatement(true, 'NARRATIVE_SENTENCE');
      this.setTooltip('Describe the place, time, or atmosphere.');
    }
  };
})();