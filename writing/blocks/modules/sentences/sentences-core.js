// ══════════════════════════════════════════════
//  modules/sentences-core.js — sentence & clause
// ══════════════════════════════════════════════
(function () {
  if (typeof Blockly === 'undefined') return;

  // ═══════════ SENTENCE ═══════════
  Blockly.Blocks['eng_sentence'] = {
    init: function () {
      this.appendDummyInput().appendField('Sentence');
      this.appendStatementInput('CONTENT');
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['.', '.'], ['!', '!'], ['?', '?'], ['...', '...']
        ]), 'PUNCTUATION');
      this.setInputsInline(true);
      this.setColour('#0055FF');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I'm a complete thought! I start with a capital letter and end with punctuation.");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('CONTENT')) {
        this.setWarningText("Your sentence is empty! Please add a clause or fragments inside.");
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ CLAUSE ═══════════
  Blockly.Blocks['eng_clause'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Clause')
        .appendField(new Blockly.FieldDropdown([
          ['independent', 'independent'],
          ['dependent', 'dependent'],
          ['relative', 'relative'],
          ['conditional', 'conditional']
        ]), 'TYPE');
      this.appendValueInput('SUBJECT').setCheck('ENG_SUBJECT').appendField('subject');
      this.appendValueInput('VERB').setCheck('ENG_VERB').appendField('verb');
      this.appendValueInput('OBJECT').setCheck(['ENG_OBJECT', 'ENG_SUBJECT']).appendField('object');
      this.appendStatementInput('EXTRA').appendField('extra');
      this.setColour('#1565C0');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setCommentText("I'm a clause! I need a subject and a verb to function properly.");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      let warnings = [];
      if (!this.getInputTargetBlock('SUBJECT')) warnings.push('• Missing a subject block.');
      if (!this.getInputTargetBlock('VERB')) warnings.push('• Missing a verb block.');
      if (warnings.length > 0) {
        this.setWarningText("A proper clause requires both:\n" + warnings.join('\n'));
      } else {
        this.setWarningText(null);
      }
    }
  };
})();