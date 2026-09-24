// ══════════════════════════════════════════════
//  modules/phrase-blocks.js — phrase, conjunction, punctuation
// ══════════════════════════════════════════════
(function () {
  if (typeof Blockly === 'undefined') return;

  // ═══════════ PHRASE ═══════════
  Blockly.Blocks['eng_phrase'] = {
    init: function () {
      this.appendDummyInput('TYPE_INPUT')
        .appendField('Phrase')
        .appendField(new Blockly.FieldDropdown([
          ['noun', 'noun_phrase'],
          ['verb', 'verb_phrase'],
          ['adjective', 'adjective_phrase'],
          ['adverb', 'adverb_phrase'],
          ['prepositional', 'prepositional']
        ], value => {
          setTimeout(() => this.updateShape_(), 0);
          return value;
        }), 'TYPE');
      this.setColour('#00897B');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I'm a Phrase! A group of words that works together, but doesn't have both a subject and a verb.");
      this.updateShape_();
    },
    updateShape_: function () {
      const type = this.getFieldValue('TYPE');
      ['PREP_INPUT', 'NOUN_INPUT', 'VERB_INPUT', 'ADJECTIVE_INPUT', 'ADVERB_INPUT', 'CONTENT']
        .forEach(input => { if (this.getInput(input)) this.removeInput(input); });

      if (type === 'noun_phrase') {
        this.appendValueInput('NOUN_INPUT').setCheck('ENG_WORD').appendField('noun');
        this.appendStatementInput('CONTENT').appendField('modifiers');
      } else if (type === 'verb_phrase') {
        this.appendValueInput('VERB_INPUT').setCheck('ENG_WORD').appendField('verb');
        this.appendStatementInput('CONTENT').appendField('extra');
      } else if (type === 'adjective_phrase') {
        this.appendValueInput('ADJECTIVE_INPUT').setCheck('ENG_WORD').appendField('adjective');
        this.appendStatementInput('CONTENT').appendField('extra');
      } else if (type === 'adverb_phrase') {
        this.appendValueInput('ADVERB_INPUT').setCheck('ENG_WORD').appendField('adverb');
        this.appendStatementInput('CONTENT').appendField('extra');
      } else if (type === 'prepositional') {
        this.appendValueInput('PREP_INPUT').setCheck('ENG_WORD').appendField('preposition');
        this.appendStatementInput('CONTENT').appendField('object');
      }
      this.render();
    },
    onchange: function (event) {
      if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id && event.name === 'TYPE') {
        this.updateShape_();
      }
      if (!this.workspace || this.workspace.isDragging()) return;
      const type = this.getFieldValue('TYPE');
      let missing = false;
      if (type === 'noun_phrase' && !this.getInputTargetBlock('NOUN_INPUT')) missing = true;
      if (type === 'verb_phrase' && !this.getInputTargetBlock('VERB_INPUT')) missing = true;
      if (type === 'adjective_phrase' && !this.getInputTargetBlock('ADJECTIVE_INPUT')) missing = true;
      if (type === 'adverb_phrase' && !this.getInputTargetBlock('ADVERB_INPUT')) missing = true;
      if (type === 'prepositional' && !this.getInputTargetBlock('PREP_INPUT')) missing = true;
      if (missing) {
        this.setWarningText(`A ${type.replace('_', ' ')} needs its primary word attached to the input!`);
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ CONJUNCTION ═══════════
  Blockly.Blocks['eng_conjunction'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['and', 'and'], ['but', 'but'], ['or', 'or'],
          ['so', 'so'], ['yet', 'yet'], ['because', 'because'], ['however', 'however']
        ]), 'WORD');
      this.setColour('#FFB800');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I'm a conjunction! I connect words, phrases, or clauses together.");
    }
  };

  // ═══════════ PUNCTUATION ═══════════
  Blockly.Blocks['eng_punctuation'] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          [',', ','], [';', ';'], [':', ':'], ['—', '—'], ['(', '('], [')', ')']
        ]), 'MARK');
      this.setColour('#E65100');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I am punctuation! I help organize sentences and make them readable.");
    }
  };
})();