// ══════════════════════════════════════════════
//  modules/words-pills.js — word pill, punctuation pill,
//  word join, 3-word join
// ══════════════════════════════════════════════
(function () {
  if (typeof Blockly === 'undefined') return;

  // ═══════════ WORD PILL ═══════════
  Blockly.Blocks['eng_word'] = {
    init: function () {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput('word'), 'TEXT');
      this.setOutput(true, 'ENG_WORD');
      this.setColour('#546E7A');
      this.setInputsInline(true);
      this.setCommentText("I'm a custom word! Type anything you want into me.");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      const val = this.getFieldValue('TEXT');
      if (!val || val.trim() === '') {
        this.setWarningText("Word pill cannot be entirely empty!");
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ PUNCTUATION PILL ═══════════
  Blockly.Blocks['eng_punctuation_pill'] = {
    init: function () {
      this.appendDummyInput().appendField(new Blockly.FieldDropdown([
        [",", ","], [".", "."], ["!", "!"], ["?", "?"],
        [";", ";"], [":", ":"], ["—", "—"], ["...", "..."],
        ["(", "("], [")", ")"], ["\"", "\""], ["'", "'"]
      ]), 'MARK');
      this.setOutput(true, 'ENG_WORD');
      this.setColour('#FB8C00');
      this.setInputsInline(true);
      this.setCommentText("Snap me into an input to add a pause, stop, or special formatting.");
    }
  };

  // ═══════════ WORD JOIN ═══════════
  Blockly.Blocks['eng_word_join'] = {
    init: function () {
      this.appendValueInput('A').setCheck('ENG_WORD');
      this.appendDummyInput().appendField('+');
      this.appendValueInput('B').setCheck('ENG_WORD');
      this.setOutput(true, 'ENG_WORD');
      this.setColour('#455A64');
      this.setInputsInline(true);
      this.setCommentText("I snap two word pills together into a single phrase unit.");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('A') || !this.getInputTargetBlock('B')) {
        this.setWarningText("Please attach blocks to both sides to join them.");
      } else {
        this.setWarningText(null);
      }
    }
  };

  // ═══════════ 3‑WORD JOIN ═══════════
  Blockly.Blocks['eng_word_join3'] = {
    init: function () {
      this.appendValueInput('A').setCheck('ENG_WORD');
      this.appendDummyInput().appendField('+');
      this.appendValueInput('B').setCheck('ENG_WORD');
      this.appendDummyInput().appendField('+');
      this.appendValueInput('C').setCheck('ENG_WORD');
      this.setOutput(true, 'ENG_WORD');
      this.setColour('#607D8B');
      this.setInputsInline(true);
      this.setCommentText("I snap three word pills together into a single unit!");
    },
    onchange: function () {
      if (!this.workspace || this.workspace.isDragging()) return;
      if (!this.getInputTargetBlock('A') || !this.getInputTargetBlock('B') || !this.getInputTargetBlock('C')) {
        this.setWarningText("Please attach blocks to all three slots to join them together.");
      } else {
        this.setWarningText(null);
      }
    }
  };
})();