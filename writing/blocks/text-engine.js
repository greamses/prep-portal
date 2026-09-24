// ══════════════════════════════════════════════
//  text-engine.js — text generation & highlighting
// ══════════════════════════════════════════════

// Word value extractor
function engValueText(block) {
  if (!block) return '';
  const f = n => block.getFieldValue(n) || '';

  switch (block.type) {

    case 'eng_word':
      return f('TEXT');

    case 'eng_punctuation_pill':
      return f('MARK');

    case 'eng_noun':
    case 'eng_pronoun':
    case 'eng_action_word':
    case 'eng_adjective':
    case 'eng_adverb':
    case 'eng_preposition':
    case 'eng_conjunction_word':
    case 'eng_interjection':
    case 'eng_article': {
      const mode = f('MODE');
      if (mode === 'custom') {
        return engValueText(block.getInputTargetBlock('CUSTOM_INPUT'));
      }
      return f('WORD');
    }

    case 'eng_word_join':
      return joinWords(
        engValueText(block.getInputTargetBlock('A')),
        engValueText(block.getInputTargetBlock('B'))
      );

    case 'eng_word_join3':
      return [
        engValueText(block.getInputTargetBlock('A')),
        engValueText(block.getInputTargetBlock('B')),
        engValueText(block.getInputTargetBlock('C'))
      ].filter(Boolean).join(' ');

    case 'eng_subject':
    case 'eng_verb':
    case 'eng_object':
    case 'eng_predicate':
    case 'eng_fragment':
    case 'eng_appositive':
      return engValueText(block.getInputTargetBlock('WORDS'));

    default:
      return '';
  }
}

function engStmt(parentBlock, inputName) {
  let child = parentBlock.getInputTargetBlock(inputName);
  const parts = [];
  while (child) {
    const t = blockToEngPlain(child).trim();
    if (t) parts.push(t);
    child = child.getNextBlock();
  }
  return parts.join(' ');
}

// Core plain‑text generator
function blockToEngPlain(block) {
  if (!block) return '';
  const f = n => block.getFieldValue(n) || '';

  switch (block.type) {

    // ═══════════ SENTENCE ═══════════
    case 'eng_sentence': {
      let child = block.getInputTargetBlock('CONTENT');
      const parts = [];
      while (child) {
        const t = blockToEngPlain(child).trim();
        if (t) parts.push(t);
        child = child.getNextBlock();
      }
      const punctuation = f('PUNCTUATION');
      const text = joinSentenceParts(parts);
      return text ? cap(text.trim()) + punctuation : '';
    }

    // ═══════════ CLAUSE ═══════════
    case 'eng_clause': {
      const subj = engValueText(block.getInputTargetBlock('SUBJECT'));
      const verb = engValueText(block.getInputTargetBlock('VERB'));
      const obj = engValueText(block.getInputTargetBlock('OBJECT'));
      const extra = engStmt(block, 'EXTRA');
      return [subj, verb, obj, extra].filter(Boolean).join(' ');
    }

    // ═══════════ PHRASE ═══════════
    case 'eng_phrase': {
      const type = f('TYPE');
      if (type === 'noun_phrase') {
        const noun = engValueText(block.getInputTargetBlock('NOUN_INPUT'));
        const extra = engStmt(block, 'CONTENT');
        return [noun, extra].filter(Boolean).join(' ');
      }
      if (type === 'verb_phrase') {
        const verb = engValueText(block.getInputTargetBlock('VERB_INPUT'));
        const extra = engStmt(block, 'CONTENT');
        return [verb, extra].filter(Boolean).join(' ');
      }
      if (type === 'adjective_phrase') {
        const adjective = engValueText(block.getInputTargetBlock('ADJECTIVE_INPUT'));
        const extra = engStmt(block, 'CONTENT');
        return [adjective, extra].filter(Boolean).join(' ');
      }
      if (type === 'adverb_phrase') {
        const adverb = engValueText(block.getInputTargetBlock('ADVERB_INPUT'));
        const extra = engStmt(block, 'CONTENT');
        return [adverb, extra].filter(Boolean).join(' ');
      }
      if (type === 'prepositional') {
        const prep = engValueText(block.getInputTargetBlock('PREP_INPUT'));
        const content = engStmt(block, 'CONTENT');
        return [prep, content].filter(Boolean).join(' ');
      }
      return '';
    }

    // ═══════════ CONJUNCTION (stack connector) ═══════════
    case 'eng_conjunction':
      return f('WORD');

    // ═══════════ PUNCTUATION (stack connector) ═══════════
    case 'eng_punctuation':
      return f('MARK');

    // ═══════════ FRAGMENT ═══════════
    case 'eng_fragment':
      return engValueText(block.getInputTargetBlock('WORDS'));

    // ═══════════ APPOSITIVE ═══════════
    case 'eng_appositive':
      return engValueText(block.getInputTargetBlock('WORDS')) + ',';

    // ═══════════ PREDICATE ═══════════
    case 'eng_predicate': {
      const verb = engValueText(block.getInputTargetBlock('VERB'));
      const content = engStmt(block, 'CONTENT');
      return [verb, content].filter(Boolean).join(' ');
    }

    // ═══════════ FIGURES OF SPEECH ═══════════
    case 'eng_simile': {
      const left = engValueText(block.getInputTargetBlock('LEFT'));
      const right = engValueText(block.getInputTargetBlock('RIGHT'));
      if (left && right) return `${left} like ${right}`;
      // Fallback for old-style similes with WORDS input
      return `like ${engValueText(block.getInputTargetBlock('WORDS'))}`;
    }
    case 'eng_metaphor': {
      const left = engValueText(block.getInputTargetBlock('LEFT'));
      const right = engValueText(block.getInputTargetBlock('RIGHT'));
      if (left && right) return `${left} is ${right}`;
      return engValueText(block.getInputTargetBlock('WORDS'));
    }
    case 'eng_personification': {
      const thing = engValueText(block.getInputTargetBlock('THING'));
      const action = engStmt(block, 'ACTION');
      if (thing && action) return `${thing} ${action}`;
      return engValueText(block.getInputTargetBlock('WORDS'));
    }
    case 'eng_hyperbole': {
      const content = engStmt(block, 'CONTENT');
      if (content) return content;
      return engValueText(block.getInputTargetBlock('WORDS'));
    }
    case 'eng_idiom': {
      const words = engValueText(block.getInputTargetBlock('WORDS'));
      const meaning = f('MEANING');
      if (words && meaning && meaning !== 'meaning') return `${words} (meaning: ${meaning})`;
      return words;
    }
    case 'eng_alliteration': {
      const content = engStmt(block, 'CONTENT');
      if (content) return content;
      return engValueText(block.getInputTargetBlock('WORDS'));
    }

    // ═══════════ WORD & SPEECH BLOCKS ═══════════
    case 'eng_word':
    case 'eng_noun':
    case 'eng_pronoun':
    case 'eng_action_word':
    case 'eng_adjective':
    case 'eng_adverb':
    case 'eng_preposition':
    case 'eng_conjunction_word':
    case 'eng_interjection':
    case 'eng_article':
    case 'eng_word_join':
    case 'eng_word_join3':
    case 'eng_punctuation_pill':
      return engValueText(block);

    // ═══════════ PARAGRAPH ═══════════
    case 'eng_paragraph': {
      let child = block.getInputTargetBlock('SENTENCES');
      const sentences = [];
      while (child) {
        const t = blockToEngPlain(child).trim();
        if (t) sentences.push(t);
        child = child.getNextBlock();
      }
      return sentences.join(' ');
    }

    // ═══════════ PARAGRAPH STRUCTURE ═══════════
    case 'eng_topic_sentence':
    case 'eng_supporting':
    case 'eng_closing':
      return engStmt(block, 'CONTENT');

    case 'eng_transition':
      return f('PHRASE');

    case 'eng_completed_sentence':
    case 'eng_completed_paragraph':
      return f('TEXT');

    case 'eng_title':
      return f('TITLE');

    // ═══════════ COMPOSITION CONTAINERS ═══════════
    case 'eng_composition':
    case 'eng_narrative_composition':
    case 'eng_descriptive_composition':
    case 'eng_persuasive_composition':
    case 'eng_nonchron_composition':
    case 'eng_balanced_composition':
    case 'eng_recount_composition':
    case 'eng_procedure_composition':
    case 'eng_explanation_composition': {
      const inputName = block.getInput('ELEMENTS') ? 'ELEMENTS' :
                        block.getInput('PARAGRAPHS') ? 'PARAGRAPHS' : null;
      if (!inputName) return '';

      let child = block.getInputTargetBlock(inputName);
      const items = [];
      while (child) {
        const t = blockToEngPlain(child).trim();
        if (t) items.push(t);
        child = child.getNextBlock();
      }
      return items.join('\n\n');
    }

    // ═══════════ NARRATIVE ELEMENTS ═══════════
    case 'eng_narrative_orientation':
    case 'eng_narrative_complication':
    case 'eng_narrative_resolution':
    case 'eng_narrative_coda':
    // ═══════════ DESCRIPTIVE ELEMENTS ═══════════
    case 'eng_descriptive_intro':
    case 'eng_descriptive_sensory':
    case 'eng_descriptive_conclusion':
    // ═══════════ PERSUASIVE ELEMENTS ═══════════
    case 'eng_persuasive_intro':
    case 'eng_persuasive_argument':
    case 'eng_persuasive_counter':
    case 'eng_persuasive_conclusion':
    // ═══════════ EXPOSITORY ELEMENTS ═══════════
    case 'eng_nonchron_intro':
    case 'eng_nonchron_paragraph':
    case 'eng_nonchron_conclusion':
    // ═══════════ BALANCED REPORT ELEMENTS ═══════════
    case 'eng_balanced_intro':
    case 'eng_balanced_for':
    case 'eng_balanced_against':
    case 'eng_balanced_conclusion':
    // ═══════════ RECOUNT ELEMENTS ═══════════
    case 'eng_recount_orientation':
    case 'eng_recount_event':
    case 'eng_recount_reorientation':
    // ═══════════ PROCEDURE ELEMENTS ═══════════
    case 'eng_procedure_goal':
    case 'eng_procedure_materials':
    case 'eng_procedure_step':
    case 'eng_procedure_conclusion':
    // ═══════════ EXPLANATION ELEMENTS ═══════════
    case 'eng_explanation_intro':
    case 'eng_explanation_sequence':
    case 'eng_explanation_conclusion':
      return engStmt(block, 'CONTENT');

    default:
      return '';
  }
}

// ══════════════════════════════════════════════
//  SMART SENTENCE JOINER
//  Handles conjunctions and punctuation without
//  adding extra spaces before punctuation marks
// ══════════════════════════════════════════════

function joinSentenceParts(parts) {
  if (!parts.length) return '';

  let result = '';
  const noSpaceBefore = [',', '.', '!', '?', ';', ':', ')', '—', '...'];
  const noSpaceAfter = ['(', '—'];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const nextPart = parts[i + 1]?.trim() || '';

    // Add the part
    result += part;

    // Determine if we need a space before the next part
    let needsSpace = true;

    // No space if next part starts with punctuation
    for (const punct of noSpaceBefore) {
      if (nextPart.startsWith(punct)) {
        needsSpace = false;
        break;
      }
    }

    // No space if current part ends with opening punctuation
    for (const punct of noSpaceAfter) {
      if (part.endsWith(punct)) {
        needsSpace = false;
        break;
      }
    }

    // Punctuation marks that are standalone (like comma, semicolon)
    // should attach directly to the previous word
    if (noSpaceBefore.includes(part)) {
      // This part *is* punctuation — remove the trailing space we already added
      // and replace with nothing (already attached via joinSentenceParts logic)
      needsSpace = true; // space AFTER this punctuation, before next word
    }

    if (i < parts.length - 1 && needsSpace) {
      result += ' ';
    }
  }

  return result;
}

// ══════════════════════════════════════════════
//  ANNOTATED VIEWS
// ══════════════════════════════════════════════

function blockToEngAnnotated(block, indent = 0) {
  if (!block) return '';
  const pad = '  '.repeat(indent);
  const f = n => block.getFieldValue(n) || '';

  switch (block.type) {
    case 'eng_sentence': {
      let child = block.getInputTargetBlock('CONTENT');
      let out = `${pad}[SENTENCE]\n`;
      while (child) {
        out += blockToEngAnnotated(child, indent + 1);
        child = child.getNextBlock();
      }
      const plain = blockToEngPlain(block);
      if (plain) out += `${pad}  → "${plain}"\n`;
      return out + '\n';
    }
    case 'eng_clause': {
      let out = `${pad}[CLAUSE: ${f('TYPE')}]\n`;
      const subj = block.getInputTargetBlock('SUBJECT');
      const verb = block.getInputTargetBlock('VERB');
      const obj = block.getInputTargetBlock('OBJECT');
      if (subj) out += `${pad}  Subject: ${engValueText(subj)}\n`;
      if (verb) out += `${pad}  Verb: ${engValueText(verb)}\n`;
      if (obj) out += `${pad}  Object: ${engValueText(obj)}\n`;
      const plain = blockToEngPlain(block);
      if (plain) out += `${pad}  → "${plain}"\n`;
      return out + '\n';
    }
    case 'eng_conjunction':
      return `${pad}[CONJ: ${f('WORD')}]\n`;
    case 'eng_punctuation':
      return `${pad}[PUNCT: "${f('MARK')}"]\n`;
    default:
      return '';
  }
}

function blockToParaAnnotated(block, indent = 0) {
  if (!block) return '';
  const pad = '  '.repeat(indent);
  const f = n => block.getFieldValue(n) || '';

  switch (block.type) {
    case 'eng_paragraph': {
      let ch = block.getInputTargetBlock('SENTENCES');
      let out = `${pad}[PARAGRAPH]\n`;
      while (ch) {
        out += blockToParaAnnotated(ch, indent + 1);
        ch = ch.getNextBlock();
      }
      return out + '\n';
    }
    case 'eng_topic_sentence':
      return `${pad}   Topic: "${cap(engStmt(block, 'CONTENT'))}"\n`;
    case 'eng_supporting':
      return `${pad}   Support #${f('NUM')}: "${cap(engStmt(block, 'CONTENT'))}"\n`;
    case 'eng_closing':
      return `${pad}   Closing: "${cap(engStmt(block, 'CONTENT'))}"\n`;
    case 'eng_transition':
      return `${pad}   Transition: "${f('PHRASE')}"\n`;
    case 'eng_sentence':
      return `${pad}   Sentence: "${blockToEngPlain(block)}"\n`;
    case 'eng_completed_sentence':
      return `${pad}   Sentence: "${f('TEXT')}"\n`;
    default:
      return '';
  }
}

function blockToCompAnnotated(block, indent = 0) {
  if (!block) return '';
  const pad = '  '.repeat(indent);
  const f = n => block.getFieldValue(n) || '';

  switch (block.type) {

    // All composition containers
    case 'eng_composition':
    case 'eng_narrative_composition':
    case 'eng_descriptive_composition':
    case 'eng_persuasive_composition':
    case 'eng_nonchron_composition':
    case 'eng_balanced_composition':
    case 'eng_recount_composition':
    case 'eng_procedure_composition':
    case 'eng_explanation_composition': {
      const containerLabel = block.type.replace('eng_', '').replace('_composition', '').toUpperCase();
      const inputName = block.getInput('ELEMENTS') ? 'ELEMENTS' :
                        block.getInput('PARAGRAPHS') ? 'PARAGRAPHS' : null;
      if (!inputName) return '';

      let ch = block.getInputTargetBlock(inputName);
      let out = `${pad}[${containerLabel}]\n`;
      while (ch) {
        out += blockToCompAnnotated(ch, indent + 1);
        ch = ch.getNextBlock();
      }
      return out + '\n';
    }

    // All composition structural elements
    case 'eng_narrative_orientation':
    case 'eng_narrative_complication':
    case 'eng_narrative_resolution':
    case 'eng_narrative_coda':
    case 'eng_descriptive_intro':
    case 'eng_descriptive_sensory':
    case 'eng_descriptive_conclusion':
    case 'eng_persuasive_intro':
    case 'eng_persuasive_argument':
    case 'eng_persuasive_counter':
    case 'eng_persuasive_conclusion':
    case 'eng_nonchron_intro':
    case 'eng_nonchron_paragraph':
    case 'eng_nonchron_conclusion':
    case 'eng_balanced_intro':
    case 'eng_balanced_for':
    case 'eng_balanced_against':
    case 'eng_balanced_conclusion':
    case 'eng_recount_orientation':
    case 'eng_recount_event':
    case 'eng_recount_reorientation':
    case 'eng_procedure_goal':
    case 'eng_procedure_materials':
    case 'eng_procedure_step':
    case 'eng_procedure_conclusion':
    case 'eng_explanation_intro':
    case 'eng_explanation_sequence':
    case 'eng_explanation_conclusion': {
      const blockLabel = block.type
        .replace('eng_', '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      const text = engStmt(block, 'CONTENT');
      return `${pad}   ${blockLabel}: "${cap(text)}"\n`;
    }

    case 'eng_completed_paragraph':
      return `${pad}   Paragraph: "${f('TEXT')}"\n`;
    case 'eng_title':
      return `${pad}   Title: "${f('TITLE')}"\n`;
    default:
      return '';
  }
}

// ══════════════════════════════════════════════
//  WORKSPACE‑WIDE GENERATORS
// ══════════════════════════════════════════════

function getGeneratorText(ws, plainFunc) {
  if (!ws) return '';
  let out = '';
  ws.getTopBlocks(true).forEach(b => {
    let curr = b;
    while (curr) {
      const t = plainFunc(curr);
      if (t) out += t;
      curr = curr.getNextBlock();
    }
  });
  return out;
}

const generateSentencesAnnotated = () =>
  getGeneratorText(workspaceSentences, blockToEngAnnotated);

const generateSentencesPlain = () =>
  getGeneratorText(workspaceSentences, b => {
    const t = blockToEngPlain(b).trim();
    return t ? t + '\n' : '';
  });

const generateParagraphsAnnotated = () =>
  getGeneratorText(workspaceParagraphs, blockToParaAnnotated);

const generateParagraphsPlain = () =>
  getGeneratorText(workspaceParagraphs, b => {
    const t = blockToEngPlain(b).trim();
    return t ? t + '\n' : '';
  });

const generateCompositionAnnotated = () =>
  getGeneratorText(workspaceComposition, blockToCompAnnotated);

const generateCompositionPlain = () =>
  getGeneratorText(workspaceComposition, b => {
    const t = blockToEngPlain(b).trim();
    return t ? t + '\n\n' : '';
  });

// ══════════════════════════════════════════════
//  PREVIEW HTML
// ══════════════════════════════════════════════

function generatePreviewHTML() {
  const sentencesText = generateSentencesPlain().trim();
  const paragraphsText = generateParagraphsPlain().trim();
  const compText = generateCompositionPlain().trim();

  if (!sentencesText && !paragraphsText && !compText) return '';

  const sentenceHTML = sentencesText
    ? sentencesText.split('\n').filter(Boolean).map(s => `<span class="sentence">${s.trim()}</span>`).join(' ')
    : '';
  const paraHTML = paragraphsText
    ? paragraphsText.split('\n').filter(Boolean).map(p => `<div class="paragraph">${p.trim()}</div>`).join('\n')
    : '';
  const compHTML = compText
    ? compText.split('\n\n').filter(Boolean).map(p => `<div class="paragraph">${p.trim()}</div>`).join('\n')
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body{ font-family:Georgia,'Times New Roman',serif; max-width:640px; margin:40px auto; padding:24px 32px; line-height:1.9; color:#1a1a1a; background:#fffef8; }
.section-label{ font-family:'JetBrains Mono',monospace; font-size:0.6rem; text-transform:uppercase; letter-spacing:0.12em; color:#bbb; border-bottom:1px solid #eee; padding-bottom:6px; margin:28px 0 14px; }
.sentence{ margin-right:4px; }
.paragraph{ text-indent:2.5em; margin-bottom:18px; }
</style>
</head>
<body>
${sentenceHTML ? `<div class="section-label">Sentences</div><div class="sentences-block">${sentenceHTML}</div>` : ''}
${paraHTML ? `<div class="section-label">Paragraphs</div>${paraHTML}` : ''}
${compHTML ? `<div class="section-label">Full Text</div>${compHTML}` : ''}
</body>
</html>`;
}

// ══════════════════════════════════════════════
//  HIGHLIGHTERS (for code view)
// ══════════════════════════════════════════════

function highlightHTML(raw, label, emptyMsg) {
  if (!raw || !raw.trim()) return `<span class="empty">// ${emptyMsg}</span>`;
  let s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  s = s.replace(new RegExp(`\\[${label}\\]`, 'g'), `<span class="ct">[${label}]</span>`);
  s = s.replace(/(Subject|Verb|Object|Extra)(\s*(?:\([^)]*\))?\s*):/g, '<span class="ca">$1$2:</span>');
  s = s.replace(/(→\s*&quot;[^&]*&quot;)/g, '<span class="cv">$1</span>');
  s = s.replace(/(&quot;[^&]*&quot;)/g, '<span class="cv">$1</span>');
  return s;
}

const highlightWriting = (raw) => highlightHTML(raw, 'SENTENCE', 'Drag Sentence blocks here...');
const highlightParagraph = (raw) => highlightHTML(raw, 'PARAGRAPH', 'Drag Paragraph blocks here...');
const highlightComposition = (raw) => highlightHTML(raw, 'COMPOSITION', 'Drag Full Text blocks here...');