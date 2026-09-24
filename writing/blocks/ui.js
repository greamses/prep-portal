// ══════════════════════════════════════════════
//  ui.js — sidebar, language/tab switching, preview & code
// ══════════════════════════════════════════════

function buildSidebar() {
  const mkItems = (cats, lang) =>
    cats
    .map(
      (c, i) => `
      <div class="side-item ${i === 0 ? 'active' : ''}" onclick="selectCat(${i}, '${lang}')">
        <div class="side-sq" style="background:${(window.BlockStudioTheme && BlockStudioTheme.accent(c.color)) || c.color}">
          <svg viewBox="0 0 24 24">${c.svg}</svg>
        </div>
      </div>
    `
    )
    .join('');
  
  document.getElementById('icon-sidebar-sentences').innerHTML = mkItems(SENTENCE_CATS, 'sentences');
  document.getElementById('icon-sidebar-paragraphs').innerHTML = mkItems(PARAGRAPH_CATS, 'paragraphs');
  document.getElementById('icon-sidebar-composition').innerHTML = mkItems(COMPOSITION_CATS, 'composition');
}

function selectCat(idx, lang) {
  const sb = document.getElementById(`icon-sidebar-${lang}`);
  if (!sb) return;
  sb.querySelectorAll('.side-item').forEach((el, i) => el.classList.toggle('active', i === idx));
  const wsMap = { sentences: workspaceSentences, paragraphs: workspaceParagraphs, composition: workspaceComposition };
  const ws = wsMap[lang];
  if (ws && ws.getToolbox()) ws.getToolbox().selectItemByPosition(idx);
}

function setLangMode(lang) {
  currentLangMode = lang;
  ['sentences', 'paragraphs', 'composition'].forEach(l => {
    document.getElementById(`btn-lang-${l}`)?.classList.toggle('active', lang === l);
    document.getElementById(`icon-sidebar-${l}`)?.classList.toggle('hidden', lang !== l);
    document.getElementById(`blocklyDiv-${l}`)?.classList.toggle('hidden', lang !== l);
  });
  
  if (lang === 'sentences' && workspaceSentences) Blockly.svgResize(workspaceSentences);
  if (lang === 'paragraphs' && workspaceParagraphs) Blockly.svgResize(workspaceParagraphs);
  if (lang === 'composition' && workspaceComposition) Blockly.svgResize(workspaceComposition);
  
  if (activeTab === 'code') updateCode();
}

function switchTab(tab) {
  activeTab = tab;
  ['blocks', 'preview', 'code'].forEach(t =>
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab)
  );
  document.getElementById('preview-panel')?.classList.toggle('hidden', tab !== 'preview');
  document.getElementById('code-panel')?.classList.toggle('hidden', tab !== 'code');
  if (tab === 'preview') updatePreview();
  if (tab === 'code') updateCode();
}

function updatePreview() {
  const htmlDoc = generatePreviewHTML();
  const iframe = document.getElementById('preview-iframe');
  const empty = document.getElementById('preview-empty');
  if (!iframe || !empty) return;
  if (htmlDoc.trim()) {
    iframe.style.display = 'block';
    empty.style.display = 'none';
    iframe.srcdoc = htmlDoc;
  } else {
    iframe.style.display = 'none';
    empty.style.display = 'flex';
  }
}

function updateCode() {
  const pre = document.getElementById('code-output');
  const lnums = document.getElementById('line-nums');
  const cnt = document.getElementById('code-line-count');
  const fileName = document.querySelector('.file-name');
  let code = '';
  
  if (currentLangMode === 'sentences') {
    code = generateSentencesAnnotated();
    if (fileName) fileName.textContent = 'sentences.txt';
    pre.innerHTML = highlightWriting(code);
  } else if (currentLangMode === 'paragraphs') {
    code = generateParagraphsAnnotated();
    if (fileName) fileName.textContent = 'paragraphs.txt';
    pre.innerHTML = highlightParagraph(code);
  } else {
    code = generateCompositionAnnotated();
    if (fileName) fileName.textContent = 'full_text.txt';
    pre.innerHTML = highlightComposition(code);
  }
  
  const lines = code ? code.trim().split('\n').length : 0;
  cnt.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
  lnums.textContent = code ? Array.from({ length: lines }, (_, i) => i + 1).join('\n') : '';
}