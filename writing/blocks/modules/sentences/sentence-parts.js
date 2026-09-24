// ══════════════════════════════════════════════
//  modules/sentence-parts.js — subject, verb, object,
//  predicate, fragment, appositive, conjunction, punctuation
// ══════════════════════════════════════════════
(function () {
  if (typeof Blockly === 'undefined') return;

  // ═══════════ SUBJECT ═══════════
  Blockly.Blocks['eng_subject'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Subject')
        .appendField(new Blockly.FieldDropdown([
          ['noun', 'noun'], ['pronoun', 'pronoun'], ['noun phrase', 'noun_phrase']
        ]), 'TYPE');
      this.appendValueInput('WORDS').setCheck('ENG_WORD');
      this.setInputsInline(true);
      this.setOutput(true, 'ENG_SUBJECT');
      this.setColour('#2E7D32');
      this.setCommentText("I'm the Subject! I'm the person, place, or thing doing the action.");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('WORDS')) {
        this.setWarningText("Please attach a word, pronoun, or phrase to act as the subject.");
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ VERB ═══════════
  Blockly.Blocks['eng_verb'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Verb')
        .appendField(new Blockly.FieldDropdown([
          ['present', 'present'], ['past', 'past'],
          ['future', 'future'], ['continuous', 'continuous']
        ]), 'TENSE');
      this.appendValueInput('WORDS').setCheck('ENG_WORD');
      this.setInputsInline(true);
      this.setOutput(true, 'ENG_VERB');
      this.setColour('#C62828');
      this.setCommentText("I'm the Verb! I show the action or state of being.");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('WORDS')) {
        this.setWarningText("Please attach an action word or verb phrase.");
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ OBJECT ═══════════
  Blockly.Blocks['eng_object'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Object')
        .appendField(new Blockly.FieldDropdown([
          ['direct', 'direct'], ['indirect', 'indirect'], ['complement', 'complement']
        ]), 'TYPE');
      this.appendValueInput('WORDS').setCheck('ENG_WORD');
      this.setInputsInline(true);
      this.setOutput(true, 'ENG_OBJECT');
      this.setColour('#7B1FA2');
      this.setCommentText("I'm the Object! I receive the action of the verb.");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('WORDS')) {
        this.setWarningText("Please attach a word or phrase to act as the object.");
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ PREDICATE ═══════════
  Blockly.Blocks['eng_predicate'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Predicate')
        .appendField(new Blockly.FieldDropdown([
          ['simple', 'simple'], ['complete', 'complete']
        ]), 'TYPE');
      this.appendValueInput('VERB').setCheck('ENG_WORD').appendField('verb');
      this.appendStatementInput('CONTENT').appendField('predicate');
      this.setColour('#C62828');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I'm a predicate! I contain the verb and tell you what the subject is doing.");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('VERB')) {
        this.setWarningText("A predicate requires a main verb attached to it!");
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ FRAGMENT ═══════════
  Blockly.Blocks['eng_fragment'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Fragment')
        .appendField(new Blockly.FieldDropdown([
          ['phrase', 'phrase'], ['dependent clause', 'dependent'],
          ['missing subject', 'missing_subject'], ['missing verb', 'missing_verb']
        ]), 'TYPE');
      this.appendValueInput('WORDS').setCheck('ENG_WORD').appendField('text');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setColour('#6A1B9A');
      this.setCommentText("Watch out! I'm an incomplete thought. Fix me to make a real sentence!");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('WORDS')) {
        this.setWarningText("Attach words to your fragment to see what's missing!");
      } else {
        this.setWarningText("Careful: Fragments are incomplete thoughts and usually need to be connected to a full clause.");
      }
    }
  };

  // ═══════════ APPOSITIVE ═══════════
  Blockly.Blocks['eng_appositive'] = {
    init: function() {
      this.appendDummyInput().appendField('Appositive');
      this.appendValueInput('WORDS').setCheck('ENG_WORD').appendField('text');
      this.appendDummyInput().appendField(',');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setInputsInline(true);
      this.setColour('#8E24AA');
      this.setCommentText("I'm an appositive! I give extra information about a noun right next to me.");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('WORDS')) {
        this.setWarningText("An appositive needs words to describe the noun.");
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ CONJUNCTION (stack connector) ═══════════
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

  // ═══════════ PUNCTUATION (stack connector) ═══════════
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