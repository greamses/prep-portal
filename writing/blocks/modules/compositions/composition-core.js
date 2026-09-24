// ══════════════════════════════════════════════
//  modules/composition-core.js — Base blocks for all compositions
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;
  
  ['eng_completed_paragraph', 'eng_title'].forEach(t => delete Blockly.Blocks[t]);
  
  // A single block carrying a finished paragraph (auto‑generated)
  Blockly.Blocks['eng_completed_paragraph'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Paragraph:')
        .appendField(new Blockly.FieldTextInput("..."), 'TEXT');
      this.setColour('#1E88E5');
      this.setPreviousStatement(true, ['COMP_PARAGRAPH']);
      this.setNextStatement(true, ['COMP_PARAGRAPH']);
      this.setTooltip('A single block holding one completed paragraph.');
    }
  };
  
  // Title block – can be placed inside any composition container
  Blockly.Blocks['eng_title'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Title:')
        .appendField(new Blockly.FieldTextInput("My Essay"), 'TITLE');
      this.setColour('#D81B60');
      this.setPreviousStatement(true, ['COMP_PARAGRAPH', 'NARRATIVE_ELEMENT', 'DESCRIPTIVE_ELEMENT', 'PERSUASIVE_ELEMENT', 'NONCHRON_ELEMENT', 'BALANCED_ELEMENT', 'RECOUNT_ELEMENT', 'PROCEDURE_ELEMENT', 'EXPLANATION_ELEMENT']);
      this.setNextStatement(true, ['COMP_PARAGRAPH', 'NARRATIVE_ELEMENT', 'DESCRIPTIVE_ELEMENT', 'PERSUASIVE_ELEMENT', 'NONCHRON_ELEMENT', 'BALANCED_ELEMENT', 'RECOUNT_ELEMENT', 'PROCEDURE_ELEMENT', 'EXPLANATION_ELEMENT']);
      this.setTooltip('Adds a title header to any composition. Can be placed at the top.');
    }
  };
})();