// ══════════════════════════════════════════════
//  css-generator.js – CSS block → code
// ══════════════════════════════════════════════

function getSelectorString(block) {
  if (!block) return '';
  const f = name => block.getFieldValue(name) || '';
  switch (block.type) {
    case 'css_selector_tag':
      return f('TAG');
    case 'css_selector_class':
      return '.' + f('CLASS');
    case 'css_selector_id':
      return '#' + f('ID');
    case 'css_selector_pseudo':
      return f('PSEUDO');
    case 'css_selector_attr':
      return `[${f('ATTR')}="${f('VALUE')}"]`;
    case 'css_selector_combinator': {
      const left = getSelectorString(block.getInputTargetBlock('LEFT'));
      const right = getSelectorString(block.getInputTargetBlock('RIGHT'));
      return left + f('COMBINATOR') + right;
    }
    default:
      return '';
  }
}

function getColorString(block) {
  if (!block) return '#ff0000';
  switch (block.type) {
    case 'css_color_value_named':
      return block.getFieldValue('COLOR') || 'red';
    case 'css_color_value_picker':
      return block.getFieldValue('COLOR') || '#ff0000';
    case 'css_color_value_hex':
      return '#' + (block.getFieldValue('HEX') || 'ff0000');
    case 'css_color_value_rgb': {
      const r = block.getFieldValue('R') || 0;
      const g = block.getFieldValue('G') || 0;
      const b = block.getFieldValue('B') || 0;
      return `rgb(${r}, ${g}, ${b})`;
    }
    default:
      return '#ff0000';
  }
}

function blockToCSS(block, indent = 0) {
  if (!block) return '';
  const pad = '  '.repeat(indent);
  const f = n => (block.getFieldValue(n) || '');
  const stmt = (name, ind) => {
    let child = block.getInputTargetBlock(name);
    let out = '';
    while (child) {
      out += blockToCSS(child, ind);
      child = child.getNextBlock();
    }
    return out;
  };
  
  switch (block.type) {
    case 'css_rule': {
      const selBlock = block.getInputTargetBlock('SELECTOR');
      const selector = selBlock ? getSelectorString(selBlock) : '';
      if (!selector) return '';
      
      // Fix: Dynamically locate the statement input name so it always finds the properties
      // (Handles "BODY", "PROPS", "STACK", or any custom name used in the block definition)
      let stmtName = 'STACK';
      if (block.inputList) {
        const statementInput = block.inputList.find(
          (inp) => inp.type === Blockly.NEXT_STATEMENT || inp.type === 3 || inp.type === 5
        );
        if (statementInput) {
          stmtName = statementInput.name;
        }
      }

      return `${pad}${selector} {\n${stmt(stmtName, indent + 1)}${pad}}\n`;
    }
    case 'css_display':
      return `${pad}display: ${f('VAL')};\n`;
    case 'css_box_model':
      return `${pad}${f('PROP')}: ${f('VAL')};\n`;
    case 'css_size':
      return `${pad}${f('PROP')}: ${f('VAL')};\n`;
    case 'css_color': {
      const valBlock = block.getInputTargetBlock('VAL');
      return `${pad}color: ${valBlock ? getColorString(valBlock) : f('VAL')};\n`;
    }
    case 'css_bg_color': {
      const valBlock = block.getInputTargetBlock('VAL');
      return `${pad}background-color: ${getColorString(valBlock)};\n`;
    }
    case 'css_border': {
      const colorBlock = block.getInputTargetBlock('COLOR');
      return `${pad}border: ${f('WIDTH') || '1px'} ${f('STYLE') || 'solid'} ${getColorString(colorBlock)};\n`;
    }
    case 'css_custom':
      return `${pad}${f('PROP')}: ${f('VAL')};\n`;
    case 'css_transition':
      return `${pad}transition: ${f('VAL')};\n`;
    case 'css_transform':
      return `${pad}transform: ${f('VAL')};\n`;
    default:
      return '';
  }
}

function generateCSSCode() {
  if (!workspaceCss) return '';
  let out = '';
  workspaceCss.getTopBlocks(true).forEach(b => {
    let curr = b;
    while (curr) {
      if (!BlockSync.isInternalContainer(curr)) {
        out += blockToCSS(curr, 0);
      }
      curr = curr.getNextBlock();
    }
  });
  return out;
}

function highlightCSS(raw) {
  if (!raw || !raw.trim()) return '<span class="empty">/* Place blocks to generate CSS */</span>';
  let s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  s = s.replace(/^([^{]+)(\s*\{)/gm, '<span class="ct">$1</span>$2');
  s = s.replace(/([a-zA-Z-]+)\s*:\s*([^;]+);/g, '<span class="ca">$1</span>: <span class="cv">$2</span>;');
  return s;
}

