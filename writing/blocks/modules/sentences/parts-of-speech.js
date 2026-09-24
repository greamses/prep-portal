// ══════════════════════════════════════════════
//  modules/parts-of-speech.js — noun, pronoun,
//  action word, adjective, adverb, preposition,
//  conjunction word, interjection, article
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;
  
  // ═══════════ HELPER ═══════════
  function createSpeechBlock(config) {
    Blockly.Blocks[config.type] = {
      init: function() {
        this.appendDummyInput().appendField(config.label);
        
        this.appendDummyInput('MODE_INPUT')
          .appendField(new Blockly.FieldDropdown([
            ['dropdown', 'dropdown'],
            ['custom', 'custom']
          ], value => {
            setTimeout(() => this.updateShape_(), 0);
            return value;
          }), 'MODE');
        
        this.appendDummyInput('DROP_INPUT')
          .appendField(new Blockly.FieldDropdown(config.options), 'WORD');
        
        this.setOutput(true, 'ENG_WORD');
        this.setColour(config.colour);
        this.setInputsInline(true);
        this.setCommentText(`I am a ${config.label.toUpperCase()}! ${config.bubbleText || ''}`);
        this.updateShape_();
      },
      
      updateShape_: function() {
        const mode = this.getFieldValue('MODE');
        if (this.getInput('CUSTOM_INPUT')) this.removeInput('CUSTOM_INPUT');
        const dropInput = this.getInput('DROP_INPUT');
        
        if (mode === 'custom') {
          if (dropInput) dropInput.setVisible(false);
          this.appendValueInput('CUSTOM_INPUT')
            .setCheck('ENG_WORD')
            .appendField('value');
        } else {
          if (dropInput) dropInput.setVisible(true);
        }
        this.render();
      },
      
      onchange: function(event) {
        if (
          event.type === Blockly.Events.BLOCK_CHANGE &&
          event.blockId === this.id &&
          event.name === 'MODE'
        ) {
          this.updateShape_();
        }
        if (!this.workspace || this.workspace.isDragging()) return;
        
        const mode = this.getFieldValue('MODE');
        if (mode === 'custom' && !this.getInputTargetBlock('CUSTOM_INPUT')) {
          this.setWarningText(`Please attach a word pill to your custom ${config.label}!`);
        } else {
          this.setWarningText(null);
        }
      }
    };
  }
  
  // ═══════════ NOUN ═══════════
  createSpeechBlock({
    type: 'eng_noun',
    label: 'noun',
    colour: '#43A047',
    bubbleText: 'I represent a person, place, thing, or idea.',
    options: [
      ['cat', 'cat'],
      ['teacher', 'teacher'],
      ['book', 'book'],
      ['school', 'school']
    ]
  });
  
  // ═══════════ PRONOUN ═══════════
  createSpeechBlock({
    type: 'eng_pronoun',
    label: 'pronoun',
    colour: '#7CB342',
    bubbleText: 'I take the place of a noun to avoid repeating it.',
    options: [
      ['he', 'he'],
      ['she', 'she'],
      ['they', 'they'],
      ['we', 'we']
    ]
  });
  
  // ═══════════ VERB (ACTION WORD) ═══════════
  createSpeechBlock({
    type: 'eng_action_word',
    label: 'verb',
    colour: '#E53935',
    bubbleText: 'I show action or a state of being.',
    options: [
      ['run', 'run'],
      ['jump', 'jump'],
      ['write', 'write'],
      ['eat', 'eat']
    ]
  });
  
  // ═══════════ ADJECTIVE ═══════════
  createSpeechBlock({
    type: 'eng_adjective',
    label: 'adjective',
    colour: '#8E24AA',
    bubbleText: 'I describe or modify nouns and pronouns.',
    options: [
      ['beautiful', 'beautiful'],
      ['happy', 'happy'],
      ['bright', 'bright']
    ]
  });
  
  // ═══════════ ADVERB ═══════════
  createSpeechBlock({
    type: 'eng_adverb',
    label: 'adverb',
    colour: '#3949AB',
    bubbleText: 'I describe verbs, adjectives, or even other adverbs.',
    options: [
      ['quickly', 'quickly'],
      ['slowly', 'slowly'],
      ['carefully', 'carefully']
    ]
  });
  
  // ═══════════ PREPOSITION ═══════════
  createSpeechBlock({
    type: 'eng_preposition',
    label: 'prep',
    colour: '#00897B',
    bubbleText: 'I show relationships like time, direction, or location.',
    options: [
      ['on', 'on'],
      ['under', 'under'],
      ['inside', 'inside']
    ]
  });
  
  // ═══════════ CONJUNCTION WORD ═══════════
  createSpeechBlock({
    type: 'eng_conjunction_word',
    label: 'conj',
    colour: '#F9A825',
    bubbleText: 'I connect words and ideas together.',
    options: [
      ['and', 'and'],
      ['but', 'but'],
      ['or', 'or'],
      ['because', 'because']
    ]
  });
  
  // ═══════════ INTERJECTION ═══════════
  createSpeechBlock({
    type: 'eng_interjection',
    label: 'interj',
    colour: '#FB8C00',
    bubbleText: 'I express strong sudden emotions!',
    options: [
      ['wow!', 'wow!'],
      ['ouch!', 'ouch!'],
      ['hey!', 'hey!']
    ]
  });
  
  // ═══════════ ARTICLE ═══════════
  createSpeechBlock({
    type: 'eng_article',
    label: 'article',
    colour: '#6D4C41',
    bubbleText: 'I am a special adjective that introduces a noun.',
    options: [
      ['a', 'a'],
      ['an', 'an'],
      ['the', 'the'],
      ['this', 'this']
    ]
  });
})();