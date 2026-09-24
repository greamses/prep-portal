// ══════════════════════════════════════════════
//  modules/clear-all-blocks.js — clear old block types
// ══════════════════════════════════════════════
(function() {
  if (typeof Blockly === 'undefined') return;
  [
    'eng_sentence',
    'eng_clause',
    'eng_subject',
    'eng_verb',
    'eng_object',
    'eng_phrase',
    'eng_fragment',
    'eng_appositive',
    'eng_predicate',
    'eng_conjunction',
    'eng_punctuation',
    'eng_word',
    'eng_word_join',
    'eng_word_join3',
    'eng_punctuation_pill',
    'eng_noun',
    'eng_pronoun',
    'eng_action_word',
    'eng_adjective',
    'eng_adverb',
    'eng_preposition',
    'eng_conjunction_word',
    'eng_interjection',
    'eng_article',
    'eng_simile',
    'eng_metaphor',
    'eng_personification',
    'eng_hyperbole',
    'eng_idiom',
    'eng_alliteration'
  ].forEach(type => { delete Blockly.Blocks[type]; });
})();