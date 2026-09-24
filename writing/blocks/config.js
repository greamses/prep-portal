// ══════════════════════════════════════════════
//  config.js — data, toolboxes, categories & helpers
// ══════════════════════════════════════════════


// ══════════════════════════════════════════════
//  TOOLBOXES
// ══════════════════════════════════════════════

const SENTENCE_TOOLBOX = {
  sentences: [
    'eng_sentence',
    'eng_clause',
    'eng_phrase'
  ],
  parts: [
    'eng_subject',
    'eng_verb',
    'eng_object',
    'eng_predicate',
    'eng_appositive',
    'eng_fragment'
  ],
  words: [
    'eng_word',
    'eng_word_join',
    'eng_word_join3',
    'eng_punctuation_pill'
  ],
  speech: [
    'eng_noun',
    'eng_pronoun',
    'eng_action_word',
    'eng_adjective',
    'eng_adverb',
    'eng_preposition',
    'eng_conjunction_word',
    'eng_interjection',
    'eng_article'
  ],
  figures: [
    'eng_simile',
    'eng_metaphor',
    'eng_personification',
    'eng_hyperbole',
    'eng_idiom',
    'eng_alliteration'
  ],
  connectors: [
    'eng_conjunction',
    'eng_punctuation'
  ]
};

const PARAGRAPH_TOOLBOX = {
  generic: [
    'eng_paragraph',
    'eng_completed_sentence'
  ],
  structure: [
    'eng_topic_sentence',
    'eng_supporting',
    'eng_closing',
    'eng_transition'
  ],
  narrative: [
    'eng_narrative_paragraph',
    'eng_narrative_event',
    'eng_narrative_dialogue',
    'eng_narrative_setting'
  ],
  descriptive: [
    'eng_descriptive_paragraph',
    'eng_descriptive_sensory',
    'eng_descriptive_spatial'
  ],
  persuasive: [
    'eng_persuasive_paragraph',
    'eng_persuasive_argument',
    'eng_persuasive_evidence',
    'eng_persuasive_rebuttal'
  ],
  expository: [
    'eng_expository_paragraph',
    'eng_expository_fact',
    'eng_expository_explanation'
  ]
};

const COMPOSITION_TOOLBOX = {
  narrative: [
    'eng_narrative_composition',
    'eng_narrative_orientation',
    'eng_narrative_complication',
    'eng_narrative_resolution',
    'eng_narrative_coda'
  ],
  descriptive: [
    'eng_descriptive_composition',
    'eng_descriptive_intro',
    'eng_descriptive_sensory',
    'eng_descriptive_conclusion'
  ],
  persuasive: [
    'eng_persuasive_composition',
    'eng_persuasive_intro',
    'eng_persuasive_argument',
    'eng_persuasive_counter',
    'eng_persuasive_conclusion'
  ],
  expository: [
    'eng_nonchron_composition',
    'eng_nonchron_intro',
    'eng_nonchron_paragraph',
    'eng_nonchron_conclusion'
  ],
  balanced: [
    'eng_balanced_composition',
    'eng_balanced_intro',
    'eng_balanced_for',
    'eng_balanced_against',
    'eng_balanced_conclusion'
  ],
  recount: [
    'eng_recount_composition',
    'eng_recount_orientation',
    'eng_recount_event',
    'eng_recount_reorientation'
  ],
  procedure: [
    'eng_procedure_composition',
    'eng_procedure_goal',
    'eng_procedure_materials',
    'eng_procedure_step',
    'eng_procedure_conclusion'
  ],
  explanation: [
    'eng_explanation_composition',
    'eng_explanation_intro',
    'eng_explanation_sequence',
    'eng_explanation_conclusion'
  ],
  generic: [
    'eng_title',
    'eng_completed_paragraph'
  ]
};

// ══════════════════════════════════════════════
//  SIDEBAR CATEGORIES
// ══════════════════════════════════════════════

const SENTENCE_CATS = [
  {
    label: '',
    color: '#0055FF',
    shadow: '#003db3',
    svg: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H5v-2h5v2zm5-4H5v-2h10v2zm3-4H5V7h13v2z" fill="white"/>'
  },
  {
    label: '',
    color: '#2E7D32',
    shadow: '#1a4d1d',
    svg: '<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="white"/>'
  },
  {
    label: '',
    color: '#546E7A',
    shadow: '#37474F',
    svg: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" fill="white"/>'
  },
  {
    label: '',
    color: '#8E24AA',
    shadow: '#5c007a',
    svg: '<path d="M12 2L2 7l10 5 10-5-10-5zm0 7L2 7v10l10 5 10-5V7l-10 2z" fill="white"/>'
  },
  {
    label: '',
    color: '#D81B60',
    shadow: '#880E4F',
    svg: '<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="white"/>'
  },
  {
    label: '',
    color: '#FFB800',
    shadow: '#b38200',
    svg: '<path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4a5 5 0 0 0 0-10z" fill="white"/>'
  }
];

const PARAGRAPH_CATS = [
  {
    label: '',
    color: '#0055FF',
    shadow: '#003db3',
    svg: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 1.5L18.5 8H13V3.5zM12 18h-2v-3H8v-2h2v-2h2v2h2v-2h2v3z" fill="white"/>'
  },
  {
    label: '',
    color: '#FFB800',
    shadow: '#b38200',
    svg: '<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="white"/>'
  },
  {
    label: '',
    color: '#1E88E5',
    shadow: '#1565C0',
    svg: '<path d="M12 2L2 7l10 5 10-5-10-5zm0 7L2 7v10l10 5 10-5V7l-10 2z" fill="white"/>'
  },
  {
    label: '',
    color: '#8E24AA',
    shadow: '#5c007a',
    svg: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" fill="white"/>'
  },
  {
    label: '',
    color: '#D32F2F',
    shadow: '#9a0007',
    svg: '<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="white"/>'
  },
  {
    label: '',
    color: '#00897B',
    shadow: '#005b4f',
    svg: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 1.5L18.5 8H13V3.5zM12 18h-2v-3H8v-2h2v-2h2v2h2v-2h2v3z" fill="white"/>'
  }
];

const COMPOSITION_CATS = [
  {
    label: '',
    color: '#0055FF',
    shadow: '#003db3',
    svg: '<path d="M12 2L2 7l10 5 10-5-10-5zm0 7L2 7v10l10 5 10-5V7l-10 2z" fill="white"/>'
  },
  {
    label: '',
    color: '#8E24AA',
    shadow: '#5c007a',
    svg: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" fill="white"/>'
  },
  {
    label: '',
    color: '#D32F2F',
    shadow: '#9a0007',
    svg: '<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="white"/>'
  },
  {
    label: '',
    color: '#00897B',
    shadow: '#005b4f',
    svg: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 1.5L18.5 8H13V3.5zM12 18h-2v-3H8v-2h2v-2h2v2h2v-2h2v3z" fill="white"/>'
  },
  {
    label: '',
    color: '#5E35B1',
    shadow: '#320b86',
    svg: '<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="white"/>'
  },
  {
    label: '',
    color: '#0277BD',
    shadow: '#004c8c',
    svg: '<path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="white"/>'
  },
  {
    label: '',
    color: '#F57C00',
    shadow: '#bb4d00',
    svg: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H5v-2h5v2zm5-4H5v-2h10v2zm3-4H5V7h13v2z" fill="white"/>'
  },
  {
    label: '',
    color: '#558B2F',
    shadow: '#33691e',
    svg: '<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="white"/>'
  },
  {
    label: '',
    color: '#1E88E5',
    shadow: '#1565C0',
    svg: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/>'
  }
];

// ══════════════════════════════════════════════
//  LITTLE HELPERS
// ══════════════════════════════════════════════

function cap(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function joinWords(a, b) {
  if (!a) return b || '';
  if (!b) return a || '';
  const noSpaceBefore = [',', '.', '!', '?', ';', ':', ')'];
  if (noSpaceBefore.includes(b.trim?.() || b)) {
    return a + b;
  }
  return `${a} ${b}`;
}